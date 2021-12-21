import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminModule } from 'modules/admin/admin.module'
import { NFTController } from './nft.controller'
import { MetadataRepository } from './nft.repository'
import { NFTService } from './nft.service'

@Module({
  imports: [TypeOrmModule.forFeature([MetadataRepository]), AdminModule],
  controllers: [NFTController],
  providers: [NFTService],
  exports: [NFTService],
})
export class NFTModule {}
