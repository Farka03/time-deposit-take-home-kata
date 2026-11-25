import { DynamicModule, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { TimeDepositCalculator } from './TimeDepositCalculator'
import { TimeDepositController } from './adapter/in/http/TimeDepositController'
import { TypeOrmTimeDepositRepository } from './adapter/out/persistence/TypeOrmTimeDepositRepository'
import { PostgresConnection, postgresOptions } from './adapter/out/persistence/postgresOptions'
import { GetAllTimeDepositsUseCase } from './application/port/in/GetAllTimeDepositsUseCase'
import { UpdateAllBalancesUseCase } from './application/port/in/UpdateAllBalancesUseCase'
import { TimeDepositRepository } from './application/port/out/TimeDepositRepository'
import { TimeDepositService } from './application/service/TimeDepositService'

/**
 * Composition root. Domain and application classes know nothing about Nest;
 * they are wired here with factories.
 */
@Module({})
export class TimeDepositModule {
  static forPostgres(connection: PostgresConnection): DynamicModule {
    return {
      module: TimeDepositModule,
      imports: [TypeOrmModule.forRoot(postgresOptions(connection))],
      controllers: [TimeDepositController],
      providers: [
        {
          provide: TimeDepositRepository,
          useFactory: (dataSource: DataSource) => new TypeOrmTimeDepositRepository(dataSource),
          inject: [DataSource],
        },
        {
          provide: TimeDepositService,
          useFactory: (repository: TimeDepositRepository) =>
            new TimeDepositService(repository, new TimeDepositCalculator()),
          inject: [TimeDepositRepository],
        },
        { provide: GetAllTimeDepositsUseCase, useExisting: TimeDepositService },
        { provide: UpdateAllBalancesUseCase, useExisting: TimeDepositService },
      ],
    }
  }
}
