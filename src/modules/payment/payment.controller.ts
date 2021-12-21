import { Controller, HttpCode, HttpStatus, Body, Post, Get, Param, Req, Request } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { PaymentService } from './payment.service'
import { DwollaCustomerDto, PaymentDto, PaymentWithdrawDto, WithPersonaDto } from './payment.dto'
import { Auth, GetUserId } from 'modules/user/user.guards'
import { PaymentTypeEnum } from './payment.interface'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const requestIp = require('request-ip')

@Controller('pay')
@ApiTags('Pay')
export class PaymentController {
  constructor(private paymentServices: PaymentService) {}

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('stripepay')
  @Auth()
  async stripePayment(@Body() payObject: PaymentDto, @GetUserId('id') userId: string) {
    return await this.paymentServices.addStripePayment(userId, payObject)
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Get('payment-details')
  @Auth()
  async getPaymentDetails() {
    return await this.paymentServices.getPaymentDetails()
  }

  @Post('addCards/:customerSource')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Add Cards' })
  @ApiBearerAuth()
  @Auth()
  async addCards(@GetUserId('userId') userId: string, @Param('customerSource') customerSource: string) {
    return await this.paymentServices.addCards(userId, customerSource)
  }

  @Get('retrieveCardList/:type')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get Card List' })
  @ApiBearerAuth()
  @Auth()
  async retrieveCardList(@GetUserId('id') userId: string, @Param('type') type: PaymentTypeEnum) {
    return await this.paymentServices.retrieveCardListValue(type, userId)
  }
  /* payment withdraw flow */

  @ApiBearerAuth()
  @Post('withdraw')
  @Auth()
  async withdrawBalance(@GetUserId('id') userId: string, @Body() paymentWithdrawDto: PaymentWithdrawDto) {
    return await this.paymentServices.paymentWithdraw(userId, paymentWithdrawDto)
  }

  @ApiBearerAuth()
  @Post('dwolla-customer')
  @Auth()
  async dwollaCustomer(@GetUserId('id') userId: string, @Body() dwollaCustomerDto: DwollaCustomerDto, @Req() request: Request) {
    const uas = requestIp.getClientIp(request)
    return await this.paymentServices.createDwollaCustomer(userId, dwollaCustomerDto, uas)
  }

  @ApiBearerAuth()
  @Get('dwolla-customer')
  @Auth()
  async getDwollaCustomer(@GetUserId('id') userId: string) {
    return await this.paymentServices.getCustomers(userId)
  }

  @ApiBearerAuth()
  @Post('with-persona-kyc')
  @Auth()
  async withPersonaKYC(@GetUserId('id') userId: string, @Body() withPersonaDto: WithPersonaDto) {
    return await this.paymentServices.addWithPersonaKYC(userId, withPersonaDto)
  }

  @ApiBearerAuth()
  @Get('withdraw-status')
  @Auth()
  async getWithdrawPaymentRequest(@GetUserId('id') userId: string) {
    return await this.paymentServices.getWithdrawRequest(userId)
  }

  @Post('webhook')
  async webhookListen(@Req() req: Request) {
    return await this.paymentServices.statusWithdrawWebhook(req.body)
  }

  // @Post('add-webhook')
  // async webhook() {
  //   return await this.paymentServices.addWebhookUrl()
  // }

  // @Get('test/:type')
  // async test(@Param('type') type: PaymentTypeEnum) {
  //   return await this.paymentServices.retrieveCardListValue(type, '42')

  // @Get('test')
  // async test() {
  // return await this.paymentServices.testCard()
  // return await this.paymentServices.createTokenTest()
  // return await this.paymentServices.cancelPayment()
  // }
}
