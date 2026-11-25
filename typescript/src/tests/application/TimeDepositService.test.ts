import { TimeDeposit } from '../../TimeDeposit'
import { TimeDepositCalculator } from '../../TimeDepositCalculator'
import {
  TimeDepositRepository,
  TimeDepositWithWithdrawals,
} from '../../application/port/out/TimeDepositRepository'
import { TimeDepositService } from '../../application/service/TimeDepositService'

class InMemoryTimeDepositRepository extends TimeDepositRepository {
  constructor(public stored: TimeDepositWithWithdrawals[]) {
    super()
  }

  async findAllWithWithdrawals(): Promise<TimeDepositWithWithdrawals[]> {
    return this.stored
  }

  async updateAll(update: (deposits: TimeDeposit[]) => void): Promise<void> {
    update(this.stored.map((s) => s.deposit))
  }
}

describe('TimeDepositService', () => {
  const stored = (): TimeDepositWithWithdrawals[] => [
    {
      deposit: new TimeDeposit(1, 'basic', 10000, 31),
      withdrawals: [{ id: 1, amount: 100, date: '2026-10-01' }],
    },
    { deposit: new TimeDeposit(2, 'premium', 10000, 45), withdrawals: [] },
  ]

  test('returns all deposits with their withdrawals', async () => {
    const repository = new InMemoryTimeDepositRepository(stored())
    const service = new TimeDepositService(repository, new TimeDepositCalculator())

    await expect(service.getAllTimeDeposits()).resolves.toEqual(stored())
  })

  test('applies the calculator to every deposit', async () => {
    const repository = new InMemoryTimeDepositRepository(stored())
    const service = new TimeDepositService(repository, new TimeDepositCalculator())

    await service.updateAllBalances()

    expect(repository.stored.map((s) => s.deposit.balance)).toEqual([10008.33, 10000])
  })
})
