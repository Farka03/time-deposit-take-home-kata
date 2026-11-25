import { TimeDeposit } from '../../TimeDeposit'

/**
 * Calculates the interest a deposit earns for one month, before rounding.
 * Add a new implementation to support a new plan type or a new rule.
 */
export interface InterestPolicy {
  monthlyInterest(deposit: TimeDeposit): number
}

export const NO_INTEREST: InterestPolicy = {
  monthlyInterest: () => 0,
}
