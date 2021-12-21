import { Controller, HttpCode, HttpStatus, Get, Post, Body, Query, Param } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { StartEndTimeDto } from 'modules/common/common.dto'
import { PaymentDto } from 'modules/payment/payment.dto'
import { Auth, GetUserId, GetOperatorId } from 'modules/user/user.guards'
import {
  AcceptOfferDto,
  AddCollectionDto,
  AdminAddCollectionDto,
  AssetsHighlightsDto,
  AssetsHighlightsRankDto,
  CollectionHighlightsRankDto,
  DepositAssetDto,
  DepositMintedAssetDto,
  FilterDto,
  GameRemoveCardDto,
  GameRemoveCardFantasy4Dto,
  GameSendCardDto,
  ListCardDto,
  OfferDto,
  TransferCardDto,
  UpdateFeatureDto,
  WithdrawCardDto,
} from './owens-marketplace.dto'
import { BlockchainEnum } from './owens-marketplace.interface'
import { OwensMarketplaceService } from './owens-marketplace.service'

@Controller('owens-marketplace')
@ApiTags('OwensMarketplace')
export class OwensMarketplaceController {
  constructor(public readonly owensMarketplaceService: OwensMarketplaceService) {}

  @Get('wallet-balance')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get Wallet balance' })
  @ApiBearerAuth()
  @Auth()
  async getWalletBalance(@GetUserId('id') id: string) {
    return await this.owensMarketplaceService.getWalletBalance(id)
  }

  @Get('wallet-history')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get Wallet history' })
  @ApiBearerAuth()
  @Auth()
  async getWalletHistory(@GetUserId('id') id: string) {
    return await this.owensMarketplaceService.getWalletHistory(id)
  }

  @Get('wallet-reload')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Reload wallet' })
  @ApiBearerAuth()
  @Auth()
  async reloadWallet(@GetUserId('id') id: string) {
    return await this.owensMarketplaceService.reloadWallet(id)
  }

