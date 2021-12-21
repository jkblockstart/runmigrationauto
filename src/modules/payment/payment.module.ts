import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserRepository } from 'modules/user/user.repository'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'
import { PaymentsRepository, WithdrawCustomerRepository, WithdrawRequestRepository } from './payment.repository'
import { AdminModule } from 'modules/admin/admin.module'
import { SmartContractModule } from 'modules/smart-contract/smart-contract.module'
import { OwensMarketplaceModule } from 'modules/owens-marketplace/owens-marketplace.module'
import { WithdrawLimitRepository } from 'modules/admin/admin.repository'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserRepository,
      PaymentsRepository,
      WithdrawLimitRepository,
      WithdrawRequestRepository,
      WithdrawCustomerRepository,
    ]),
    SmartContractModule,
    forwardRef(() => OwensMarketplaceModule),
    forwardRef(() => AdminModule),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
