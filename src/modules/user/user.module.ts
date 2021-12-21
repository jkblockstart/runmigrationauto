import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SmartContractModule } from 'modules/smart-contract/smart-contract.module'
import { UserController } from './user.controller'
import { EmailVerificationRepository, UserRepository, ResetPasswordRepository, WaxAccountsRepository } from './user.repository'
import { UserService } from './user.service'
import { AdminModule } from 'modules/admin/admin.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserRepository, EmailVerificationRepository, ResetPasswordRepository, WaxAccountsRepository]),
    SmartContractModule,
    forwardRef(() => AdminModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
