import { DataSource } from 'typeorm'
import { TimeDeposit } from '../../../TimeDeposit'
import {
  TimeDepositRepository,
  TimeDepositWithWithdrawals,
} from '../../../application/port/out/TimeDepositRepository'
import { TimeDepositEntity } from './entities'

const toTimeDeposit = (row: TimeDepositEntity): TimeDeposit =>
  new TimeDeposit(row.id, row.planType, row.balance, row.days)

// Balances are stored with two decimal places. The calculator already rounds
// interest to cents, so this only drops floating point noise such as
// 6.609999999999999.
const toDecimal = (amount: number): string => amount.toFixed(2)

export class TypeOrmTimeDepositRepository extends TimeDepositRepository {
  constructor(private readonly dataSource: DataSource) {
    super()
  }

  async findAllWithWithdrawals(): Promise<TimeDepositWithWithdrawals[]> {
    const rows = await this.dataSource.getRepository(TimeDepositEntity).find({
      relations: { withdrawals: true },
      order: { id: 'ASC', withdrawals: { id: 'ASC' } },
    })

    return rows.map((row) => ({
      deposit: toTimeDeposit(row),
      withdrawals: row.withdrawals.map(({ id, amount, date }) => ({ id, amount, date })),
    }))
  }

  async updateAll(update: (deposits: TimeDeposit[]) => void): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // Locking in id order keeps concurrent runs from deadlocking each other.
      const rows = await manager.find(TimeDepositEntity, {
        order: { id: 'ASC' },
        lock: { mode: 'pessimistic_write' },
      })
      const storedBalances = new Map(rows.map((row) => [row.id, toDecimal(row.balance)]))
      const deposits = rows.map(toTimeDeposit)

      update(deposits)

      const changed = deposits.filter((d) => toDecimal(d.balance) !== storedBalances.get(d.id))
      if (changed.length === 0) {
        return
      }

      // One statement for all rows instead of a round trip per deposit.
      await manager.query(
        `UPDATE "timeDeposits" AS deposit
            SET "balance" = changed.balance
           FROM unnest($1::integer[], $2::numeric[]) AS changed (id, balance)
          WHERE deposit."id" = changed.id`,
        [changed.map((d) => d.id), changed.map((d) => toDecimal(d.balance))],
      )
    })
  }
}
