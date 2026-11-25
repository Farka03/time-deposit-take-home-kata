import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'
import { TimeDepositEntity, WithdrawalEntity } from './entities'
import { CreateTimeDepositTables1795600800000 } from './migrations/1795600800000-CreateTimeDepositTables'

export interface PostgresConnection {
  host: string
  port: number
  username: string
  password: string
  database: string
}

// Defaults match docker-compose.yml.
export const postgresConnectionFromEnv = (env = process.env): PostgresConnection => ({
  host: env.DB_HOST ?? 'localhost',
  port: Number(env.DB_PORT ?? 5432),
  username: env.DB_USER ?? 'postgres',
  password: env.DB_PASSWORD ?? 'postgres',
  database: env.DB_NAME ?? 'time_deposits',
})

export const postgresOptions = (connection: PostgresConnection): PostgresConnectionOptions => ({
  type: 'postgres',
  ...connection,
  entities: [TimeDepositEntity, WithdrawalEntity],
  migrations: [CreateTimeDepositTables1795600800000],
  // The schema is owned by the migrations, never by entity synchronisation.
  synchronize: false,
  migrationsRun: true,
})
