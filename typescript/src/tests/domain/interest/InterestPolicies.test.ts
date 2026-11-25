import { TimeDeposit } from '../../../TimeDeposit'
import { TimeDepositCalculator } from '../../../TimeDepositCalculator'
import { InterestPolicies } from '../../../domain/interest/InterestPolicies'
import { InterestPolicy } from '../../../domain/interest/InterestPolicy'
import {
  BasicPlanInterestPolicy,
  PremiumPlanInterestPolicy,
  StudentPlanInterestPolicy,
} from '../../../domain/interest/plans'

const deposit = (planType: string, days: number, balance = 1200) =>
  new TimeDeposit(1, planType, balance, days)

describe('plan interest policies', () => {
  test.each([
    ['basic', new BasicPlanInterestPolicy(), 31, 1],
    ['student', new StudentPlanInterestPolicy(), 31, 3],
    ['premium', new PremiumPlanInterestPolicy(), 46, 5],
  ])('%s plan pays its annual rate split over 12 months', (planType, policy, days, expected) => {
    expect(policy.monthlyInterest(deposit(planType, days))).toBeCloseTo(expected, 10)
  })

  test.each([
    [new BasicPlanInterestPolicy(), 30],
    [new StudentPlanInterestPolicy(), 30],
    [new PremiumPlanInterestPolicy(), 30],
  ])('no plan pays interest during the first 30 days', (policy, days) => {
    expect(policy.monthlyInterest(deposit('any', days))).toBe(0)
  })

  test('student plan stops paying interest after one year', () => {
    const policy = new StudentPlanInterestPolicy()

    expect(policy.monthlyInterest(deposit('student', 365))).toBeGreaterThan(0)
    expect(policy.monthlyInterest(deposit('student', 366))).toBe(0)
  })

  test('premium plan starts paying interest after 45 days', () => {
    const policy = new PremiumPlanInterestPolicy()

    expect(policy.monthlyInterest(deposit('premium', 45))).toBe(0)
    expect(policy.monthlyInterest(deposit('premium', 46))).toBeGreaterThan(0)
  })
})

describe('InterestPolicies', () => {
  test('falls back to no interest for an unknown plan type', () => {
    expect(InterestPolicies.default().for('gold').monthlyInterest(deposit('gold', 100))).toBe(0)
  })

  test('does not resolve inherited object properties as plan types', () => {
    expect(InterestPolicies.default().for('constructor').monthlyInterest(deposit('x', 100))).toBe(0)
  })

  test('lets the calculator be extended with a new plan without touching it', () => {
    const flatBonus: InterestPolicy = { monthlyInterest: () => 10.004 }
    const calculator = new TimeDepositCalculator(new InterestPolicies([['bonus', flatBonus]]))
    const bonus = deposit('bonus', 1, 100)

    calculator.updateBalance([bonus])

    expect(bonus.balance).toBe(110)
  })
})
