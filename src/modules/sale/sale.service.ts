import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common'
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
import { uuid } from 'uuidv4'
import { ConfigService } from 'shared/services/config.service'
import {
  BuyTemplateConfiguration,
  EthereumSaleInterface,
  QueueTypeEnum,
  SaleConfiguration,
  SaleEndConfiguration,
  SaleInterface,
  SaleQueueConfiguration,
  SaleQueueInterface,
  SaleRegistrationInterface,
  SaleUpdateInterface,
  SoldTemplateInterface,
  UnpackRecipientEnum,
  ErrorTypeEnum,
} from './sale.interface'
import {
  EthereumSaleRepository,
  getAllRegisteredUsers,
  getAllRegistrations,
  getCurrentSlot,
  getEthereumSaleBy,
  getNextRank,
  getSaleBy,
  getSaleLastSlot,
  getSaleQueuesBy,
  getSaleRegistrationBy,
  getSlotForRankDetails,
  getTotalReservedNFTs,
  saleList,
  saleListByCollection,
  saleListByCollectionPublic,
  saleListPublic,
  SaleQueueRepository,
  SaleRegistrationRepository,
  SaleRepository,
  salesAllPayment,
  SoldTemplatesRepository,
  totalUnitsBought,
  totalUnitsBoughtByUser,
  updateSaleQueue,
  fetchRefundListAdmin,
  filterSalePayment,
  soldTemplateTotalAmountAndCount,
  allSalePayment,
  soldTemplatesTotalAmountAndCount,
  saleIdList,
} from './sale.repository'
import { AdminService } from 'modules/admin/admin.service'
import { getUserBy } from 'modules/user/user.repository'
import { SmartContractService } from 'modules/smart-contract/smart-contract.service'
import { PaymentService } from 'modules/payment/payment.service'
import { PaymentDto } from 'modules/payment/payment.dto'
import { PaymentForEnum, PaymentStatusEnum } from 'modules/payment/payment.interface'
import { CollectionsRepository, getCollectionBy } from 'modules/owens-marketplace/owens-marketplace.repository'
import { OwensMarketplaceService } from 'modules/owens-marketplace/owens-marketplace.service'
import { BlockchainEnum, CollectionsInterface } from 'modules/owens-marketplace/owens-marketplace.interface'
import { getConfigurationBy } from 'modules/common/common.repository'
import { ConfigurationNameEnum } from 'modules/common/common.interface'
import { getOperatorBy } from 'modules/admin/admin.repository'
import { getPaymentBy } from 'modules/payment/payment.repository'
import { sendMessageToTelegram } from '../../helpers'
import { TelegramErrorTypeEnum } from '../../shared/shared.interface'
import { PageDto } from 'modules/common/common.dto'
import { UserService } from 'modules/user/user.service'

@Injectable()
export class SaleService {
  logger: Logger
  constructor(
    public readonly saleRepository: SaleRepository,
    public readonly saleRegistrationRepository: SaleRegistrationRepository,
    public readonly saleQueueRepository: SaleQueueRepository,
    public readonly soldTemplatesRepository: SoldTemplatesRepository,
    public readonly configService: ConfigService,
    public readonly adminService: AdminService,
    public readonly paymentService: PaymentService,
    public readonly userService: UserService,
    public readonly smartContractService: SmartContractService,
    public readonly owensMarketplaceService: OwensMarketplaceService,
    public readonly collectionsRepository: CollectionsRepository,
    public readonly ethereumSaleRepository: EthereumSaleRepository
  ) {
    this.logger = new Logger()
  }

