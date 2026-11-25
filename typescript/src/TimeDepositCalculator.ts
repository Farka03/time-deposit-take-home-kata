import { TimeDeposit } from './TimeDeposit'
import { InterestPolicies } from './domain/interest/InterestPolicies'

const roundToCents = (amount: number): number => Math.round((amount + Number.EPSILON) * 100) / 100

export class TimeDepositCalculator {
  constructor(private readonly interestPolicies: InterestPolicies = InterestPolicies.default()) {}

  /** Adds one month of interest, rounded to cents, to every deposit in place. */
  public updateBalance(xs: TimeDeposit[]) {
    for (const deposit of xs) {
      const interest = this.interestPolicies.for(deposit.planType).monthlyInterest(deposit)
      deposit.balance += roundToCents(interest)
    }
  }
}
