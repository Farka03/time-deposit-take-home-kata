import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { TimeDepositModule } from './TimeDepositModule'
import { serveContract } from './adapter/in/http/openApiContract'
import { postgresConnectionFromEnv } from './adapter/out/persistence/postgresOptions'

async function bootstrap() {
  const app = await NestFactory.create(TimeDepositModule.forPostgres(postgresConnectionFromEnv()))
  app.enableShutdownHooks()
  serveContract(app)
  await app.listen(Number(process.env.PORT ?? 3000))
}

void bootstrap()
