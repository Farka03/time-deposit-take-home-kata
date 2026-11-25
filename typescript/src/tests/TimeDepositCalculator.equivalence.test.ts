import fc from 'fast-check'
import { TimeDeposit } from '../TimeDeposit'
import { TimeDepositCalculator } from '../TimeDepositCalculator'
import { LegacyTimeDepositCalculator } from './support/LegacyTimeDepositCalculator'

const deposit = fc.record({
  id: fc.integer(),
  planType: fc.oneof(fc.constantFrom('basic', 'student', 'premium'), fc.string()),
  balance: fc.oneof(
    fc.integer({ min: 0, max: 100_000_000_00 }).map((cents) => cents / 100),
    fc.double(),
  ),
  days: fc.oneof(fc.integer({ min: 0, max: 800 }), fc.double()),
})

type DepositRecord = typeof deposit extends fc.Arbitrary<infer T> ? T : never

const toTimeDeposits = (records: DepositRecord[]) =>
  records.map((r) => new TimeDeposit(r.id, r.planType, r.balance, r.days))

test('produces exactly the same balances as the original implementation', () => {
  fc.assert(
    fc.property(fc.array(deposit, { maxLength: 20 }), (records) => {
      const expected = toTimeDeposits(records)
      const actual = toTimeDeposits(records)

      new LegacyTimeDepositCalculator().updateBalance(expected)
      new TimeDepositCalculator().updateBalance(actual)

      actual.forEach((d, i) => expect(Object.is(d.balance, expected[i].balance)).toBe(true))
    }),
    { numRuns: 5000 },
  )
})
