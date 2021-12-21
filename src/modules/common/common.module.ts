import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminModule } from 'modules/admin/admin.module'
import { SmartContractModule } from 'modules/smart-contract/smart-contract.module'
import { CommonController } from './common.controller'
import { ConfigurationRepository, IPFSlistRepository, NFTCarouselRepository } from './common.repository'
import { CommonService } from './common.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([IPFSlistRepository, NFTCarouselRepository, ConfigurationRepository]),
    SmartContractModule,
    AdminModule,
  ],
  controllers: [CommonController],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
