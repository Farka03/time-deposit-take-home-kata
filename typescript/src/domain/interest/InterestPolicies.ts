import { InterestPolicy, NO_INTEREST } from './InterestPolicy'
import {
  BasicPlanInterestPolicy,
  PlanType,
  PremiumPlanInterestPolicy,
  StudentPlanInterestPolicy,
} from './plans'

/**
 * Resolves the interest policy for a plan type. Plan types are matched exactly
 * (case-sensitive); an unknown plan earns no interest, as it always did.
 */
export class InterestPolicies {
  private readonly byPlanType: ReadonlyMap<string, InterestPolicy>

  constructor(
    policies: Iterable<readonly [string, InterestPolicy]>,
    private readonly fallback: InterestPolicy = NO_INTEREST,
  ) {
    this.byPlanType = new Map(policies)
  }

  static default(): InterestPolicies {
    return new InterestPolicies([
      [PlanType.Basic, new BasicPlanInterestPolicy()],
      [PlanType.Student, new StudentPlanInterestPolicy()],
      [PlanType.Premium, new PremiumPlanInterestPolicy()],
    ])
  }

  for(planType: string): InterestPolicy {
    return this.byPlanType.get(planType) ?? this.fallback
  }
}
