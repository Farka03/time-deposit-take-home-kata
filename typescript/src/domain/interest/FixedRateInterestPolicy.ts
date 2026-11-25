import { TimeDeposit } from '../../TimeDeposit'
import { InterestPolicy } from './InterestPolicy'

const MONTHS_PER_YEAR = 12

// Applies to all current plans; a future plan can override accruesInterest.
const DAYS_WITHOUT_INTEREST = 30

/**
 * Monthly share of a fixed annual rate. Subclasses narrow the period in which
 * interest accrues.
 *
 * Keep the arithmetic as (balance * rate) / 12: it must yield exactly the same
 * floating point result as the original calculator.
 */
export abstract class FixedRateInterestPolicy implements InterestPolicy {
  protected constructor(private readonly annualRate: number) {}

  monthlyInterest(deposit: TimeDeposit): number {
    if (!this.accruesInterest(deposit)) {
      return 0
    }
    return (deposit.balance * this.annualRate) / MONTHS_PER_YEAR
  }

  protected accruesInterest(deposit: TimeDeposit): boolean {
    return deposit.days > DAYS_WITHOUT_INTEREST
  }
}
