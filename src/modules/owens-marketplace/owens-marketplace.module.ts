import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PaymentModule } from 'modules/payment/payment.module'
import { SmartContractModule } from 'modules/smart-contract/smart-contract.module'
import { OwensMarketplaceController } from './owens-marketplace.controller'
import {
  AddedSchemasRepository,
  AddedTemplatesRepository,
  AssetsHighlightsRepository,
  CollectionsRepository,
  OwenTokensRepository,
  PendingAssetsRepository,
  TransferredAssetsRepository,
} from './owens-marketplace.repository'
import { OwensMarketplaceService } from './owens-marketplace.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OwenTokensRepository,
      TransferredAssetsRepository,
      CollectionsRepository,
      AddedSchemasRepository,
      AddedTemplatesRepository,
      PendingAssetsRepository,
      AssetsHighlightsRepository,
    ]),
    forwardRef(() => PaymentModule),
    SmartContractModule,
  ],
  controllers: [OwensMarketplaceController],
  providers: [OwensMarketplaceService],
  exports: [OwensMarketplaceService],
})
export class OwensMarketplaceModule {}
