import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MailerModule } from 'modules/mailer/mailer.module'
import { PaymentModule } from 'modules/payment/payment.module'
import { SmartContractModule } from 'modules/smart-contract/smart-contract.module'
import { UserModule } from 'modules/user/user.module'
import { AdminController } from './admin.controller'
import { AdminBidsRepository, ContactUsRepository, OperatorsRepository, WithdrawLimitRepository } from './admin.repository'
import { AdminService } from './admin.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([ContactUsRepository, AdminBidsRepository, OperatorsRepository, WithdrawLimitRepository]),
    SmartContractModule,
    forwardRef(() => UserModule),
    MailerModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