  @Post('token-market/list-card')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'List card to market' })
  @ApiBearerAuth()
  @Auth()
  async listCardTokenMarket(@GetUserId('id') id: string, @Body() listCardDto: ListCardDto) {
    return await this.owensMarketplaceService.listCardTokenMarket(id, listCardDto)
  }

  @Post('token-market/cancel-list')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Remove card from market' })
  @ApiBearerAuth()
  @Auth()
  async cancelCardListing(@GetUserId('id') id: string, @Body() listCardDto: ListCardDto) {
    return await this.owensMarketplaceService.cancelCardListing(id, listCardDto)
  }

  @Post('token-market/add-offer')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Add offer' })
  @ApiBearerAuth()
  @Auth()
  async addOffer(@GetUserId('id') id: string, @Body() offerDto: OfferDto) {
    return await this.owensMarketplaceService.addOffer(id, offerDto)
  }

  @Post('token-market/cancel-offer')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Cancel offer' })
  @ApiBearerAuth()
  @Auth()
  async cancelOffer(@GetUserId('id') id: string, @Body() offerDto: OfferDto) {
    return await this.owensMarketplaceService.cancelOffer(id, offerDto)
  }

  @Post('token-market/accept-offer')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Accept offer' })
  @ApiBearerAuth()
  @Auth()
  async acceptOffer(@GetUserId('id') id: string, @Body() acceptOfferDto: AcceptOfferDto) {
    return await this.owensMarketplaceService.acceptOffer(id, acceptOfferDto)
  }

  @Post('token-market/direct-buy')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Buy on listing price' })
  @ApiBearerAuth()
  @Auth()
  async directBuy(@GetUserId('id') id: string, @Body() offerDto: OfferDto) {
    return await this.owensMarketplaceService.directBuy(id, offerDto)
  }

  @Get('token-market/all-bids')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get all bids' })
  @ApiBearerAuth()
  @Auth()
  async getAllBids(@GetUserId('id') id: string) {
    return await this.owensMarketplaceService.getAllBids(id)
  }

  @Post('withdraw-card')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Withdraw card' })
  @ApiBearerAuth()
  @Auth()
  async withdrawCard(@GetUserId('id') id: string, @Body() withdrawCardDto: WithdrawCardDto) {
    return await this.owensMarketplaceService.withdrawCard(id, withdrawCardDto)
  }

  @Post('game/send-card')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'send game card' })
  @ApiBearerAuth()
  @Auth()
  async sendCardForGame(@GetUserId('id') id: string, @Body() gameSendCardDto: GameSendCardDto) {
    return await this.owensMarketplaceService.sendCardForGame(id, gameSendCardDto)
  }

  @Post('game/remove-card')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'remove game card' })
  @ApiBearerAuth()
  @Auth()
  async removeCardForGame(@GetUserId('id') id: string, @Body() gameRemoveCardDto: GameRemoveCardDto) {
    return await this.owensMarketplaceService.removeCardForGame(id, gameRemoveCardDto)
  }

  @Post('game/remove-card/fantasy4')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'remove game card' })
  @ApiBearerAuth()
  @Auth()
  async removeCardForFantasy4Game(@GetUserId('id') id: string, @Body() gameRemoveCardFantasy4Dto: GameRemoveCardFantasy4Dto) {
    return await this.owensMarketplaceService.removeCardForFantasy4Game(id, gameRemoveCardFantasy4Dto)
  }

  @Post('unpack-card/:assetId/:assetCon/:blockchain')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Unpack card' })
  @ApiBearerAuth()
  @Auth()
  async unpackCard(
    @GetUserId('id') id: string,
    @Param('assetId') assetId: number,
    @Param('assetCon') assetCon: string,
    @Param('blockchain') blockchain: number
  ) {
    return await this.owensMarketplaceService.unpackCard(id, assetId, assetCon, blockchain)
  }

  @Get('pending-assets')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'get pending assets' })
  @ApiBearerAuth()
  @Auth()
  async pendingAssets(@GetUserId('id') id: string) {
    return await this.owensMarketplaceService.pendingAssets(id)
  }

  @Get('token-market/my-list')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get you listed cards' })
  @ApiBearerAuth()
  @Auth()
  async getMyList(@GetUserId('id') id: string, @Query() filterDto: FilterDto) {
    return await this.owensMarketplaceService.getMyList(id, filterDto)
  }

  @Post('notify-instruction')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Notify instruction' })
  @ApiBearerAuth()
  @Auth()
  async notifyInstruction(@GetUserId('id') id: string) {
    return await this.owensMarketplaceService.notifyInstruction(id)
  }

  @Get('user-vault')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get cards in users vault' })
  @ApiBearerAuth()
  @Auth()
  async getUserVault(@GetUserId('id') id: string, @Query() filterDto: FilterDto) {
    return await this.owensMarketplaceService.getUserVault(id, filterDto)
  }

  @Get('token-market/cards')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get all cards from token market' })
  @ApiBearerAuth()
  @Auth()
  async getAllTokenMarketCard(@GetUserId('id') id: string, @Query() filterDto: FilterDto) {
    return await this.owensMarketplaceService.getAllTokenMarketCard(id, filterDto)
  }

  @Get('public/token-market/cards')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get all cards from token market' })
  async getAllMarketplaceCards(@Query() filterDto: FilterDto) {
    return await this.owensMarketplaceService.getAllMarketplaceCards(filterDto)
  }

  @Get('market-fee/:assetId/:assetCon')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get market fee' })
  @ApiBearerAuth()
  @Auth()
  async getMarketFee(@GetUserId('id') id: string, @Param('assetId') assetId: number, @Param('assetCon') assetCon: string) {
    return await this.owensMarketplaceService.getMarketFee(id, assetId, assetCon)
  }

  @Get('collection-list')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get collection list' })
  @ApiBearerAuth()
  @Auth()
  async collectionLists(@GetUserId('id') id: string) {
    return await this.owensMarketplaceService.collectionLists(id)
  }

  @Get('filters')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get collection list' })
  async filters(@Query() filterDto: FilterDto) {
    return await this.owensMarketplaceService.filters(filterDto)
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('buy-owens-token')
  @Auth()
  async buyOwensToken(@Body() payObject: PaymentDto, @GetUserId('id') userId: string) {
    return await this.owensMarketplaceService.buyOwensToken(userId, payObject)
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Get('card-details/:assetId/:assetCon')
  @Auth()
  async cardDetails(@Param('assetId') assetId: number, @Param('assetCon') assetCon: string, @GetUserId('id') userId: string) {
    return await this.owensMarketplaceService.cardDetails(userId, assetId, assetCon)
  }

  @HttpCode(HttpStatus.OK)
  @Get('card-details/public/:assetId/:assetCon')
  async cardDetailsPublic(@Param('assetId') assetId: number, @Param('assetCon') assetCon: string) {
    return await this.owensMarketplaceService.cardDetailsPublic(assetId, assetCon)
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('transfer-card')
  @Auth()
  async transferCard(@GetUserId('id') userId: string, @Body() transferCardDto: TransferCardDto) {
    return await this.owensMarketplaceService.transferCard(userId, transferCardDto)
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Get('user-activity')
  @Auth()
  async getUserActivity(@GetUserId('id') userId: string) {
    return await this.owensMarketplaceService.getUserActivity(userId)
  }

  @HttpCode(HttpStatus.OK)
  @Get('search/:keyword')
  async search(@Param('keyword') keyword: string) {
    return await this.owensMarketplaceService.search(keyword)
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('admin/new-collection')
  @Auth()
  async addCollectionAdmin(@GetUserId('id') userId: string, @Body() adminAddCollectionDto: AdminAddCollectionDto) {
    return await this.owensMarketplaceService.addcollectionAdmin(userId, adminAddCollectionDto)
  }

  @HttpCode(HttpStatus.OK)
  @Get('get-collection-list')
  async getCollectionList() {
    return await this.owensMarketplaceService.getCollectionList()
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('update-feature')
  @Auth()
  async updateFeature(@GetUserId('id') userId: string, @Body() updateFeatureDto: UpdateFeatureDto) {
    return await this.owensMarketplaceService.updateFeaturecollection(userId, updateFeatureDto)
  }

  @Post('user/new-collection')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Add new collection' })
  @ApiBearerAuth()
  @Auth()
  async addCollectionUser(
    @GetUserId('id') id: string,
    @GetOperatorId('operatorId') operatorId: number,
    @Body() addCollectionDto: AddCollectionDto
  ) {
    return await this.owensMarketplaceService.addCollectionUser(id, operatorId, addCollectionDto)
  }

  @Get('user/added-collections/:blockchain')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'get added collections' })
  @ApiBearerAuth()
  @Auth()
  async getAddedCollections(
    @GetUserId('id') id: string,
    @GetOperatorId('operatorId') operatorId: number,
    @Param('blockchain') blockchain: BlockchainEnum
  ) {
    return await this.owensMarketplaceService.getAddedCollections(id, operatorId, blockchain)
  }

  @Post('deposit-asset')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'deposit asset' })
  @ApiBearerAuth()
  @Auth()
  async depositAsset(@GetUserId('id') id: string, @Body() depositAssetDto: DepositAssetDto) {
    return await this.owensMarketplaceService.depositAsset(id, depositAssetDto)
  }

  @Post('admin/deposit-minted-assets')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'deposit asset' })
  @ApiBearerAuth()
  @Auth()
  async depositMintedAssets(@GetUserId('id') id: string, @Body() depositMintedAssetDto: DepositMintedAssetDto) {
    return await this.owensMarketplaceService.depositMintedAssets(id, depositMintedAssetDto)
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('admin/add-assetid-highlight')
  @Auth()
  async addAssetIdnHighlight(@GetUserId('id') userId: string, @Body() assetsHighlightsDto: AssetsHighlightsDto) {
    return await this.owensMarketplaceService.addAssetIdHighlight(userId, assetsHighlightsDto)
  }

  @HttpCode(HttpStatus.OK)
  @Get('asset-highlights/:operatorId')
  async assetsHighlights(@Param('operatorId') operatorId: number) {
    return await this.owensMarketplaceService.getHighlightedAssets(operatorId)
  }

  @HttpCode(HttpStatus.OK)
  @Get('collection-highlights/:operatorId')
  async collectionHighlights(@Param('operatorId') operatorId: number) {
    return await this.owensMarketplaceService.getHighlightedCollections(operatorId)
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('admin/addAssetIdnHighlightRank')
  @Auth()
  async addAssetIdnHighlightRank(@GetUserId('id') userId: string, @Body() assetsHighlightsRankDto: AssetsHighlightsRankDto) {
    return await this.owensMarketplaceService.addAssetIdHighlightRank(userId, assetsHighlightsRankDto)
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('admin/addCollectionHighlightRank')
  @Auth()
  async addCollectionHighlightRank(@GetUserId('id') userId: string, @Body() collectionHighlightsRankDto: CollectionHighlightsRankDto) {
    return await this.owensMarketplaceService.addCollectionHighlightRank(userId, collectionHighlightsRankDto)
  }

  @Get('public/getTemplateIdsDetails')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get Template-Ids Details' })
  async getTemplateIdsDetails(@Query('templateIds') templateIds: string) {
    return await this.owensMarketplaceService.getTemplateIdsDetails(templateIds)
  }

  @Get('public/sale-collection-list/:operatorId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get sale-collection Details' })
  async getcollectionDetail(@Param('operatorId') operatorId: number) {
    return await this.owensMarketplaceService.collectionList(operatorId)
  }

  @Get('admin/owens-token-details')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get token details' })
  @ApiBearerAuth()
  @Auth()
  async getTokenDetails(@GetUserId('id') id: string, @Query() startEndTimeDto: StartEndTimeDto) {
    return await this.owensMarketplaceService.getOwensTokenDetails(id, startEndTimeDto)
  }

  @Get('admin/transferred-assets-details')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get transferred Assets details' })
  @ApiBearerAuth()
  @Auth()
  async getTransferredAssetsDetails(@GetUserId('id') id: string, @Query() startEndTimeDto: StartEndTimeDto) {
    return await this.owensMarketplaceService.getTransferredAssetsDetailsList(id, startEndTimeDto)
  }
}
