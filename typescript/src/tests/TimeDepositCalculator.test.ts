import { TimeDeposit } from '../TimeDeposit'
import { TimeDepositCalculator } from '../TimeDepositCalculator'

// Expected balances were captured from the original implementation and are
// compared with toBe on purpose: the refactoring must not change a single bit.
describe('TimeDepositCalculator.updateBalance', () => {
  const updated = (planType: string, balance: number, days: number): number => {
    const deposit = new TimeDeposit(1, planType, balance, days)
    new TimeDepositCalculator().updateBalance([deposit])
    return deposit.balance
  }

  test('Should update balance', () => {
    expect(updated('basic', 1234567.0, 45)).toBe(1235595.81)
  })

  test.each([
    ['basic', 30, 10000],
    ['basic', 31, 10008.33],
    ['basic', 1000, 10008.33],
    ['student', 30, 10000],
    ['student', 31, 10025],
    ['student', 365, 10025],
    ['student', 366, 10000],
    ['premium', 30, 10000],
    ['premium', 45, 10000],
    ['premium', 46, 10041.67],
  ])('%s plan after %i days', (planType, days, expected) => {
    expect(updated(planType, 10000, days)).toBe(expected)
  })

  test.each([['gold'], ['Basic'], ['']])('leaves unknown plan "%s" untouched', (planType) => {
    expect(updated(planType, 10000, 100)).toBe(10000)
  })

  test.each([
    ['basic', 6, 6.01],
    ['basic', 6.6, 6.609999999999999],
    ['premium', 0.1, 0.1],
    ['student', 1000.5, 1003],
    ['basic', 0, 0],
  ])('rounds %s interest on %d to cents before adding it', (planType, balance, expected) => {
    expect(updated(planType, balance, 100)).toBe(expected)
  })

  test('updates every deposit in place', () => {
    const deposits = [
      new TimeDeposit(1, 'basic', 10000, 31),
      new TimeDeposit(2, 'student', 10000, 31),
      new TimeDeposit(3, 'premium', 10000, 46),
    ]

    new TimeDepositCalculator().updateBalance(deposits)

    expect(deposits.map((d) => d.balance)).toEqual([10008.33, 10025, 10041.67])
    expect(deposits.map((d) => [d.id, d.planType, d.days])).toEqual([
      [1, 'basic', 31],
      [2, 'student', 31],
      [3, 'premium', 46],
    ])
  })
})
