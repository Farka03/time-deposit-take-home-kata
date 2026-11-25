import { StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { DataSource } from 'typeorm'
import { postgresOptions } from '../../adapter/out/persistence/postgresOptions'
import { CONTAINER_TIMEOUT_MS, connectionOf, startPostgres } from './support/postgres'

describe('database schema', () => {
  let container: StartedPostgreSqlContainer
  let dataSource: DataSource

  beforeAll(async () => {
    container = await startPostgres()
    dataSource = await new DataSource(postgresOptions(connectionOf(container))).initialize()
  }, CONTAINER_TIMEOUT_MS)

  afterAll(async () => {
    await dataSource?.destroy()
    await container?.stop()
  })

  const columnsOf = async (table: string): Promise<[string, string, boolean][]> => {
    const rows = await dataSource.query(
      `SELECT attname AS name, format_type(atttypid, atttypmod) AS type, attnotnull AS required
         FROM pg_attribute
        WHERE attrelid = $1::regclass AND attnum > 0 AND NOT attisdropped
        ORDER BY attnum`,
      [`"${table}"`],
    )
    return rows.map((c: { name: string; type: string; required: boolean }) => [
      c.name,
      c.type,
      c.required,
    ])
  }

  test('defines timeDeposits as required', async () => {
    expect(await columnsOf('timeDeposits')).toEqual([
      ['id', 'integer', true],
      ['planType', 'character varying', true],
      ['days', 'integer', true],
      ['balance', 'numeric(19,2)', true],
    ])
  })

  test('defines withdrawals as required, referencing timeDeposits', async () => {
    expect(await columnsOf('withdrawals')).toEqual([
      ['id', 'integer', true],
      ['timeDepositId', 'integer', true],
      ['amount', 'numeric(19,2)', true],
      ['date', 'date', true],
    ])
    await expect(
      dataSource.query(
        `INSERT INTO "withdrawals" ("timeDepositId", "amount", "date") VALUES (999, 1, '2026-01-01')`,
      ),
    ).rejects.toThrow(/FK_withdrawals_timeDeposits/)
  })

  test('entity mappings match the migrations', async () => {
    const pending = await dataSource.driver.createSchemaBuilder().log()

    expect(pending.upQueries.map((q) => q.query)).toEqual([])
  })
})
