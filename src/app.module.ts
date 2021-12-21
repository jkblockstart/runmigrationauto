import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UserModule } from './modules/user/user.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigService } from 'shared/services/config.service'
import { SharedModule } from 'shared/shared.module'
import { MailerModule } from 'modules/mailer/mailer.module'
import { AdminModule } from 'modules/admin/admin.module'
import { PaymentModule } from 'modules/payment/payment.module'
import { SmartContractModule } from 'modules/smart-contract/smart-contract.module'
import { SaleModule } from 'modules/sale/sale.module'
import { OwensMarketplaceModule } from 'modules/owens-marketplace/owens-marketplace.module'
import { CommonModule } from 'modules/common/common.module'
import { NFTModule } from 'modules/nft/nft.module'
import { ChallengeModule } from 'modules/challenge/challenge.module'
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [SharedModule],
      useFactory: (configService: ConfigService) => configService.typeOrmConfig,
      inject: [ConfigService],
    }),
    MailerModule.register(),
    UserModule,
    AdminModule,
    PaymentModule,
    SmartContractModule,
    SaleModule,
    OwensMarketplaceModule,
    CommonModule,
    NFTModule,
    ChallengeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
