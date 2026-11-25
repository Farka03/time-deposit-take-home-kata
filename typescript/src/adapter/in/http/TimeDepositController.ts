import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { GetAllTimeDepositsUseCase } from '../../../application/port/in/GetAllTimeDepositsUseCase'
import { UpdateAllBalancesUseCase } from '../../../application/port/in/UpdateAllBalancesUseCase'
import { TimeDepositWithWithdrawals } from '../../../application/port/out/TimeDepositRepository'
import { components } from './generated/openapi'

// Response types come from api/openapi.yaml (yarn generate:api), so the
// controller cannot drift from the contract without failing to compile.
type TimeDepositResponse = components['schemas']['TimeDeposit']

const toResponse = ({ deposit, withdrawals }: TimeDepositWithWithdrawals): TimeDepositResponse => ({
  id: deposit.id,
  planType: deposit.planType,
  balance: deposit.balance,
  days: deposit.days,
  withdrawals: withdrawals.map(({ id, amount, date }) => ({ id, amount, date })),
})

@Controller('time-deposits')
export class TimeDepositController {
  constructor(
    private readonly getAllTimeDeposits: GetAllTimeDepositsUseCase,
    private readonly updateAllBalances: UpdateAllBalancesUseCase,
  ) {}

  @Get()
  async getAll(): Promise<TimeDepositResponse[]> {
    const deposits = await this.getAllTimeDeposits.getAllTimeDeposits()
    return deposits.map(toResponse)
  }

  @Post('balance-updates')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBalances(): Promise<void> {
    await this.updateAllBalances.updateAllBalances()
  }
}