  async addNewAdvancedSale(userId: string, advancedSaleDto: AdvancedSaleDto): Promise<any> {
    try {
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new BadRequestException('only admin can call')

      const collectionDetails = await getCollectionBy({ id: advancedSaleDto.collectionId, blockchain: advancedSaleDto.blockchain })
      if (!collectionDetails) throw new BadRequestException('invalid collection')

      let queueInitialized = false
      let queueConfigurationInitialized = false
      const templateDetails = await getSaleBy({ templateId: advancedSaleDto.templateId })

      if (advancedSaleDto.queueType == QueueTypeEnum.FCFS || advancedSaleDto.queueType == QueueTypeEnum.NoQueue) queueInitialized = true
      if (advancedSaleDto.queueType == QueueTypeEnum.NoQueue) queueConfigurationInitialized = true
      if (templateDetails) advancedSaleDto.unpackStartTime = templateDetails.unpackStartTime

      const paymentId = ''
      const result = await this.addNewSale(
        userId,
        paymentId,
        queueInitialized,
        queueConfigurationInitialized,
        collectionDetails,
        advancedSaleDto
      )
      return result
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async addSelfPortalBasicSale(
    userId: string,
    {
      collectionId,
      templateName,
      templateImage,
      templateDescription,
      maxSupply,
      saleStartTime,
      saleEndTime,
      limitPerUser,
      price,
      blockchain,
      amount,
      card,
      currency,
      description,
      saveCard,
    }: BasicSaleDto,
    operatorId: number
  ): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const collectionDetails = await getCollectionBy({ id: collectionId, addedBy: userId, txnStatus: true, operatorId, blockchain })
      if (!collectionDetails) throw new BadRequestException('Invalid collection')
      const paymentConfiguration = await getConfigurationBy({ operatorId, name: ConfigurationNameEnum.FEE_ACTIVATION })
      this.logger.log('self portal payment config', JSON.stringify(paymentConfiguration))
      const saleFeeConfig = await getConfigurationBy({ operatorId, name: ConfigurationNameEnum.SALE_FEE })
      let paymentDetails
      if (paymentConfiguration && paymentConfiguration.value && saleFeeConfig && saleFeeConfig.value > 0) {
        if (parseFloat(amount) != saleFeeConfig.value) throw new BadRequestException('Invalid sale fee')
        const paymentObj: PaymentDto = {
          amount,
          card,
          currency,
          description,
          saveCard,
        }
        paymentDetails = await this.paymentService.pay(paymentObj, user.id, PaymentForEnum.Sale)
        if (paymentDetails.status == PaymentStatusEnum.failed) throw new BadRequestException('Payment Failed')
      }
      const schema = 'packs'
      const data = {
        name: templateName,
        img: templateImage,
      }
      const templateId = await this.owensMarketplaceService.addNewTemplate(userId, {
        collectionId,
        schema,
        data,
        maxSupply,
      })
      this.logger.log('templateId', templateId)
      const queueInitialized = true
      const queueConfigurationInitialized = true
      const advancedSaleDto: AdvancedSaleDto = {
        collectionId,
        templateId,
        templateName,
        templateDescription,
        templateImage,
        schema,
        price,
        limitPerUser,
        maxIssue: maxSupply,
        isFreePack: price > 0 ? false : true,
        saleStartTime,
        saleEndTime,
        registrationStartTime: saleStartTime,
        registrationEndTime: saleEndTime,
        unpackStartTime: saleStartTime,
        isReRegistrationEnabled: false,
        queueInitializationTime: saleStartTime,
        assetCon: collectionDetails.assetCon,
        blockchain,
        queueType: QueueTypeEnum.NoQueue,
        operatorId,
        mintOnBuy: false,
        unpackRecipient: UnpackRecipientEnum.NotApplicable,
        chargeFee: parseFloat(this.configService.get('STRIPE_FEE')),
        isBlockchainBuyEnabled: false,
      }
      const result = await this.addNewSale(
        userId,
        paymentDetails && paymentDetails.id ? paymentDetails.id : '',
        queueInitialized,
        queueConfigurationInitialized,
        collectionDetails,
        advancedSaleDto
      )
      return result
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async addNewSale(
    userId: string,
    paymentId: string,
    queueInitialized: boolean,
    queueConfigurationInitialized: boolean,
    collectionDetails: CollectionsInterface,
    advancedSaleDto: AdvancedSaleDto
  ): Promise<any> {
    try {
      this.logger.debug('add new common sale')
      const saleId = await this.storeSaleDetails(userId, paymentId, queueInitialized, queueConfigurationInitialized, advancedSaleDto)
      this.logger.debug('db sale id', saleId)
      if (advancedSaleDto.blockchain == BlockchainEnum.Ethereum) {
        await this.addEthereumSale(saleId, advancedSaleDto.maxIssue, advancedSaleDto.assetCon, advancedSaleDto.mintOnBuy)
      } else if (advancedSaleDto.blockchain == BlockchainEnum.Wax) {
        await this.addWaxSale(saleId, advancedSaleDto, collectionDetails.collection)
      } else {
        await this.addBackendSale(saleId)
      }
      return { message: 'Sale configured successfully', saleId }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async storeSaleDetails(
    userId: string,
    paymentId: string,
    queueInitialized: boolean,
    queueConfigurationInitialized: boolean,
    {
      collectionId,
      templateId,
      templateName,
      templateDescription,
      templateImage,
      schema,
      price,
      limitPerUser,
      maxIssue,
      queueType,
      isFreePack,
      saleStartTime,
      saleEndTime,
      registrationStartTime,
      registrationEndTime,
      unpackStartTime,
      isReRegistrationEnabled,
      queueInitializationTime,
      assetCon,
      blockchain,
      operatorId,
      unpackRecipient,
      chargeFee,
      isBlockchainBuyEnabled,
    }: AdvancedSaleDto
  ): Promise<any> {
    try {
      this.logger.debug('storing to db')
      const sale: SaleInterface = {
        collectionId,
        templateId,
        templateName,
        templateDescription,
        templateImage,
        schema,
        price,
        limitPerUser,
        maxIssue,
        queueType,
        isFreePack,
        saleStartTime,
        saleEndTime,
        registrationStartTime,
        registrationEndTime,
        unpackStartTime,
        addedBy: userId,
        assetCon,
        queueInitialized,
        queueConfigurationInitialized,
        isReRegistrationEnabled,
        queueInitializationTime,
        blockchain,
        paymentId,
        operatorId,
        unpackRecipient,
        chargeFee,
        isBlockchainBuyEnabled,
      }
      const insertedData = await this.saleRepository.insert(sale)
      const saleId = insertedData.identifiers[0].id
      return saleId
    } catch (err) {
      this.logger.error('db errr', err)
      throw new BadRequestException(err.message)
    }
  }

  async addWaxSale(saleId: number, advancedSaleDto: AdvancedSaleDto, collection: string): Promise<any> {
    try {
      const saleConfiguration: SaleConfiguration = {
        sale_id: saleId.toString(),
        collection,
        schema: advancedSaleDto.schema,
        template_id: advancedSaleDto.templateId,
        price_cents: advancedSaleDto.price,
        limit_per_user: advancedSaleDto.limitPerUser,
        max_issue: advancedSaleDto.maxIssue,
        isqueueenabled: advancedSaleDto.queueType == QueueTypeEnum.FCFS || advancedSaleDto.queueType == QueueTypeEnum.Random ? true : false,
        isfreepack: advancedSaleDto.isFreePack,
        allow_directpay: advancedSaleDto.isBlockchainBuyEnabled,
        start_time: new Date(advancedSaleDto.saleStartTime).toISOString().slice(0, 19),
        end_time: new Date(advancedSaleDto.saleEndTime).toISOString().slice(0, 19),
      }
      this.logger.log('saleConfiguration-wax sale func', JSON.stringify(saleConfiguration))
      const smartContractResult = await this.smartContractService.registerNewSale(saleConfiguration)
      this.logger.log('add wax sale sc result', smartContractResult)
      await this.saleRepository.update(saleConfiguration.sale_id, smartContractResult)
      if (!smartContractResult.txnStatus) throw new BadRequestException(smartContractResult.txnMessage)
      return { message: 'Sale Registered successfully' }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async addEthereumSale(saleId: number, totalNFT: number, assetCon: string, mintOnBuy: boolean): Promise<any> {
    try {
      const [totalReservedNFTs] = await getTotalReservedNFTs(assetCon, saleId)
      if (!totalReservedNFTs) totalReservedNFTs.value = 0
      const ethereumSale: EthereumSaleInterface = {
        id: uuid(),
        saleId,
        assetCon,
        from: parseInt(totalReservedNFTs.value) + 1,
        to: parseInt(totalReservedNFTs.value) + totalNFT,
        mintOnBuy,
      }
      await this.ethereumSaleRepository.insert(ethereumSale)
      return { message: 'Sale Registered successfully', saleId }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async addBackendSale(saleId: string): Promise<any> {
    try {
      return await this.saleRepository.update(saleId, { txnStatus: true })
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async updateSale(
    userId: string,
    { saleId, templateName, templateDescription, templateImage, unpackStartTime, queueInitializationTime }: UpdateSaleDto
  ): Promise<any> {
    try {
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin can add new sale !!')

      const saleDetails = await getSaleBy({ id: saleId })
      if (!saleDetails) throw new BadRequestException('Invalid Sale id')
      const dataToUpdate: SaleUpdateInterface = {
        templateName,
        templateDescription,
        templateImage,
        unpackStartTime,
        queueInitializationTime,
      }
      await this.saleRepository.update(saleId, dataToUpdate)
      return { message: 'Sale updated successfully', saleId }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async updateSaleEndtime(userId: string, { saleId, saleEndTime }: SaleEndTimeDto): Promise<any> {
    try {
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin can add new sale !!')

      const saleDetails = await getSaleBy({ id: saleId })
      if (!saleDetails) throw new BadRequestException('Invalid Sale id')

      const dataToUpdate = {
        saleEndTime,
      }
      await this.saleRepository.update(saleId, dataToUpdate)

      const saleEndConfiguration: SaleEndConfiguration = {
        sale_id: saleId.toString(),
        end_time: new Date(saleEndTime).toISOString().slice(0, 19),
      }
      this.logger.log('saleEndConfiguration', JSON.stringify(saleEndConfiguration))
      const smartContractResult = await this.smartContractService.updateSaleEndTime(saleEndConfiguration)
      this.logger.log('smartContractResult', JSON.stringify(smartContractResult))
      await this.saleRepository.update(saleId, smartContractResult)
      if (!smartContractResult.txnStatus) throw new BadRequestException(smartContractResult.txnMessage)
      return { message: 'Sale Registered successfully', saleId }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async addQueueRelatedInfo(userId: string, { saleId, intervalSeconds, minRank, maxRank }: AddQueueDto): Promise<any> {
    try {
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin can add new sale !!')

      const saleDetails = await getSaleBy({ id: saleId })
      if (!saleDetails) throw new BadRequestException('Invalid sale id')
      if (saleDetails.queueType == QueueTypeEnum.NoQueue) throw new BadRequestException('No need to configure queue for this sale')
      if (saleDetails.queueConfigurationInitialized) throw new BadRequestException('All slots are already configured')
      await this.configureSalesQueue(userId, minRank, maxRank, intervalSeconds, saleId, saleDetails.saleStartTime, saleDetails.saleEndTime)
      return { message: 'Queue Added Successfully' }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  // async addQueueRelatedInfoByUser(userId: string, { saleId, intervalSeconds, allowedRanks }: AddSimilarQueueDto): Promise<any> {
  //   try {
  //     const saleDetails = await getSaleBy({ id: saleId })
  //     if (!saleDetails) throw new BadRequestException('Invalid sale id')
  //     if (saleDetails.addedBy != userId) throw new BadRequestException('Cant configure queue of Other users sale')
  //     if (saleDetails.queueType == QueueTypeEnum.NoQueue) throw new BadRequestException('No need to configure queue for this sale')
  //     if (saleDetails.queueConfigurationInitialized) throw new BadRequestException('All slots are already configured')

  //     let minRank = 1
  //     let maxRank = allowedRanks

  //     let queueConfigured = saleDetails.queueConfigurationInitialized

  //     while (queueConfigured) {
  //       queueConfigured = await this.configureSalesQueue(
  //         userId,
  //         minRank,
  //         maxRank,
  //         intervalSeconds,
  //         saleId,
  //         saleDetails.saleStartTime,
  //         saleDetails.saleEndTime
  //       )
  //       if (saleDetails.queueRankingType == QueueRankingTypeEnum.Scaterred) {
  //         minRank = maxRank
  //       }
  //       maxRank += allowedRanks
  //     }
  //     return { message: 'Queue Added Successfully' }
  //   } catch (err) {
  //     throw new BadRequestException(err.message)
  //   }
  // }

  async configureSalesQueue(
    userId: string,
    minRank: number,
    maxRank: number,
    intervalSeconds: number,
    saleId: number,
    saleStartTime: Date,
    saleEndTime: Date
  ): Promise<any> {
    try {
      if (minRank <= 0 || maxRank <= 0 || minRank >= maxRank) throw new BadRequestException('Invalid rank ranges')
      const lastSlot = await getSaleLastSlot(saleId)
      let slotStartTime
      this.logger.log('last slot', lastSlot)
      if (!lastSlot) {
        // if (minRank != 1) throw new BadRequestException('min rank must be 1 for first slot')
        slotStartTime = saleStartTime
      } else {
        // if (minRank != lastSlot.maxRank + 1) throw new BadRequestException('min rank must be 1 greater than max ranking of last slot')
        slotStartTime = lastSlot.slotEndTime
      }
      let slotEndTime = new Date(new Date(slotStartTime).getTime() + intervalSeconds * 1000)
      if (slotEndTime > saleEndTime) {
        slotEndTime = saleEndTime
      }
      if (slotEndTime.toString() == saleEndTime.toString()) {
        await this.saleRepository.update(saleId, { queueConfigurationInitialized: true })
      }
      const id = uuid()
      const saleQueue: SaleQueueInterface = {
        id,
        saleId,
        intervalSeconds,
        slotStartTime,
        slotEndTime,
        minRank,
        maxRank,
        addedBy: userId,
      }
      await this.saleQueueRepository.insert(saleQueue)
      const saleQueueConfiguration: SaleQueueConfiguration = {
        sale_id: saleId,
        interval_seconds: intervalSeconds,
        user_start: minRank,
        user_end: maxRank,
      }
      this.logger.log('sale queue sc config', JSON.stringify(saleQueueConfiguration))
      const smartContractResult = await this.smartContractService.configureSaleQueue(saleQueueConfiguration)
      this.logger.log('add queue wax result', JSON.stringify(smartContractResult))
      await this.saleQueueRepository.update(id, smartContractResult)
      if (!smartContractResult.txnStatus) throw new BadRequestException(smartContractResult.txnMessage)
      return slotEndTime == saleEndTime
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async changeSaleStatus(userId: string, saleId: number): Promise<any> {
    try {
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin can change sale status !!')

      const saleDetail = await getSaleBy({ id: saleId })
      if (!saleDetail) throw new BadRequestException('Invalid sale id')
      await this.saleRepository.update(saleId, { isEnabled: !saleDetail.isEnabled })
      return { message: 'Sale status updated successfully' }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async changeSaleFeatureStatus(userId: string, saleId: number): Promise<any> {
    try {
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin can change sale status !!')

      const saleDetail = await getSaleBy({ id: saleId })
      if (!saleDetail) throw new BadRequestException('Invalid sale id')
      await this.saleRepository.update(saleId, { isFeatured: !saleDetail.isFeatured })
      return { message: 'Sale status updated successfully' }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async changeMintOnBuy(userId: string, saleId: number): Promise<any> {
    try {
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin can change sale status !!')

      const ethereumSpecificDetails = await getEthereumSaleBy({ saleId })
      if (!ethereumSpecificDetails) throw new BadRequestException('Invalid sale id')
      await this.ethereumSaleRepository.update(ethereumSpecificDetails.id, { mintOnBuy: !ethereumSpecificDetails.mintOnBuy })
      return { message: 'Sale updated successfully' }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getUserRank(userId: string, saleId: number): Promise<any> {
    try {
      const saleDetails = await getSaleBy({ id: saleId })
      if (!saleDetails) throw new BadRequestException('Invalid Sale Id')
      if (saleDetails.queueType == QueueTypeEnum.NoQueue) throw new BadRequestException('No queue for this sale')
      if (!saleDetails.queueInitialized) {
        if (saleDetails.queueInitializationTime < new Date()) {
          await this.initializeQueue(saleId)
        } else {
          throw new BadRequestException('Queue not initialized yet')
        }
      }
      const registrationDetails = await getSaleRegistrationBy({ saleId, userId })
      if (!registrationDetails) throw new BadRequestException('User is not registered for this sale')
      const userSlots = await getSlotForRankDetails(registrationDetails.rank, saleId)
      return {
        rank: registrationDetails.rank,
        slots: userSlots,
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getQueue(saleId: number): Promise<any> {
    try {
      const saleDetails = await getSaleBy({ id: saleId })
      if (!saleDetails) throw new BadRequestException('Invalid Sale Id')
      if (saleDetails.queueType == QueueTypeEnum.NoQueue) throw new BadRequestException('No queue for this sale!!')
      if (!saleDetails.queueInitialized) {
        if (saleDetails.queueInitializationTime < new Date()) {
          await this.initializeQueue(saleId)
        } else {
          throw new BadRequestException('Queue not initialized yet')
        }
      }
      return await getAllRegisteredUsers(saleId)
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async registerForSale(userId: string, saleId: number): Promise<any> {
    try {
      const saleDetails = await getSaleBy({ id: saleId })
      if (!saleDetails) throw new BadRequestException('Invalid Sale Id')
      if (!saleDetails.queueConfigurationInitialized) throw new BadRequestException('Cant register untill queue is configured!!')
      if (saleDetails.queueType == QueueTypeEnum.NoQueue) throw new BadRequestException('Registration not required!!')
      if (saleDetails.registrationStartTime >= new Date()) throw new BadRequestException('Registration not started yet!!')
      if (!saleDetails.queueInitialized && saleDetails.queueInitializationTime < new Date()) {
        await this.initializeQueue(saleId)
      }

      const registrationDetails = await getSaleRegistrationBy({ saleId, userId })
      if (registrationDetails) {
        if (saleDetails.isReRegistrationEnabled) {
          await this.saleRegistrationRepository.delete(registrationDetails.id)
        } else {
          throw new BadRequestException('Already registered')
        }
      }

      let rank = 0
      if (saleDetails.queueType == QueueTypeEnum.FCFS || saleDetails.queueInitialized) {
        rank = await getNextRank(saleId)
      }
      const id = uuid()
      const user = await getUserBy({ id: userId })
      const SaleRegistration: SaleRegistrationInterface = {
        id,
        userId,
        saleId,
        username: user.username,
        rank,
      }
      await this.saleRegistrationRepository.insert(SaleRegistration)
      return { message: 'Succesfully Registered' }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async buyTemplateUser(userId: string, buyTemplateDto: BuyTemplateDto): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      await this.userService.registerOnAppBackend(user.email)
      const paymentExempted = false
      await this.buyTemplate(paymentExempted, buyTemplateDto, user.username)
      return { message: 'Succesfully bought' }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async buyTemplateAdmin(userId: string, buyTemplateDto: BuyTemplateDto, username: string): Promise<any> {
    try {
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin can add new sale !!')
      const paymentExempted = true
      await this.buyTemplate(paymentExempted, buyTemplateDto, username)
      return { message: 'Succesfully bought' }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async buyTemplate(
    paymentExempted: boolean,
    { saleId, templateId, amount, card, currency, description, saveCard }: BuyTemplateDto,
    username: string
  ): Promise<any> {
    let errorObj: any = {}
    let stripePaymentId = ''
    let saleDetails
    let paymentDetails
    let user
    try {
      this.logger.log('buy username', username)
      user = await getUserBy({ username })
      this.logger.log('buy user details', JSON.stringify(user))
      saleDetails = await getSaleBy({ id: saleId, templateId })
      const ethereumSpecificDetails = await getEthereumSaleBy({ saleId })

      if (!saleDetails) throw new BadRequestException('Invalid sale id')
      if (saleDetails.saleStartTime > new Date()) throw new BadRequestException('Sale not started yet')
      if (saleDetails.saleEndTime < new Date()) throw new BadRequestException('Sale ends')
      if (!saleDetails.queueConfigurationInitialized) throw new BadRequestException('Sale queue is not configured')

      const maxUnitAllowed = parseInt(this.configService.get('MAX_BUY_IN_ONE_GO'))
      const totalUnits = saleDetails.isFreePack ? 1 : Math.floor(parseFloat(amount) / saleDetails.price)

      if (saleDetails.blockchain == BlockchainEnum.Ethereum && ethereumSpecificDetails.mintOnBuy && totalUnits > 1)
        throw new BadRequestException('For this sale you can buy max one pack')
      if (!totalUnits) throw new BadRequestException('Entered amount is less than the price of 1 unit')
      if (totalUnits > maxUnitAllowed) throw new BadRequestException(`Only ${maxUnitAllowed} units are allowed at a time`)

      const alreadyBoughtUnitsByUser = await totalUnitsBoughtByUser(saleId, user.id)
      const alreadyBoughtUnits = await this.getTotalUnitsBought(saleId, saleDetails.blockchain)

      if (parseInt(alreadyBoughtUnitsByUser) + totalUnits > saleDetails.limitPerUser)
        throw new BadRequestException('Max allowed units exceed for you')
      if (parseInt(alreadyBoughtUnits) + totalUnits > saleDetails.maxIssue) throw new BadRequestException('Max allowed units exceed')

      let userRank = 0

      if (saleDetails.queueType != QueueTypeEnum.NoQueue) {
        if (!saleDetails.queueInitialized) await this.initializeQueue(saleId)

        const userRegistrationDetails = await getSaleRegistrationBy({ saleId, userId: user.id })
        const saleSlot = await getCurrentSlot(saleId)
        this.logger.log('Current slot', JSON.stringify(saleSlot))
        this.logger.log('user Registration', JSON.stringify(userRegistrationDetails))
        if (!userRegistrationDetails) throw new BadRequestException('Register first')
        if (userRegistrationDetails.rank < saleSlot.minRank || userRegistrationDetails.rank > saleSlot.maxRank)
          throw new BadRequestException('You dont belong to current slot')

        userRank = userRegistrationDetails.rank
      }

      errorObj = {
        amount: amount,
        saleId: saleId,
        email: user.email,
        username: user.username,
        errorType: '',
        error: '',
        message: '',
      }

      if (!saleDetails.isFreePack && !paymentExempted) {
        const paymentObj: PaymentDto = {
          amount,
          card,
          currency,
          description,
          saveCard,
        }
        this.logger.log('payment object', JSON.stringify(paymentObj))
        // paymentDetails = await this.paymentService.pay(paymentObj, user.id, PaymentForEnum.Bid)
        console.log('saleDetails', saleDetails)
        paymentDetails = await this.paymentService.holdPay(paymentObj, user.id, PaymentForEnum.Bid, parseFloat(saleDetails.chargeFee))
        stripePaymentId = paymentDetails.finalPayment.id
        this.logger.log(`PaymentD: ${JSON.stringify(paymentDetails)}`)
        if (paymentDetails.status == PaymentStatusEnum.failed) {
          errorObj.errorType = ErrorTypeEnum.PaymentFailure
          errorObj.error = paymentDetails
          errorObj.message = 'Payment Failed'

          throw new BadRequestException('Payment Failed')
        }
      }
      const soldTemplateId = uuid()
      const soldTemplate: SoldTemplateInterface = {
        id: soldTemplateId,
        templateId,
        saleId,
        userId: user.id,
        units: totalUnits,
        amount: parseFloat(amount),
        currency,
        paymentId: paymentDetails && paymentDetails.id ? paymentDetails.id : '',
      }
      await this.soldTemplatesRepository.insert(soldTemplate)
      if (saleDetails.blockchain == BlockchainEnum.Wax) {
        const buyTemplate: BuyTemplateConfiguration = {
          user_id: userRank,
          sale_id: saleId,
          subsale_template: templateId,
          payment_cents: parseFloat(amount),
          user_vname: user.username,
        }
        await this.waxSaleBuy(soldTemplateId, buyTemplate)
      } else if (saleDetails.blockchain == BlockchainEnum.Ethereum) {
        await this.ethereumSaleBuy(user.id, saleDetails.assetCon, totalUnits, soldTemplateId, saleId)
      }
      if (!saleDetails.isFreePack && !paymentExempted)
        await this.paymentService.captureHoldpayment(paymentDetails, user.customerId, saveCard)
      // if (!saveCard) await this.paymentService.deleteCard(user.customerId, paymentDetails.finalPayment.payment_method)
      return { message: 'Succesfully bought' }
    } catch (err) {
      this.logger.log('error', JSON.stringify(err))
      if (Object.keys(errorObj).length > 0) {
        if (errorObj.errorType == '') errorObj.errorType = ErrorTypeEnum.BlockchainFailuee
        if (errorObj.message == '') errorObj.message = err.message
        if (errorObj.error != undefined && errorObj.error != '') {
          errorObj.error = JSON.stringify(errorObj.error)
        }
        await sendMessageToTelegram(TelegramErrorTypeEnum.Buy, errorObj)
      }
      if (!saleDetails.isFreePack && !paymentExempted && stripePaymentId)
        await this.paymentService.cancelHoldPayment(paymentDetails, user.id, saveCard)
      throw new BadRequestException(err.message)
    }
  }

  async waxSaleBuy(soldTemplateId: string, buyTemplate: BuyTemplateConfiguration): Promise<any> {
    const smartContractResult = await this.smartContractService.buyTemplate(buyTemplate)
    this.logger.log('wax sale buy smart contract result', JSON.stringify(smartContractResult))
    await this.soldTemplatesRepository.update(soldTemplateId, smartContractResult)
    if (!smartContractResult.txnStatus) throw new BadRequestException(smartContractResult.txnMessage)
    return { message: 'Succesfully bought' }
  }

  async ethereumSaleBuy(userId: string, assetCon: string, units: number, soldTemplateId: string, saleId: number): Promise<any> {
    const ethereumSpecificDetails = await getEthereumSaleBy({ saleId })
    await this.soldTemplatesRepository.update(soldTemplateId, { txnStatus: true })
    const nftStrartFrom = ethereumSpecificDetails.from
    const totalUnitsBoughtBeforeUser = (await totalUnitsBought(saleId)) - units
    for (let index = 0; index < units; index++) {
      const assetId = nftStrartFrom + totalUnitsBoughtBeforeUser + index
      if (ethereumSpecificDetails.mintOnBuy) {
        this.logger.log('going to mint')
        const smartContractResult = await this.smartContractService.mintEthereumAsset(assetCon, assetId)
        await this.soldTemplatesRepository.update(soldTemplateId, smartContractResult)
        if (!smartContractResult.txnStatus) throw new BadRequestException(smartContractResult.txnMessage)
      }
      this.logger.log('next assetid', assetId.toString())
      const isNFTMinted = await this.smartContractService.checkEthereumAsset(assetCon, assetId)
      if (isNFTMinted) {
        this.logger.log('going to deposit')
        await this.owensMarketplaceService.depositAsset(userId, {
          assetCon,
          assetId,
          blockchain: BlockchainEnum.Ethereum,
          txnId: '',
          userAddress: '',
        })
      } else {
        this.logger.log('going to pending')
        await this.owensMarketplaceService.addPendingAsset(assetId, saleId, userId)
      }
    }
    return { message: 'Succesfully bought' }
  }

  async registeredUsers(saleId: number): Promise<any> {
    try {
      const saleDetails = await getSaleBy({ id: saleId })
      if (!saleDetails) throw new BadRequestException('Invalid Sale Id')
      return await getAllRegistrations(saleId)
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getQueueConfigurations(saleId: number): Promise<any> {
    try {
      const queueConfigurations = await getSaleQueuesBy({ saleId })
      if (!queueConfigurations) throw new BadRequestException('No Queue found')
      return queueConfigurations
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async initializeQueue(saleId: number): Promise<any> {
    try {
      const sale = await getSaleBy({ id: saleId })
      if (!sale) return { message: 'Invalid sale id' }
      if (sale.queueInitialized) return { message: 'Already initialized' }

      let registrations = await getAllRegistrations(saleId)
      if (!registrations.length) return { message: 'No registration found' }
      registrations = await this.randomizeArray(registrations)
      await updateSaleQueue(saleId, registrations)
      await this.saleRepository.update(saleId, { queueInitialized: true })
      return { message: 'Queue Initialized' }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async randomizeArray(dataArray: any[]): Promise<any> {
    try {
      const randomizedArray = []
      while (dataArray.length != 0) {
        const randomIndex = Math.floor(Math.random() * dataArray.length)
        randomizedArray.push(dataArray[randomIndex])
        dataArray.splice(randomIndex, 1)
      }
      let rank = 1
      for (const row of randomizedArray) {
        row.rank = rank
        ++rank
      }
      return randomizedArray
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getListByCollection(userId: string, collection: string, operatorId: number): Promise<any> {
    try {
      const list = await saleListByCollection(userId, collection, operatorId)
      for (const sale of list) {
        const soldItemsCount = await this.getTotalUnitsBought(sale.id, sale.blockchain)
        sale.unitsSold = soldItemsCount
      }
      return list
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getList(userId: string, operatorId: number): Promise<any> {
    try {
      const list = await saleList(userId, operatorId)
      return list
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getListPublic(operatorId: number): Promise<any> {
    try {
      const operatorExist = await getOperatorBy({ id: operatorId })
      if (!operatorExist) throw new BadRequestException('Invalid operator')
      const list = await saleListPublic(operatorId)
      return list
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getListByCollectionPublic(collection: string, operatorId: number): Promise<any> {
    try {
      const operatorExist = await getOperatorBy({ id: operatorId })
      if (!operatorExist) throw new BadRequestException('Invalid operator')
      const list = await saleListByCollectionPublic(collection, operatorId)
      return list
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getSaleAllPaymentsList(userId: string, saleId: number): Promise<any> {
    try {
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin can add new sale !!')

      const list = await salesAllPayment(saleId)
      return list
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async adminRefundFailedSale(userId: string, { paymentId }: PaymentRefundDto) {
    try {
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      this.logger.log('paymentId', JSON.stringify(paymentId))
      const result = await getPaymentBy({ id: paymentId })
      this.logger.log('result', JSON.stringify(result))

      if (result.stripePaymentDescription != undefined) {
        if (result.isRefunded) {
          throw new BadRequestException('Payment already refunded')
        }

        await this.paymentService.refundUserSalePayment(paymentId, userId)
        return { message: 'User refunded successfully' }
      } else {
        throw new BadRequestException('Payment not found')
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async fetchRefundList(userId: string, saleId: number) {
    try {
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')

      const refundlist = await fetchRefundListAdmin(saleId)
      return refundlist
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getTotalUnitsBought(saleId: number, blockchain: BlockchainEnum) {
    this.logger.log('saleId: ', saleId.toString())
    this.logger.log('blockchain: ', blockchain.toString())
    if (blockchain == BlockchainEnum.Wax) {
      return await this.smartContractService.getMintCount(saleId)
    }
    return await totalUnitsBought(saleId)
  }
  async getSoldTemplatesList(userId: string, { saleId, startDatetime, endDatetime, page, limit }: SoldTemplateFilterDto) {
    try {
      const skip = page * limit - limit
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      let filter = await filterSalePayment(saleId, startDatetime, endDatetime, skip, limit)
      const totalSale = await soldTemplateTotalAmountAndCount(saleId, startDatetime, endDatetime)
      // totalSale = totalSale[0] ? parseInt(totalSale[0].sum) / 100 : 0
      filter = await this.owensMarketplaceService.formatPaymentsData(filter)
      return { filteredData: filter, totalSale: totalSale.totalAmounts ? totalSale.totalAmounts : 0, count: totalSale.totalCount }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getPaymentDetailsList(userId: string, { page, limit }: PageDto) {
    try {
      const skip = page * limit - limit
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      // const paymentDetails = await getPayments()
      let paymentDetails = await allSalePayment(skip, limit)
      const soldTemplatesTotal = await soldTemplatesTotalAmountAndCount()
      // sumofTotalAllSale = sumofTotalAllSale[0] ? parseInt(sumofTotalAllSale[0].sum) / 100 : 0
      const saleIds = await saleIdList()
      paymentDetails = await this.owensMarketplaceService.formatPaymentsData(paymentDetails)
      return {
        paymentDetails: paymentDetails,
        saleList: saleIds,
        totalSale: soldTemplatesTotal.totalAmounts ? soldTemplatesTotal.totalAmounts : 0,
        count: soldTemplatesTotal.totalCount,
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }
}
