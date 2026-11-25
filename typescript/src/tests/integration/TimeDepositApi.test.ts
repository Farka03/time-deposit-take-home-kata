import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import request from 'supertest'
import { DataSource } from 'typeorm'
import { TimeDepositModule } from '../../TimeDepositModule'
import { loadContract, serveContract } from '../../adapter/in/http/openApiContract'
import {
  CONTAINER_TIMEOUT_MS,
  connectionOf,
  insertDeposits,
  startPostgres,
  truncateAll,
} from './support/postgres'

describe('Time deposit API', () => {
  let container: StartedPostgreSqlContainer
  let app: INestApplication
  let dataSource: DataSource

  beforeAll(async () => {
    container = await startPostgres()
    const moduleRef = await Test.createTestingModule({
      imports: [TimeDepositModule.forPostgres(connectionOf(container))],
    }).compile()
    app = moduleRef.createNestApplication()
    serveContract(app)
    await app.init()
    dataSource = app.get(DataSource)
  }, CONTAINER_TIMEOUT_MS)

  afterAll(async () => {
    await app?.close()
    await container?.stop()
  })

  beforeEach(() => truncateAll(dataSource))

  const http = () => request(app.getHttpServer())

  const waitUntilABackendWaitsForALock = async () => {
    for (let attempt = 0; attempt < 100; attempt++) {
      const [{ waiting }] = await dataSource.query(
        `SELECT count(*)::int AS waiting FROM pg_stat_activity WHERE wait_event_type = 'Lock'`,
      )
      if (waiting > 0) return
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    throw new Error('No backend is waiting for a lock')
  }

  describe('GET /time-deposits', () => {
    test('returns every deposit with its withdrawals', async () => {
      await insertDeposits(dataSource, [
        {
          planType: 'basic',
          balance: 1234567,
          days: 45,
          withdrawals: [
            { amount: 100.25, date: '2026-09-30' },
            { amount: 50, date: '2026-10-31' },
          ],
        },
        { planType: 'premium', balance: 2500.5, days: 10 },
      ])

      const response = await http().get('/time-deposits').expect(200)

      expect(response.body).toEqual([
        {
          id: 1,
          planType: 'basic',
          balance: 1234567,
          days: 45,
          withdrawals: [
            { id: 1, amount: 100.25, date: '2026-09-30' },
            { id: 2, amount: 50, date: '2026-10-31' },
          ],
        },
        { id: 2, planType: 'premium', balance: 2500.5, days: 10, withdrawals: [] },
      ])
    })

    test('matches the OpenAPI contract', async () => {
      await insertDeposits(dataSource, [
        {
          planType: 'student',
          balance: 10,
          days: 31,
          withdrawals: [{ amount: 1, date: '2026-01-01' }],
        },
      ])
      const ajv = new Ajv({ strict: false, allErrors: true })
      addFormats(ajv)
      ajv.addSchema(loadContract(), 'contract')
      const validate = ajv.compile({
        type: 'array',
        items: { $ref: 'contract#/components/schemas/TimeDeposit' },
      })

      const response = await http().get('/time-deposits').expect(200)

      expect(validate(response.body) ? [] : validate.errors).toEqual([])
    })

    test('returns an empty list when there are no deposits', async () => {
      await http().get('/time-deposits').expect(200, [])
    })
  })

  describe('POST /time-deposits/balance-updates', () => {
    const balances = async () =>
      (await http().get('/time-deposits').expect(200)).body.map(
        (d: { planType: string; days: number; balance: number }) => [d.planType, d.days, d.balance],
      )

    test('adds one month of interest according to each plan', async () => {
      await insertDeposits(dataSource, [
        { planType: 'basic', balance: 10000, days: 30 },
        { planType: 'basic', balance: 10000, days: 31 },
        { planType: 'student', balance: 10000, days: 365 },
        { planType: 'student', balance: 10000, days: 366 },
        { planType: 'premium', balance: 10000, days: 45 },
        { planType: 'premium', balance: 10000, days: 46 },
        { planType: 'gold', balance: 10000, days: 100 },
      ])

      await http().post('/time-deposits/balance-updates').expect(204, '')

      expect(await balances()).toEqual([
        ['basic', 30, 10000],
        ['basic', 31, 10008.33],
        ['student', 365, 10025],
        ['student', 366, 10000],
        ['premium', 45, 10000],
        ['premium', 46, 10041.67],
        ['gold', 100, 10000],
      ])
    })

    test('stores balances with two decimal places', async () => {
      // The calculator yields 6.609999999999999 for this deposit.
      await insertDeposits(dataSource, [{ planType: 'basic', balance: 6.6, days: 100 }])

      await http().post('/time-deposits/balance-updates').expect(204)

      const [{ balance }] = await dataSource.query('SELECT "balance" FROM "timeDeposits"')
      expect(balance).toBe('6.61')
    })

    test('keeps withdrawals and days unchanged', async () => {
      await insertDeposits(dataSource, [
        {
          planType: 'basic',
          balance: 1200,
          days: 31,
          withdrawals: [{ amount: 5, date: '2026-11-01' }],
        },
      ])

      await http().post('/time-deposits/balance-updates').expect(204)

      const [deposit] = (await http().get('/time-deposits').expect(200)).body
      expect(deposit).toEqual({
        id: 1,
        planType: 'basic',
        balance: 1201,
        days: 31,
        withdrawals: [{ id: 1, amount: 5, date: '2026-11-01' }],
      })
    })

    test('does not overwrite a balance changed by a concurrent transaction', async () => {
      await insertDeposits(dataSource, [{ planType: 'basic', balance: 12000, days: 31 }])
      const concurrent = dataSource.createQueryRunner()
      await concurrent.startTransaction()
      await concurrent.query('SELECT 1 FROM "timeDeposits" FOR UPDATE')

      const update = http()
        .post('/time-deposits/balance-updates')
        .then((r) => r.status)
      await waitUntilABackendWaitsForALock()
      await concurrent.query('UPDATE "timeDeposits" SET "balance" = 24000')
      await concurrent.commitTransaction()
      await concurrent.release()

      expect(await update).toBe(204)
      // Interest is calculated on the committed 24000, not on the stale 12000.
      expect(await balances()).toEqual([['basic', 31, 24020]])
    })
  })

  test('serves the contract through Swagger', async () => {
    const response = await http().get('/swagger-json').expect(200)

    expect(response.body).toEqual(loadContract())
  })
})
