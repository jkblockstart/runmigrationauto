import { Controller, HttpCode, HttpStatus, Body, Post, Param, Get, Put, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { PageDto } from 'modules/common/common.dto'
import { Auth, GetUserId, GetOperatorId } from 'modules/user/user.guards'
import {
  AddQueueDto,
  AdvancedSaleDto,
  BasicSaleDto,
  BuyTemplateDto,
  SaleEndTimeDto,
  UpdateSaleDto,
  PaymentRefundDto,
  SoldTemplateFilterDto,
} from './sale.dto'
import { SaleService } from './sale.service'

@Controller('sale')
@ApiTags('Sale')
export class SaleController {
  constructor(public readonly saleService: SaleService) {}
  // ADDING NEW SALE
  @Post('new-sale')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Add new sale' })
  @ApiBearerAuth()
  @Auth()
  async addNewAdvancedSale(@GetUserId('id') id: string, @Body() advancedSaleDto: AdvancedSaleDto) {
    return await this.saleService.addNewAdvancedSale(id, advancedSaleDto)
  }

  @Post('user/new-basic-sale')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Add new basic' })
  @ApiBearerAuth()
  @Auth()
  async addBasicSale(@GetUserId('id') id: string, @GetOperatorId('operatorId') operatorId: number, @Body() basicSaleDto: BasicSaleDto) {
    return await this.saleService.addSelfPortalBasicSale(id, basicSaleDto, operatorId)
  }

  @Post('add-queue-info')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Add queue info' })
  @ApiBearerAuth()
  @Auth()
  async addQueueRelatedInfo(@GetUserId('id') id: string, @Body() addQueueDto: AddQueueDto) {
    return await this.saleService.addQueueRelatedInfo(id, addQueueDto)
  }

  //TODO: Will change again when needed in creator portal
  // @Post('user/add-queue-info')
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({ description: 'Add queue info' })
  // @ApiBearerAuth()
  // @Auth()
  // async addQueueRelatedInfoByUser(@GetUserId('id') id: string, @Body() addSimilarQueueDto: AddSimilarQueueDto) {
  //   return await this.saleService.addQueueRelatedInfoByUser(id, addSimilarQueueDto)
  // }

  //UPDATING SALE

  @Post('update-sale-endtime')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Add new sale' })
  @ApiBearerAuth()
  @Auth()
  async updateSaleEndtime(@GetUserId('id') id: string, @Body() saleEndTimeDto: SaleEndTimeDto) {
    return await this.saleService.updateSaleEndtime(id, saleEndTimeDto)
  }

  @Put('update-sale')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Add new sale' })
  @ApiBearerAuth()
  @Auth()
  async updateSale(@GetUserId('id') id: string, @Body() updateSaleDto: UpdateSaleDto) {
    return await this.saleService.updateSale(id, updateSaleDto)
  }

  @Put('change-status/:saleId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'enable/disable sale' })
  @ApiBearerAuth()
  @Auth()
  async changeSaleStatus(@GetUserId('id') id: string, @Param('saleId') saleId: number) {
    return await this.saleService.changeSaleStatus(id, saleId)
  }

  @Put('change-featuring/:saleId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Add/Remove sale from featured list' })
  @ApiBearerAuth()
  @Auth()
  async changeSaleFeatureStatus(@GetUserId('id') id: string, @Param('saleId') saleId: number) {
    return await this.saleService.changeSaleFeatureStatus(id, saleId)
  }

  @Put('change-mint-on-buy/:saleId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Change mint on buy' })
  @ApiBearerAuth()
  @Auth()
  async updateMintOnBuy(@GetUserId('id') id: string, @Param('saleId') saleId: number) {
    return await this.saleService.changeSaleFeatureStatus(id, saleId)
  }

  //SALE REGISTRATION AND QUEUE

  @Post('register/:saleId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Register' })
  @ApiBearerAuth()
  @Auth()
  async registerForSale(@GetUserId('id') id: string, @Param('saleId') saleId: number) {
    return await this.saleService.registerForSale(id, saleId)
  }

  @Get('queue-configuration/:saleId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'get queue configuration' })
  @ApiBearerAuth()
  @Auth()
  async getQueueConfigurations(@Param('saleId') saleId: number) {
    return await this.saleService.getQueueConfigurations(saleId)
  }

  @Get('registrations/:saleId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'All registrations for the sale' })
  @ApiBearerAuth()
  @Auth()
  async registeredUsers(@Param('saleId') saleId: number) {
    return await this.saleService.registeredUsers(saleId)
  }

  @Get('user-rank/:saleId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get user rank' })
  @ApiBearerAuth()
  @Auth()
  async getUserRank(@GetUserId('id') id: string, @Param('saleId') saleId: number) {
    return await this.saleService.getUserRank(id, saleId)
  }

  @Get('queue/:saleId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get all registered users with rank list' })
  async getQueue(@Param('saleId') saleId: number) {
    return await this.saleService.getQueue(saleId)
  }

  //SALE LISTING

  @Get('list')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get sale list' })
  @ApiBearerAuth()
  @Auth()
  async getList(@GetUserId('id') id: string, @GetOperatorId('operatorId') operatorId: number) {
    return await this.saleService.getList(id, operatorId)
  }

  @Get('public/list/:operatorId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get sale list' })
  async getListPublic(@Param('operatorId') operatorId: number) {
    return await this.saleService.getListPublic(operatorId)
  }

  @Get('list/collection/:collection')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get sale list based on collection' })
  @ApiBearerAuth()
  @Auth()
  async getListByCollection(
    @GetUserId('id') id: string,
    @GetOperatorId('operatorId') operatorId: number,
    @Param('collection') collection: string
  ) {
    return await this.saleService.getListByCollection(id, collection, operatorId)
  }

  @Get('public/list/collection/:collection/:operatorId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get sale list based on collection' })
  async getListByCollectionPublic(@Param('collection') collection: string, @Param('operatorId') operatorId: number) {
    return await this.saleService.getListByCollectionPublic(collection, operatorId)
  }

  //BUY APIS
  @Post('buy-template')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Buy template' })
  @ApiBearerAuth()
  @Auth()
  async buy(@GetUserId('id') id: string, @Body() buyTemplateDto: BuyTemplateDto) {
    return await this.saleService.buyTemplateUser(id, buyTemplateDto)
  }

  @Post('buy-template-admin/:username')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Buy template' })
  @ApiBearerAuth()
  @Auth()
  async buyAdmin(@GetUserId('id') id: string, @Body() buyTemplateDto: BuyTemplateDto, @Param('username') username: string) {
    return await this.saleService.buyTemplateAdmin(id, buyTemplateDto, username)
  }

  @Get('admin/payments-list/:saleId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get sale list' })
  @ApiBearerAuth()
  @Auth()
  async getSaleAllPaymentsList(@GetUserId('id') id: string, @Param('saleId') saleId: number) {
    return await this.saleService.getSaleAllPaymentsList(id, saleId)
  }

  @Post('admin/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Refund successfully completed.' })
  @ApiBearerAuth()
  @Auth()
  async refundUser(@GetUserId('id') id: string, @Body() paymentRefundDto: PaymentRefundDto) {
    return await this.saleService.adminRefundFailedSale(id, paymentRefundDto)
  }

  @Get('admin/refund-list/:saleId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'List of failed transactions for refund to users' })
  @ApiBearerAuth()
  @Auth()
  async fetchRefundList(@GetUserId('id') id: string, @Param('saleId') saleId: number) {
    return await this.saleService.fetchRefundList(id, saleId)
  }

  @Get('admin/all-payment-details')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get payment details' })
  @ApiBearerAuth()
  @Auth()
  async getALLUserPaymentsDetails(@GetUserId('id') id: string, @Query() pageDto: PageDto) {
    return await this.saleService.getPaymentDetailsList(id, pageDto)
  }

  @Get('admin/sold-templates-list')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get sale id  filters' })
  @ApiBearerAuth()
  @Auth()
  async getSoldTemplatesList(@GetUserId('id') id: string, @Query() soldTemplateFilterDto: SoldTemplateFilterDto) {
    return await this.saleService.getSoldTemplatesList(id, soldTemplateFilterDto)
  }
}
