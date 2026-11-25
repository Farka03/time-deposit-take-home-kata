import { DataSource } from 'typeorm'
import { postgresConnectionFromEnv, postgresOptions } from './postgresOptions'

// Entry point for the TypeORM CLI (see the migration:* scripts).
export default new DataSource(postgresOptions(postgresConnectionFromEnv()))
