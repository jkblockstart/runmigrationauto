import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminModule } from 'modules/admin/admin.module'
import { OwensMarketplaceModule } from 'modules/owens-marketplace/owens-marketplace.module'
import { CollectionsRepository } from 'modules/owens-marketplace/owens-marketplace.repository'
import { PaymentModule } from 'modules/payment/payment.module'
import { SmartContractModule } from 'modules/smart-contract/smart-contract.module'
import { UserModule } from 'modules/user/user.module'
import { SaleController } from './sale.controller'
import {
  EthereumSaleRepository,
  SaleQueueRepository,
  SaleRegistrationRepository,
  SaleRepository,
  SoldTemplatesRepository,
} from './sale.repository'
import { SaleService } from './sale.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SaleRepository,
      SaleRegistrationRepository,
      SaleQueueRepository,
      SoldTemplatesRepository,
      CollectionsRepository,
      EthereumSaleRepository,
    ]),
    AdminModule,
    SmartContractModule,
    PaymentModule,
    OwensMarketplaceModule,
    UserModule,
  ],
  controllers: [SaleController],
  providers: [SaleService],
  exports: [SaleService],
})
export class SaleModule {}
