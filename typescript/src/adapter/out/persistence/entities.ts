import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  ValueTransformer,
} from 'typeorm'

// pg returns NUMERIC as a string to avoid precision loss. Two decimal places fit
// into a double without loss, and the domain works with numbers.
const decimal: ValueTransformer = {
  from: (value: string | null) => (value === null ? null : Number(value)),
  to: (value: number | null) => value,
}

// Table and column names follow the requirements literally (camelCase), which
// is why every identifier is quoted in SQL.
@Entity({ name: 'timeDeposits' })
export class TimeDepositEntity {
  @PrimaryGeneratedColumn('identity', {
    generatedIdentity: 'BY DEFAULT',
    primaryKeyConstraintName: 'PK_timeDeposits',
  })
  id!: number

  @Column({ type: 'varchar' })
  planType!: string

  @Column({ type: 'integer' })
  days!: number

  @Column({ type: 'numeric', precision: 19, scale: 2, transformer: decimal })
  balance!: number

  @OneToMany(() => WithdrawalEntity, (withdrawal) => withdrawal.timeDeposit)
  withdrawals!: WithdrawalEntity[]
}

@Entity({ name: 'withdrawals' })
@Index('IDX_withdrawals_timeDepositId', ['timeDepositId'])
export class WithdrawalEntity {
  @PrimaryGeneratedColumn('identity', {
    generatedIdentity: 'BY DEFAULT',
    primaryKeyConstraintName: 'PK_withdrawals',
  })
  id!: number

  @Column({ type: 'integer' })
  timeDepositId!: number

  @ManyToOne(() => TimeDepositEntity, (deposit) => deposit.withdrawals, { nullable: false })
  @JoinColumn({ name: 'timeDepositId', foreignKeyConstraintName: 'FK_withdrawals_timeDeposits' })
  timeDeposit!: TimeDepositEntity

  @Column({ type: 'numeric', precision: 19, scale: 2, transformer: decimal })
  amount!: number

  // TypeORM hands DATE columns over as 'YYYY-MM-DD' strings, which avoids any
  // time zone shift of the calendar date.
  @Column({ type: 'date' })
  date!: string
}
