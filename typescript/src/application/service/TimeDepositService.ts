import { TimeDepositCalculator } from '../../TimeDepositCalculator'
import { GetAllTimeDepositsUseCase } from '../port/in/GetAllTimeDepositsUseCase'
import { UpdateAllBalancesUseCase } from '../port/in/UpdateAllBalancesUseCase'
import {
  TimeDepositRepository,
  TimeDepositWithWithdrawals,
} from '../port/out/TimeDepositRepository'

export class TimeDepositService implements GetAllTimeDepositsUseCase, UpdateAllBalancesUseCase {
  constructor(
    private readonly timeDeposits: TimeDepositRepository,
    private readonly calculator: TimeDepositCalculator,
  ) {}

  getAllTimeDeposits(): Promise<TimeDepositWithWithdrawals[]> {
    return this.timeDeposits.findAllWithWithdrawals()
  }

  updateAllBalances(): Promise<void> {
    return this.timeDeposits.updateAll((deposits) => this.calculator.updateBalance(deposits))
  }
}
