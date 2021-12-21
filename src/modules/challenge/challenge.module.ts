import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminModule } from 'modules/admin/admin.module'
import { SmartContractModule } from 'modules/smart-contract/smart-contract.module'
import { ChallengeController } from './challenge.controller'
import { ChallengePartialParticipationsRepository, ChallengeParticipationsRepository, ChallengeRepository } from './challenge.repository'
import { ChallengeService } from './challenge.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([ChallengePartialParticipationsRepository, ChallengeParticipationsRepository, ChallengeRepository]),
    SmartContractModule,
    AdminModule,
  ],
  controllers: [ChallengeController],
  providers: [ChallengeService],
  exports: [ChallengeService],
})
export class ChallengeModule {}
