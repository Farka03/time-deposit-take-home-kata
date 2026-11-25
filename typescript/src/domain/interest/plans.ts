import { TimeDeposit } from '../../TimeDeposit'
import { FixedRateInterestPolicy } from './FixedRateInterestPolicy'

export const PlanType = {
  Basic: 'basic',
  Student: 'student',
  Premium: 'premium',
} as const

export class BasicPlanInterestPolicy extends FixedRateInterestPolicy {
  constructor() {
    super(0.01)
  }
}

// Student deposits earn interest during their first year only.
const STUDENT_FIRST_DAY_WITHOUT_INTEREST = 366

export class StudentPlanInterestPolicy extends FixedRateInterestPolicy {
  constructor() {
    super(0.03)
  }

  protected accruesInterest(deposit: TimeDeposit): boolean {
    return super.accruesInterest(deposit) && deposit.days < STUDENT_FIRST_DAY_WITHOUT_INTEREST
  }
}

const PREMIUM_DAYS_WITHOUT_INTEREST = 45

export class PremiumPlanInterestPolicy extends FixedRateInterestPolicy {
  constructor() {
    super(0.05)
  }

  protected accruesInterest(deposit: TimeDeposit): boolean {
    return super.accruesInterest(deposit) && deposit.days > PREMIUM_DAYS_WITHOUT_INTEREST
  }
}
