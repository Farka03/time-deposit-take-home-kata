import { TimeDepositWithWithdrawals } from '../out/TimeDepositRepository'

export abstract class GetAllTimeDepositsUseCase {
  abstract getAllTimeDeposits(): Promise<TimeDepositWithWithdrawals[]>
}
