import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminRegistrationRepository } from './smart-contract.repository'
import { SmartContractController } from './smart-contract.controller'
import { SmartContractService } from './smart-contract.service'

@Module({
  imports: [TypeOrmModule.forFeature([AdminRegistrationRepository])],
  controllers: [SmartContractController],
  providers: [SmartContractService],
  exports: [SmartContractService],
})
export class SmartContractModule {}
