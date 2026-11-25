import { TimeDeposit } from '../../../TimeDeposit'
import { Withdrawal } from '../../../domain/Withdrawal'

/**
 * Withdrawals are kept next to the deposit rather than added to TimeDeposit,
 * because that class is shared and must stay unchanged.
 */
export interface TimeDepositWithWithdrawals {
  readonly deposit: TimeDeposit
  readonly withdrawals: readonly Withdrawal[]
}

// Abstract class rather than interface so it can serve as a DI token.
export abstract class TimeDepositRepository {
  /** All deposits ordered by id, each with its withdrawals ordered by id. */
  abstract findAllWithWithdrawals(): Promise<TimeDepositWithWithdrawals[]>

  /**
   * Loads all deposits, passes them to `update` and stores the resulting
   * balances. Runs in one transaction with the rows locked, so concurrent
   * updates can neither interleave nor be applied twice to the same state.
   */
  abstract updateAll(update: (deposits: TimeDeposit[]) => void): Promise<void>
}
