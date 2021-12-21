import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { INestApplication } from '@nestjs/common'
import { UserModule } from './modules/user/user.module'
import { AdminModule } from 'modules/admin/admin.module'
import { SmartContractModule } from 'modules/smart-contract/smart-contract.module'
import { PaymentModule } from './modules/payment/payment.module'
import { SaleModule } from 'modules/sale/sale.module'
import { OwensMarketplaceModule } from 'modules/owens-marketplace/owens-marketplace.module'
import { NFTModule } from 'modules/nft/nft.module'
import { CommonModule } from 'modules/common/common.module'
import { ChallengeModule } from 'modules/challenge/challenge.module'

export function setupSwagger(app: INestApplication) {
  const options = new DocumentBuilder().setTitle('OWENS MARKET BACKEND DOCUMENTATION').setVersion('8').addBearerAuth().build()

  const document = SwaggerModule.createDocument(app, options, {
    include: [
      UserModule,
      AdminModule,
      SmartContractModule,
      PaymentModule,
      SaleModule,
      OwensMarketplaceModule,
      NFTModule,
      CommonModule,
      ChallengeModule,
    ],
  })
  SwaggerModule.setup('documentation', app, document)
}
