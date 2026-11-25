import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { DataSource } from 'typeorm'
import { TimeDepositEntity, WithdrawalEntity } from '../../../adapter/out/persistence/entities'
import { PostgresConnection } from '../../../adapter/out/persistence/postgresOptions'

// Same image as docker-compose.yml.
export const POSTGRES_IMAGE = 'postgres:16-alpine'

// Pulling the image on a fresh machine can take a while.
export const CONTAINER_TIMEOUT_MS = 180_000

export const startPostgres = (): Promise<StartedPostgreSqlContainer> =>
  new PostgreSqlContainer(POSTGRES_IMAGE).start()

export const connectionOf = (container: StartedPostgreSqlContainer): PostgresConnection => ({
  host: container.getHost(),
  port: container.getPort(),
  username: container.getUsername(),
  password: container.getPassword(),
  database: container.getDatabase(),
})

export const truncateAll = (dataSource: DataSource): Promise<unknown> =>
  dataSource.query('TRUNCATE "withdrawals", "timeDeposits" RESTART IDENTITY')

interface DepositFixture {
  planType: string
  balance: number
  days: number
  withdrawals?: { amount: number; date: string }[]
}

export const insertDeposits = async (dataSource: DataSource, fixtures: DepositFixture[]) => {
  for (const { withdrawals = [], ...deposit } of fixtures) {
    const saved = await dataSource.getRepository(TimeDepositEntity).save(deposit)
    await dataSource
      .getRepository(WithdrawalEntity)
      .save(withdrawals.map((w) => ({ ...w, timeDepositId: saved.id })))
  }
}
