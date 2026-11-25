export abstract class UpdateAllBalancesUseCase {
  /** Adds one month of interest to the balance of every time deposit. */
  abstract updateAllBalances(): Promise<void>
}
