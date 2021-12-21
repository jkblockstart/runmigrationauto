import { Injectable, BadRequestException, HttpService, ForbiddenException, Logger, Inject, forwardRef } from '@nestjs/common'
import { ConfigService } from 'shared/services/config.service'
import { getUserBy } from 'modules/user/user.repository'
import {
  AcceptOfferDto,
  AddCollectionDto,
  AddTemplateDto,
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
import {
  AcceptOfferInterface,
  AddedByRoleEnum,
  AddedSchemasInterface,
  AddedTemplatesInterface,
  AssetsHighlightsInterface,
  BlockchainEnum,
  CollectionsInterface,
  DepositInterface,
  EnableTemplateConfiguration,
  FilterInterface,
  GameRemoveCardFantasy4Interface,
  GameRemoveCardInterface,
  GameSendCardInterface,
  ListCardInterface,
  NewCollectionConfiguration,
  NewSchemaConfiguration,
  NewTemplateConfiguration,
  OfferInterface,
  OwenTokensInterface,
  PendingAssetsInterface,
  TranferredAssetsInterface,
  TransferCardInterface,
  TransferTypeEnum,
  WithdrawCardInterface,
} from './owens-marketplace.interface'
import { PaymentDto } from 'modules/payment/payment.dto'
import { PaymentService } from 'modules/payment/payment.service'
import { PaymentForEnum, PaymentStatusEnum } from 'modules/payment/payment.interface'
import { uuid } from 'uuidv4'
import { SmartContractService } from 'modules/smart-contract/smart-contract.service'
import { sleep } from 'helpers'
import {
  OwenTokensRepository,
  TransferredAssetsRepository,
  markAssetsTransferSuccessful,
  searchCollections,
  getCollection,
  updateCollection,
  getCollectionBy,
  CollectionsRepository,
  AddedSchemasRepository,
  getLastAddedcollection,
  AddedTemplatesRepository,
  getAddedCollectionsList,
  PendingAssetsRepository,
  getPendingAssetBy,
  getAssetIdHighlights,
  AssetsHighlightsRepository,
  updateAssetIdHighlights,
  getAssetIdHighlightsList,
  getCollectionsHighlightList,
  getAssetsHighlights,
  updateAssetHiglightsRank,
  getCollectionHighlights,
  updateColletionHiglightsRank,
  getTransferredAssetsDetails,
  getTransferredAssetsTotalCount,
  getTokenDetails,
  totalAmountAndCountToken,
} from './owens-marketplace.repository'
import { getSaleBy } from 'modules/sale/sale.repository'
import { getConfigurationBy } from 'modules/common/common.repository'
import { ConfigurationNameEnum } from 'modules/common/common.interface'
import { getOperatorBy } from 'modules/admin/admin.repository'
import { UnpackRecipientEnum } from 'modules/sale/sale.interface'
import { StartEndTimeDto } from 'modules/common/common.dto'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Hashids = require('hashids/cjs')
@Injectable()
export class OwensMarketplaceService {
  logger: Logger
  constructor(
    public readonly configService: ConfigService,
    public readonly http: HttpService,
    public readonly smartContractService: SmartContractService,
    public readonly transferredAssetsRepository: TransferredAssetsRepository,
    public readonly owenTokensRepository: OwenTokensRepository,
    public readonly collectionsRepository: CollectionsRepository,
    public readonly addedSchemasRepository: AddedSchemasRepository,
    public readonly addedTemplatesRepository: AddedTemplatesRepository,
    public readonly pendingAssetsRepository: PendingAssetsRepository,
    public readonly assetsHighlightsRepository: AssetsHighlightsRepository,
    @Inject(forwardRef(() => PaymentService))
    private paymentService: PaymentService
  ) {
    this.logger = new Logger()
  }

  async getWalletBalance(userId: string): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/user/wallet?apiKey=${apiKey}&email=${user.email}`
      try {
        const { data: wallet } = await this.http.get(url, { headers: {} }).toPromise()
        return wallet
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getWalletHistory(userId: string): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/user/wallet/history?apiKey=${apiKey}&email=${user.email}`
      try {
        const { data: wallet } = await this.http.get(url, { headers: {} }).toPromise()
        return wallet
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async reloadWallet(userId: string): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/user/wallet/reload?apiKey=${apiKey}&email=${user.email}`
      try {
        const { data: wallet } = await this.http.get(url, { headers: {} }).toPromise()
        return wallet
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async addWithdrawHistory(userId: string, requestId: string, status: string, balance: string) {
    try {
      const user = await getUserBy({ id: userId })
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/payment/withdraw-balance?apiKey=${apiKey}&email=${user.email}`
      const body = {
        requestId,
        status,
        balance,
        vaccount: user.username,
      }
      try {
        const { data: result } = await this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async collectionLists(userId: string): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/cardschema/filterList?apiKey=${apiKey}&email=${user.email}`
      try {
        const { data: result } = await this.http.get(url, { headers: {} }).toPromise()
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async filters({
    assetId,
    schemeName,
    price,
    assetName,
    collectionName,
    filterData,
    mint,
    page,
    limit,
    blockchain,
    sortBy,
    templateIds,
  }: FilterDto): Promise<any> {
    try {
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      let url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/cardschema/filterList?apiKey=${apiKey}`
      const query: FilterInterface = {
        collectionName,
        schemeName,
        filterData: filterData,
        price,
        mint,
        page,
        name: assetName,
        assetId,
        limit,
        blockchain,
        sortBy,
        templateIds,
      }
      for (const key in query) {
        if (query[key]) {
          url = `${url}&${key}=${query[key]}`
        }
      }
      try {
        const { data: result } = await this.http.get(url, { headers: {} }).toPromise()
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async listCardTokenMarket(userId: string, { assetId, assetCon, price }: ListCardDto): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const body: ListCardInterface = {
        vaccount: user.username,
        assetId,
        assetCon,
        price,
      }
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/tokenmarket/listcard?apiKey=${apiKey}&email=${user.email}`
      try {
        const { data: result } = await this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async cancelCardListing(userId: string, { assetId, assetCon }: ListCardDto): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const body: ListCardInterface = {
        vaccount: user.username,
        assetId,
        assetCon,
      }
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/tokenmarket/cancellist?apiKey=${apiKey}&email=${user.email}`
      try {
        const { data: result } = await this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async addOffer(userId: string, { assetId, assetCon, price, listBy }: OfferDto): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const body: OfferInterface = {
        vaccount: user.username,
        assetId,
        assetCon,
        listBy,
        price,
      }
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/tokenmarket/createoffer?apiKey=${apiKey}&email=${user.email}`
      try {
        const { data: result } = await this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async cancelOffer(userId: string, { assetId, assetCon, listBy }: OfferDto): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const body: OfferInterface = {
        vaccount: user.username,
        assetId,
        assetCon,
        listBy,
      }
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/tokenmarket/canceloffer?apiKey=${apiKey}&email=${user.email}`

      try {
        const { data: result } = await this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async acceptOffer(userId: string, { assetId, assetCon, listBy, offeredBy }: AcceptOfferDto): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const body: AcceptOfferInterface = {
        vaccount: user.username,
        assetId,
        assetCon,
        listBy,
        offeredBy,
      }
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/tokenmarket/acceptOffer?apiKey=${apiKey}&email=${user.email}`

      try {
        const { data: result } = await this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async directBuy(userId: string, { assetId, assetCon, listBy, price }: OfferDto): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const body: OfferInterface = {
        vaccount: user.username,
        assetId,
        assetCon,
        listBy,
        price,
      }
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/tokenmarket/directbuy?apiKey=${apiKey}&email=${user.email}`

      try {
        const { data: result } = await this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getAllBids(userId: string): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/tokenmarket/mybids?apiKey=${apiKey}&email=${user.email}`
      try {
        const { data: result } = await this.http.get(url, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async withdrawCard(userId: string, { assetIds, userAccount, assetCons, blockchain }: WithdrawCardDto): Promise<any> {
    try {
      if (blockchain == BlockchainEnum.Ethereum && assetIds.length > 1)
        throw new BadRequestException('You can withdraw only one ethereum based asset at a time')
      const user = await getUserBy({ id: userId })
      const ids = []
      const assets = []
      for (let index = 0; index < assetIds.length; index++) {
        const id = uuid()
        ids.push(id)
        const transferredAsset: TranferredAssetsInterface = {
          id,
          assetId: assetIds[index].toString(),
          userId,
          recipient: userAccount,
          transferType: TransferTypeEnum.Withdraw,
          status: false,
          assetCon: assetCons[index],
          blockchain,
        }
        assets.push({
          assetId: assetIds[index],
          assetCon: assetCons[index],
        })
        await this.transferredAssetsRepository.insert(transferredAsset)
      }
      this.logger.log('inserted ids', JSON.stringify(ids))
      const body: WithdrawCardInterface = {
        assets,
        userAddress: userAccount,
        blockchain,
      }
      this.logger.log('withdraw card body', JSON.stringify(body))
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/card/withdraw?apiKey=${apiKey}&email=${user.email}`
      try {
        const { data: result } = await this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        await markAssetsTransferSuccessful(ids)
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async sendCardForGame(userId: string, { assetIds, contract, matchId }: GameSendCardDto): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const ids = []
      const assts = []
      for (const assetId of assetIds) {
        const id = uuid()
        ids.push(id)
        const transferredAsset: TranferredAssetsInterface = {
          id,
          assetId: assetId.toString(),
          userId,
          recipient: contract,
          transferType: TransferTypeEnum.GameSendCard,
          status: false,
          assetCon: '',
          blockchain: null,
        }
        await this.transferredAssetsRepository.insert(transferredAsset)
        assts.push({ assetId: assetId, assetCon: 'atomicassets' })
      }

      const body: GameSendCardInterface = {
        vaccount: user.username,
        // assetIds,
        assets: assts,
        matchId,
        matchContract: contract,
      }
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/card/addgamecard?apiKey=${apiKey}&email=${user.email}`
      try {
        const { data: result } = await this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        await markAssetsTransferSuccessful(ids)
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async removeCardForGame(userId: string, { assetIds, contract }: GameRemoveCardDto): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const ids = []
      for (const assetId of assetIds) {
        const id = uuid()
        ids.push(id)
        const transferredAsset: TranferredAssetsInterface = {
          id,
          assetId: assetId.toString(),
          userId,
          recipient: contract,
          transferType: TransferTypeEnum.GameRemoveCard,
          status: false,
          assetCon: '',
          blockchain: null,
        }
        await this.transferredAssetsRepository.insert(transferredAsset)
      }

      const body: GameRemoveCardInterface = {
        vaccount: user.username,
        assetIds,
        matchContract: contract,
      }
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/card/remgamecard?apiKey=${apiKey}&email=${user.email}`
      try {
        const { data: result } = await this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        await markAssetsTransferSuccessful(ids)
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async removeCardForFantasy4Game(userId: string, { teamIds, contract, matchId }: GameRemoveCardFantasy4Dto): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const ids = []
      for (const teamId of teamIds) {
        const id = uuid()
        ids.push(id)
        const transferredAsset: TranferredAssetsInterface = {
          id,
          assetId: teamId.toString(),
          userId,
          recipient: contract,
          transferType: TransferTypeEnum.GameRemoveCard,
          status: false,
          assetCon: '',
          blockchain: null,
        }
        await this.transferredAssetsRepository.insert(transferredAsset)
      }

      const body: GameRemoveCardFantasy4Interface = {
        vaccount: user.username,
        teamIds,
        matchId,
      }

      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/card/remgamecard/fntsy4?apiKey=${apiKey}&email=${user.email}`
      try {
        const { data: result } = await this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        await markAssetsTransferSuccessful(ids)
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async unpackCard(userId: string, assetId: number, assetCon: string, blockchain: number): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const [assetTemplateDetails] = await this.smartContractService.getAssetTemplateDetails(assetId)
      this.logger.log('assetTemplac1', JSON.stringify(assetTemplateDetails))
      if (!assetTemplateDetails) throw new BadRequestException('Invalid asset id')
      const saleDetails = await getSaleBy({ templateId: assetTemplateDetails.template_id })
      this.logger.log('sale details', JSON.stringify(saleDetails))
      if (!saleDetails || saleDetails.unpackRecipient == UnpackRecipientEnum.UnboxOwens) {
        const [assetDetails] = await this.smartContractService.getAssetDetails(assetTemplateDetails.template_id)
        //TODO: have to check for multiple sale with same templateID
        if (!assetDetails) throw new BadRequestException('Asset not found')
        if (!assetDetails.enabled) {
          if (saleDetails.unpackStartTime <= new Date()) {
            const enableTemplate: EnableTemplateConfiguration = {
              pack_template: assetTemplateDetails.template_id,
            }
            const txnDetails = await this.smartContractService.enableTemplate(enableTemplate)
            if (!txnDetails.txnStatus) throw new BadRequestException('Unpack enabling failed')
          } else {
            throw new BadRequestException('asset not enable for unpacking')
          }
        }

        const [assetAvailiablityDetails] = await this.smartContractService.getAssetAvailiabilityDetails(assetDetails.packscope)
        if (!assetAvailiablityDetails) throw new BadRequestException('Unable to fetch asset availiability details')
        if (assetAvailiablityDetails.cards_minted - assetAvailiablityDetails.cards_claimed < assetDetails.cards_per_pack)
          throw new BadRequestException('Don have enough card to mint')
      }
      let userAddress = UnpackRecipientEnum.UnboxOwens
      if (saleDetails) {
        userAddress = saleDetails.unpackRecipient
      }
      const body: WithdrawCardInterface = {
        assets: [
          {
            assetId,
            assetCon: assetCon,
          },
        ],
        userAddress,
        memo: user.username,
        blockchain,
      }
      this.logger.log(body, JSON.stringify(body))
      const id = uuid()
      const transferredAsset: TranferredAssetsInterface = {
        id,
        assetId: assetId.toString(),
        userId,
        recipient: userAddress,
        transferType: TransferTypeEnum.Unpack,
        status: false,
        assetCon,
        blockchain,
      }
      await this.transferredAssetsRepository.insert(transferredAsset)
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/card/withdraw?apiKey=${apiKey}&email=${user.email}`
      await this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } }).toPromise()
      try {
        await markAssetsTransferSuccessful([id])
        return {
          message: 'Successfully Minted',
        }
      } catch (err) {
        this.logger.log('error', err)
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      this.logger.log('error2', err)
      throw new BadRequestException(err.message)
    }
  }

  async pendingAssets(userId: string): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const pendingAssets = await this.smartContractService.getPendingAssets()
      const pendingAssetIds = []
      for (const asset of pendingAssets.data) {
        if (asset.vaccount == user.username) {
          pendingAssetIds.push(asset.asset_id)
        }
      }
      return pendingAssetIds
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getMyList(
    userId: string,
    { assetId, schemeName, price, assetName, collectionName, filterData, mint, page, limit, blockchain, sortBy, templateIds }: FilterDto
  ): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const query: FilterInterface = {
        collectionName,
        schemeName,
        filterData: filterData,
        price,
        mint,
        page,
        name: assetName,
        assetId,
        limit,
        blockchain,
        sortBy,
        templateIds,
      }
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      let url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/tokenmarket/mylisting?apiKey=${apiKey}&email=${user.email}`
      for (const key in query) {
        if (query[key]) {
          url = `${url}&${key}=${query[key]}`
        }
      }
      try {
        const { data: result } = await this.http.get(url, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async notifyInstruction(userId: string): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/Notify/instruction?apiKey=${apiKey}&email=${user.email}`
      try {
        const { data: result } = await this.http.post(url, {}, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getUserVault(
    userId: string,
    { assetId, schemeName, price, assetName, collectionName, filterData, mint, page, limit, blockchain, sortBy, templateIds }: FilterDto
  ): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const query: FilterInterface = {
        collectionName,
        schemeName,
        filterData: filterData,
        price,
        mint,
        page,
        name: assetName,
        assetId,
        limit,
        blockchain,
        sortBy,
        templateIds,
      }
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      let url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/card/myvault?apiKey=${apiKey}&email=${user.email}`
      for (const key in query) {
        if (query[key]) {
          url = `${url}&${key}=${query[key]}`
        }
      }
      try {
        const { data: result } = await this.http.get(url, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        if (schemeName == 'packs' && result.cards.length) {
          for (const card of result.cards) {
            const [assetTemplateDetails] = await this.smartContractService.getAssetTemplateDetails(card.id)
            if (assetTemplateDetails && assetTemplateDetails.template_id) {
              const saleDetails = await getSaleBy({ templateId: assetTemplateDetails.template_id })
              if (saleDetails) {
                card.unpackStartTime = saleDetails.unpackStartTime
              } else {
                card.unpackStartTime = ''
              }
            } else {
              card.unpackStartTime = ''
            }
          }
        }
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getAllTokenMarketCard(
    userId: string,
    { assetId, schemeName, price, assetName, collectionName, filterData, mint, page, limit, blockchain, sortBy, templateIds }: FilterDto
  ): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const query: FilterInterface = {
        collectionName,
        schemeName,
        filterData,
        price,
        mint,
        page,
        name: assetName,
        assetId,
        limit,
        blockchain,
        sortBy,
        templateIds,
      }
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      let url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/tokenmarket/cards?apiKey=${apiKey}&email=${user.email}`
      for (const key in query) {
        if (query[key]) {
          url = `${url}&${key}=${query[key]}`
        }
      }
      try {
        const { data: result } = await this.http.get(url, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getAllMarketplaceCards({
    assetId,
    schemeName,
    price,
    assetName,
    collectionName,
    filterData,
    mint,
    page,
    limit,
    blockchain,
    sortBy,
    templateIds,
  }: FilterDto): Promise<any> {
    try {
      const query: FilterInterface = {
        collectionName,
        schemeName,
        filterData,
        price,
        mint,
        page,
        name: assetName,
        assetId,
        limit,
        blockchain,
        sortBy,
        templateIds,
      }
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      let url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/tokenmarket/allcards?apiKey=${apiKey}`
      for (const key in query) {
        if (query[key]) {
          url = `${url}&${key}=${query[key]}`
        }
      }
      this.logger.debug('get all marketplace card url', url)
      try {
        const { data: result } = await this.http.get(url, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getMarketFee(userId: string, assetId: number, assetCon: string): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/card/marketfee?apiKey=${apiKey}&email=${
        user.email
      }&assetId=${assetId}&assetCon=${assetCon}`
      try {
        const { data: result } = await this.http.get(url, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async cardDetails(userId: string, assetId: number, assetCon: string): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get(
        'OWENS_MARKETPLACE_BASE_API'
      )}/card/asset?assetId=${assetId}&assetCon=${assetCon}&apiKey=${apiKey}&email=${user.email}`
      try {
        const { data: result } = await this.http.get(url, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async cardDetailsPublic(assetId: number, assetCon: string): Promise<any> {
    try {
      const assets = [{ assetId, assetCon }]
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/tokenmarket/allcards?assets=${JSON.stringify(assets)}`
      this.logger.log('logg', url)
      try {
        const { data: result } = await this.http.get(url, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async buyOwensToken(userId: string, paymentObj: PaymentDto) {
    let paymentDetails
    let user
    try {
      paymentObj.amount = (parseFloat(paymentObj.amount) * 100).toString()
      // const paymentDetails = await this.paymentService.pay(paymentObj, userId, PaymentForEnum.OwensToken)
      //---------
      paymentDetails = await this.paymentService.holdPay(
        paymentObj,
        userId,
        PaymentForEnum.Bid,
        parseFloat(this.configService.get('STRIPE_FEE'))
      )
      //---------
      // this.logger.log('paymentDetails --after holdpay ', JSON.stringify(paymentDetails))
      if (paymentDetails.status == PaymentStatusEnum.failed) throw new BadRequestException('Payment Failed')
      user = await getUserBy({ id: userId })
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/payment/stripepay?apiKey=${apiKey}&email=${user.email}`
      const body = {
        amount: parseFloat(paymentObj.amount) / 100,
        currency: paymentObj.currency,
      }
      try {
        const { data: result } = await this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        // //---------
        // await this.paymentService.captureHoldpayment(paymentDetails.finalPayment.id, paymentDetails.id)
        // if (!paymentObj.saveCard) await this.paymentService.deleteCard(user.customerId, paymentDetails.finalPayment.payment_method)
        await this.paymentService.captureHoldpayment(paymentDetails, user.customerId, paymentObj.saveCard)

        //---------
        const OwenTokens: OwenTokensInterface = {
          id: uuid(),
          userId,
          amount: parseFloat(paymentObj.amount) / 100,
          paymentId: paymentDetails.id,
        }
        await this.owenTokensRepository.insert(OwenTokens)
        return result
      } catch (err) {
        this.logger.log('went tp error log 1 --> ', err)
        //---------
        // if (paymentDetails.finalPayment.id) await this.paymentService.cancelHoldPayment(paymentDetails.finalPayment.id, paymentDetails.id)
        if (paymentDetails.finalPayment)
          if (paymentDetails.finalPayment.id) await this.paymentService.cancelHoldPayment(paymentDetails, userId, paymentObj.saveCard)
        //---------
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      //---------
      this.logger.log('went tp error log 2 --> ', err)
      //---------
      if (paymentDetails.finalPayment)
        if (paymentDetails.finalPayment.id) await this.paymentService.cancelHoldPayment(paymentDetails, userId, paymentObj.saveCard)
      //---------
      throw new BadRequestException(err.message)
    }
  }

  async transferCard(userId: string, { assetIds, recipient, assetCons }: TransferCardDto): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/card/transferCard?apiKey=${apiKey}&email=${user.email}`
      const assets = []
      const ids = []
      for (let index = 0; index < assetIds.length; index++) {
        const id = uuid()
        ids.push(id)
        const transferredAsset: TranferredAssetsInterface = {
          id,
          assetId: assetIds[index].toString(),
          userId,
          recipient,
          transferType: TransferTypeEnum.Gift,
          status: false,
          assetCon: '',
          blockchain: null,
        }
        assets.push({
          assetId: assetIds[index],
          assetCon: assetCons[index],
        })
        await this.transferredAssetsRepository.insert(transferredAsset)
      }
      const body: TransferCardInterface = {
        assets,
        toEmail: recipient,
      }
      try {
        const { data: result } = await this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        await markAssetsTransferSuccessful(ids)
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getUserActivity(userId: string): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/activity?apiKey=${apiKey}&email=${user.email}`
      try {
        const { data: result } = await this.http.get(url, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async checkAdmin(userId: string): Promise<boolean> {
    const user = await getUserBy({ id: userId })
    if (JSON.parse(JSON.stringify(this.configService.get('SUPER_ADMIN'))).includes(user.email)) return true
    else return false
  }

  async search(keyword: string): Promise<any> {
    try {
      const collections = await searchCollections(keyword)
      return collections
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async addcollectionAdmin(userId: string, adminAddCollectionDto: AdminAddCollectionDto): Promise<any> {
    try {
      const isAdmin = await this.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      const collectionDetails = await getCollectionBy({ collection: adminAddCollectionDto.collection })
      if (collectionDetails) throw new BadRequestException('Collection already added')
      const assetCon = 'atomicassets'
      const collectionListInterface: CollectionsInterface = {
        id: uuid(),
        collection: adminAddCollectionDto.collection,
        collectionName: adminAddCollectionDto.collectionName,
        collectionImage: adminAddCollectionDto.collectionImage,
        collectionCoverImage: adminAddCollectionDto.collectionCoverImage,
        collectionDescription: adminAddCollectionDto.collectionDescription,
        isFeatured: adminAddCollectionDto.isFeatured,
        addedBy: userId,
        txnStatus: true,
        assetCon,
        addedByRole: AddedByRoleEnum.Admin,
        blockchain: adminAddCollectionDto.blockchain,
        isHighlight: false,
      }
      await this.collectionsRepository.insert(collectionListInterface)
      return { message: 'file Updated Successfully' }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async addCollectionUser(
    userId: string,
    operatorId: number,
    {
      collectionName,
      collectionCoverImage,
      collectionDescription,
      collectionImage,
      amount,
      card,
      currency,
      description,
      saveCard,
      blockchain,
    }: AddCollectionDto
  ): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const collectionExist = await getCollectionBy({ collectionName, txnStatus: true })
      if (collectionExist) throw new BadRequestException('Collection already exist')
      const id = uuid()
      const collection = await this.getUserCollectionName(userId, user.email)
      //TODO: WHEN ETHEREUM BASIC SALE WILL START HAVE TO REPLACE IT
      const assetCon = 'atomicassets'
      const collectionDetails: CollectionsInterface = {
        id,
        collection,
        collectionName,
        collectionImage,
        collectionCoverImage,
        collectionDescription,
        addedBy: userId,
        assetCon,
        operatorId,
        addedByRole: AddedByRoleEnum.User,
        blockchain,
        isHighlight: false,
      }
      await this.collectionsRepository.insert(collectionDetails)
      const paymentConfiguration = await getConfigurationBy({ operatorId, name: ConfigurationNameEnum.FEE_ACTIVATION })
      this.logger.log('new collection payment config', JSON.stringify(paymentConfiguration))
      const collectionFeeConfig = await getConfigurationBy({ operatorId, name: ConfigurationNameEnum.COLLECTION_FEE })
      let paymentDetails
      if (paymentConfiguration && paymentConfiguration.value && collectionFeeConfig && collectionFeeConfig.value > 0) {
        if (parseFloat(amount) != collectionFeeConfig.value) throw new BadRequestException('Invalid collection fee')
        const paymentObj: PaymentDto = {
          amount,
          card,
          currency,
          description,
          saveCard,
        }
        paymentDetails = await this.paymentService.pay(paymentObj, user.id, PaymentForEnum.Collection)
        await this.collectionsRepository.update(id, { paymentId: paymentDetails.id })
        if (paymentDetails.status == PaymentStatusEnum.failed) throw new BadRequestException('Payment Failed')
      }
      const collectionConfiguration: NewCollectionConfiguration = {
        author: this.configService.get('WAX_ADMIN_ACCOUNT'),
        collection_name: collection,
        allow_notify: true,
        authorized_accounts: [this.configService.get('WAX_ADMIN_ACCOUNT'), this.configService.get('WAX_SALE_CONTRACT')],
        // authorized_accounts: [this.configService.get('WAX_ADMIN_ACCOUNT')],
        notify_accounts: [],
        market_fee: 0.05,
        data: [],
      }
      const smartContractResult = await this.smartContractService.addNewCollection(collectionConfiguration)
      this.logger.log('new collection sc result', JSON.stringify(smartContractResult))
      this.logger.log('new collection sc config', JSON.stringify(collectionConfiguration))
      await this.collectionsRepository.update(id, smartContractResult)
      if (!smartContractResult.txnStatus) throw new BadRequestException(smartContractResult.txnMessage)
      await this.addNewSchema(userId, collection, id)
      return { message: 'Collection added successfully', data: { collection, collectionName } }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getCollectionList(): Promise<any> {
    try {
      const collectionList = await getCollection()
      return collectionList
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async addNewSchema(userId: string, collection: string, collectionId: string): Promise<any> {
    try {
      await sleep(4000)
      const id = uuid()
      const schema = 'packs'
      const schemaFormat = [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'img',
          type: 'string',
        },
      ]
      // if (names.length != types.length || names.length < 2) throw new BadRequestException('Invalid schema format')
      // for (let index = 0; index < names.length; index++) {
      //   schemaFormat.push({
      //     name: names[index],
      //     type: types[index],
      //   })
      // }
      const schemaDetails: AddedSchemasInterface = {
        id,
        collectionId,
        schema,
        addedBy: userId,
        schemaFormat: JSON.stringify(schemaFormat),
      }
      await this.addedSchemasRepository.insert(schemaDetails)
      const schemaConfiguration: NewSchemaConfiguration = {
        authorized_creator: this.configService.get('WAX_ADMIN_ACCOUNT'),
        collection_name: collection,
        schema_name: schema,
        schema_format: schemaFormat,
      }
      const smartContractResult = await this.smartContractService.addNewSchema(schemaConfiguration)
      this.logger.log('smartContractResult', JSON.stringify(smartContractResult))
      this.logger.log('schemaConfiguration', JSON.stringify(schemaConfiguration))
      await this.addedSchemasRepository.update(id, smartContractResult)
      if (!smartContractResult.txnStatus) throw new BadRequestException(smartContractResult.txnMessage)
      return { message: 'Schema added successfully' }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async updateFeaturecollection(userId: string, updateFeatureDto: UpdateFeatureDto): Promise<any> {
    try {
      const isAdmin = await this.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      await updateCollection(updateFeatureDto.collection, updateFeatureDto.isFeatured, updateFeatureDto.isHighlight)
      const collectionList = await getCollection()
      return { message: 'Feature Updated Successfully', collectionList: collectionList }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getUserCollectionName(userId: string, email: string): Promise<any> {
    const lastAddedCollection = await getLastAddedcollection(userId)
    let collectionNumber = 'aa1'
    if (lastAddedCollection.length) {
      const lastCollectionNumber = lastAddedCollection[0].collection.substring(0, 3)
      if (parseInt(lastCollectionNumber[2]) < 5) {
        collectionNumber = lastCollectionNumber[0] + lastCollectionNumber[1] + (parseInt(lastCollectionNumber[2]) + 1)
      } else if (lastCollectionNumber[1] != 'z') {
        collectionNumber = lastCollectionNumber[0] + String.fromCharCode(lastCollectionNumber[1].charCodeAt() + 1) + 1
      } else if (lastCollectionNumber[0] != 'z') {
        collectionNumber = String.fromCharCode(lastCollectionNumber[0].charCodeAt() + 1) + 'a' + 1
      } else {
        throw new BadRequestException('Invalid Collection name')
      }
    }
    const hashid = new Hashids(email.toLowerCase(), 9)
    const hashsh = hashid.encode(999)
    const username = collectionNumber + (await this.reshapeCollectionName(hashsh.toLowerCase()))
    return username
  }

  async reshapeCollectionName(collectionName: string): Promise<any> {
    let reshapedUsername = ''
    const encoding = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o']
    for (let i = 0; i < collectionName.length; i++) {
      if (parseInt(collectionName.charAt(i)) === 0 || parseInt(collectionName.charAt(i)) > 5) {
        reshapedUsername += encoding[collectionName.charAt(i)]
      } else reshapedUsername += collectionName.charAt(i)
    }
    return reshapedUsername
  }

  async addNewTemplate(userId: string, { collectionId, schema, maxSupply, data }: AddTemplateDto): Promise<any> {
    try {
      const id = uuid()
      const collectionDetails = await getCollectionBy({ id: collectionId })
      const url = `${this.configService.get('ATOMIC_HUB_API')}/atomicassets/v1/schemas/${collectionDetails.collection}/${schema}`
      const { data: schemaDetails } = await this.http.get(url, { headers: {} }).toPromise()
      if (!schemaDetails.success) throw new BadRequestException('invalid schema')
      const templateData = []
      for (const name in data) {
        const value = data[name]
        const type = schemaDetails.data.format.find((item) => item.name == name).type
        templateData.push({
          key: name,
          value: [type, value],
        })
      }
      const templateDetails: AddedTemplatesInterface = {
        id,
        collectionId,
        schema,
        addedBy: userId,
        templateData: JSON.stringify(templateData),
        maxSupply,
      }
      await this.addedTemplatesRepository.insert(templateDetails)
      const templateConfiguration: NewTemplateConfiguration = {
        authorized_creator: this.configService.get('WAX_ADMIN_ACCOUNT'),
        collection_name: collectionDetails.collection,
        schema_name: schema,
        transferable: true,
        burnable: true,
        max_supply: maxSupply,
        immutable_data: templateData,
      }
      const smartContractResult = await this.smartContractService.addNewTemplate(templateConfiguration)
      this.logger.log('add new template sc result', JSON.stringify(smartContractResult))
      await this.addedTemplatesRepository.update(id, smartContractResult)
      if (!smartContractResult.txnStatus) throw new BadRequestException(smartContractResult.txnMessage)
      const [templateDetail] = await this.smartContractService.getTemplateId(collectionDetails.collection)
      this.logger.log('templated Id', templateDetail)
      await this.addedTemplatesRepository.update(id, { templateId: templateDetail.template_id })
      return templateDetail.template_id
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getAddedCollections(userId: string, operatorId: number, blockchain: number): Promise<any> {
    const collectionList = await getAddedCollectionsList(userId, operatorId, blockchain)
    return collectionList
  }

  async depositAsset(userId: string, { assetCon, assetId, blockchain, txnId, userAddress }: DepositAssetDto): Promise<any> {
    try {
      const id = uuid()
      this.logger.log('userId', userId)
      const user = await getUserBy({ id: userId })
      this.logger.log('user details', JSON.stringify(user))
      const recipient =
        blockchain == BlockchainEnum.Ethereum
          ? this.configService.get('ETHEREUM_ADMIN_PUBLIC_KEY')
          : this.configService.get('WAX_ADMIN_PUBLIC_KEY')
      const transferredAsset: TranferredAssetsInterface = {
        id,
        assetId: assetId.toString(),
        userId,
        recipient,
        transferType: TransferTypeEnum.Deposit,
        status: false,
        assetCon,
        blockchain,
        comment: `${txnId}-${userAddress}`,
      }
      this.logger.log('transferredAsset deposit', JSON.stringify(transferredAsset))
      await this.transferredAssetsRepository.insert(transferredAsset)
      try {
        const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
        const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/blockchain/deposit?apiKey=${apiKey}&email=${user.email}`
        this.logger.log('url', url)
        const body: DepositInterface = {
          vaccount: user.username,
          contract: assetCon,
          assetId,
          blockchain,
          userAddress,
        }
        this.logger.log('deposit body', JSON.stringify(body))
        const { data: result } = await this.http.post(url, body, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        await markAssetsTransferSuccessful([id])
        this.logger.log('deposit result', JSON.stringify(result))
        return result
      } catch (err) {
        this.logger.error('deposit err', err)
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async addPendingAsset(assetId: number, saleId: number, userId: string): Promise<any> {
    try {
      const pendingAsset: PendingAssetsInterface = {
        id: uuid(),
        userId,
        saleId,
        assetId,
      }
      await this.pendingAssetsRepository.insert(pendingAsset)
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async depositMintedAssets(userId: string, { saleId, fromNFTId, toNFTId }: DepositMintedAssetDto): Promise<any> {
    try {
      const isAdmin = await this.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      const saleDetails = await getSaleBy({ id: saleId })
      for (let assetId = fromNFTId; assetId <= toNFTId; assetId++) {
        const pendingAssetDetails = await getPendingAssetBy({ saleId, assetId })
        const isAssetMinted = await this.smartContractService.checkEthereumAsset(saleDetails.assetCon, assetId)
        if (!isAssetMinted) throw new BadRequestException(`Asset ${assetId} not yet minted`)
        if (!pendingAssetDetails) throw new BadRequestException(`Invalid pending asset ${assetId}`)
        await this.depositAsset(pendingAssetDetails.userId, {
          assetCon: saleDetails.assetCon,
          assetId,
          blockchain: BlockchainEnum.Ethereum,
          txnId: '',
          userAddress: '',
        })
        await this.pendingAssetsRepository.delete(pendingAssetDetails.id)
        sleep(5000)
      }
      return 'successfully deposited'
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async addAssetIdHighlight(userId: string, assetsHighlightsDto: AssetsHighlightsDto): Promise<any> {
    try {
      const isAdmin = await this.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      const assetHighlights = await getAssetIdHighlights(
        assetsHighlightsDto.assetId.toString(),
        assetsHighlightsDto.assetCon,
        assetsHighlightsDto.blockchain,
        assetsHighlightsDto.operatorId
      )
      if (assetHighlights[0]) {
        await updateAssetIdHighlights(
          assetsHighlightsDto.assetId.toString(),
          assetsHighlightsDto.assetCon,
          assetsHighlightsDto.blockchain,
          assetsHighlightsDto.isHighlight,
          assetsHighlightsDto.operatorId
        )
        return { message: 'Asset updated Successfully' }
      } else {
        const assetsHighlightsInterface: AssetsHighlightsInterface = {
          id: uuid(),
          assetId: assetsHighlightsDto.assetId.toString(),
          userId: userId,
          assetCon: assetsHighlightsDto.assetCon,
          blockchain: assetsHighlightsDto.blockchain,
          isHighlight: assetsHighlightsDto.isHighlight,
          operatorId: assetsHighlightsDto.operatorId,
        }
        await this.assetsHighlightsRepository.insert(assetsHighlightsInterface)
        return { message: 'Asset added Successfully' }
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getHighlightedAssets(operatorId: number): Promise<any> {
    try {
      const operatorExist = await getOperatorBy({ id: operatorId })
      if (!operatorExist) throw new BadRequestException('Invalid operator')
      const assetHighlightList = await getAssetIdHighlightsList(operatorId)
      if (assetHighlightList[0]) {
        const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/card/assetByIds?assets=${JSON.stringify(assetHighlightList)}`
        const { data: result } = await this.http.get(url, { headers: {} }).toPromise()
        return result
      } else return assetHighlightList
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getHighlightedCollections(operatorId: number): Promise<any> {
    try {
      const operatorExist = await getOperatorBy({ id: operatorId })
      if (!operatorExist) throw new BadRequestException('Invalid operator')
      const assetHighlightList = await getCollectionsHighlightList(operatorId)
      return assetHighlightList
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async addAssetIdHighlightRank(userId: string, assetsHighlightsRankDto: AssetsHighlightsRankDto): Promise<any> {
    try {
      const isAdmin = await this.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      const operatorExist = await getOperatorBy({ id: assetsHighlightsRankDto.operatorId })
      if (!operatorExist) throw new BadRequestException('Invalid operator')
      const checkAssetLength = assetsHighlightsRankDto.asset.length
      const sortedVal = assetsHighlightsRankDto.asset.sort((a, b) => a.rank - b.rank)
      const assetIds = await getAssetsHighlights({ operatorId: assetsHighlightsRankDto.operatorId })
      const rankCount = sortedVal[assetsHighlightsRankDto.asset.length - 1].rank
      for (let index = 1; index <= rankCount; index++) {
        if (sortedVal[index - 1].rank != index) {
          return { message: 'please add all ranks from 1 to ' + rankCount }
        }
      }
      let assetMatchCount = 0
      for (let index = 0; index < assetIds.length; index++) {
        if (
          !sortedVal.some((e) => e.assetId.toString() === assetIds[index].assetId && e.assetCon.toString() === assetIds[index].assetCon)
        ) {
          sortedVal.push({ assetId: parseInt(assetIds[index].assetId), rank: sortedVal.length + 1, assetCon: assetIds[index].assetCon })
        } else assetMatchCount++
      }
      if (assetMatchCount != checkAssetLength) return { message: 'assetId not found' }
      await updateAssetHiglightsRank(sortedVal, assetsHighlightsRankDto.operatorId)
      return { message: 'Asset Ranks Updated' }
    } catch (err) {
      this.logger.error(err)
      throw new BadRequestException(err.message)
    }
  }

  async addCollectionHighlightRank(userId: string, collectionHighlightsRankDto: CollectionHighlightsRankDto): Promise<any> {
    try {
      const isAdmin = await this.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      const operatorExist = await getOperatorBy({ id: collectionHighlightsRankDto.operatorId })
      if (!operatorExist) throw new BadRequestException('Invalid operator')
      const checkCollectionLength = collectionHighlightsRankDto.asset.length
      const sortedVal = collectionHighlightsRankDto.asset.sort((a, b) => a.rank - b.rank)
      const assetIds = await getCollectionHighlights({ operatorId: collectionHighlightsRankDto.operatorId })
      const rankCount = sortedVal[collectionHighlightsRankDto.asset.length - 1].rank
      for (let index = 1; index <= rankCount; index++) {
        if (sortedVal[index - 1].rank != index) {
          return { message: 'Please add all ranks from 1 to ' + rankCount }
        }
      }
      let collectionMatchCount = 0
      for (let index = 0; index < assetIds.length; index++) {
        if (!sortedVal.some((e) => e.collection.toString() === assetIds[index].collection)) {
          sortedVal.push({ collection: assetIds[index].collection, rank: sortedVal.length + 1 })
        } else collectionMatchCount++
      }
      if (collectionMatchCount != checkCollectionLength) return { message: 'Collection not found' }
      await updateColletionHiglightsRank(sortedVal, collectionHighlightsRankDto.operatorId)
      return { message: 'Collection Ranks Updated' }
    } catch (err) {
      this.logger.error(err)
      throw new BadRequestException(err.message)
    }
  }

  async getTemplateIdsDetails(templateIds): Promise<any> {
    try {
      const query = {
        templateIds: templateIds,
      }
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      let url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/cardschema/getTemplateIdsDetails?apiKey=${apiKey}`
      for (const key in query) {
        if (query[key]) {
          url = `${url}&${key}=${query[key]}`
        }
      }
      try {
        const { data: result } = await this.http.get(url, { headers: { 'Content-Type': 'application/json' } }).toPromise()
        return result
      } catch (err) {
        throw new BadRequestException(err.response.data.message)
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async collectionList(operatorId: number) {
    try {
      const operatorExist = await getOperatorBy({ id: operatorId })
      if (!operatorExist) throw new BadRequestException('Invalid operator')
      const collectionDetails = await getCollectionHighlights({ operatorId: operatorId })
      return collectionDetails
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getOwensTokenDetails(userId: string, { startDatetime, endDatetime, page, limit }: StartEndTimeDto) {
    try {
      const skip = page * limit - limit
      const isAdmin = await this.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      let tokenDetails = await getTokenDetails(startDatetime, endDatetime, skip, limit)
      tokenDetails = await this.formatPaymentsData(tokenDetails, true)
      const totalSale = await totalAmountAndCountToken(startDatetime, endDatetime)
      return { filteredData: tokenDetails, totalSale: totalSale.sum, count: totalSale.totalCount }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async formatPaymentsData(paymentDetails, isAmountInCent?: boolean) {
    for (const paymentDetail of paymentDetails) {
      if (paymentDetail.stripePaymentDescription) {
        const parseResult = JSON.parse(paymentDetail.stripePaymentDescription)
        paymentDetail.stripePaymentId = parseResult ? parseResult.stripePaymentId : null
      } else paymentDetail.stripePaymentId = null
      if (paymentDetail.paymentFor == PaymentForEnum.Bid) paymentDetail.paymentFor = 'Bid'
      else if (paymentDetail.paymentFor == PaymentForEnum.OwensToken) paymentDetail.paymentFor = 'OwensToken'
      else if (paymentDetail.paymentFor == PaymentForEnum.Collection) paymentDetail.paymentFor = 'Collection'
      else if (paymentDetail.paymentFor == PaymentForEnum.Sale) paymentDetail.paymentFor = 'Sale'
      if (!isAmountInCent) paymentDetail.amount = paymentDetail.amount ? paymentDetail.amount / 100 : 0
      delete paymentDetail.stripePaymentDescription
    }
    return paymentDetails
  }

  async getTransferredAssetsDetailsList(userId: string, { startDatetime, endDatetime, page, limit }: StartEndTimeDto) {
    try {
      const skip = page * limit - limit
      const isAdmin = await this.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      const transferredAssetsDetails = await getTransferredAssetsDetails(startDatetime, endDatetime, skip, limit)
      const transferredAssetsTotalCount = await getTransferredAssetsTotalCount(startDatetime, endDatetime)
      for (const transferredAssetsDetail of transferredAssetsDetails) {
        if (transferredAssetsDetail.transferType == TransferTypeEnum.Withdraw) transferredAssetsDetail.transferName = 'Withdraw'
        else if (transferredAssetsDetail.transferType == TransferTypeEnum.Gift) transferredAssetsDetail.transferName = 'Gift'
        else if (transferredAssetsDetail.transferType == TransferTypeEnum.Unpack) transferredAssetsDetail.transferName = 'Unpack'
        else if (transferredAssetsDetail.transferType == TransferTypeEnum.GameSendCard)
          transferredAssetsDetail.transferName = 'GameSendCard'
        else if (transferredAssetsDetail.transferType == TransferTypeEnum.GameRemoveCard)
          transferredAssetsDetail.transferName = 'GameRemoveCard'
      }
      return { filteredData: transferredAssetsDetails, count: transferredAssetsTotalCount.totalCount }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }
}
