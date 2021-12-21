import { BlockchainEnum } from 'modules/owens-marketplace/owens-marketplace.interface'

export interface SaleInterface {
  collectionId: string
  templateId: number
  templateName: string
  templateDescription: string
  templateImage: string
  schema: string
  price: number
  limitPerUser: number
  maxIssue: number
  queueType: QueueTypeEnum
  queueInitialized: boolean
  isFreePack: boolean
  saleStartTime: Date
  saleEndTime: Date
  registrationStartTime: Date
  registrationEndTime: Date
  unpackStartTime: Date
  addedBy: string
  assetCon: string
  isReRegistrationEnabled: boolean
  txnStatus?: boolean
  txnMessage?: string
  txnId?: string
  queueConfigurationInitialized?: boolean
  isFeatured?: boolean
  isEnabled?: boolean
  showCollectionName?: boolean
  queueInitializationTime: Date
  blockchain: BlockchainEnum
  paymentId?: string
  operatorId: number
  unpackRecipient?: UnpackRecipientEnum
  chargeFee?: number
  isBlockchainBuyEnabled: boolean
}

export interface EthereumSaleInterface {
  id: string
  saleId: number
  assetCon: string
  mintOnBuy: boolean
  from: number
  to: number
}

export interface SaleUpdateInterface {
  templateName: string
  templateDescription: string
  templateImage: string
  unpackStartTime: Date
  queueInitializationTime: Date
}

export interface SaleRegistrationInterface {
  id: string
  saleId: number
  userId: string
  username: string
  rank: number
}

export interface SaleConfiguration {
  sale_id: string
  collection: string
  schema: string
  template_id: number
  price_cents: number
  limit_per_user: number
  max_issue: number
  isqueueenabled: boolean
  isfreepack: boolean
  allow_directpay: boolean
  start_time: string
  end_time: string
}

export interface SaleEndConfiguration {
  sale_id: string
  end_time: string
}

export interface SaleQueueInterface {
  id: string
  saleId: number
  intervalSeconds: number
  minRank: number
  maxRank: number
  addedBy: string
  slotStartTime: Date
  slotEndTime: Date
  txnStatus?: boolean
  txnMessage?: string
  txnId?: string
}

export interface SaleQueueConfiguration {
  sale_id: number
  interval_seconds: number
  user_start: number
  user_end: number
}

export interface SoldTemplateInterface {
  id: string
  templateId: number
  saleId: number
  userId: string
  units: number
  amount: number
  currency: string
  txnStatus?: boolean
  txnMessage?: string
  txnId?: string
  paymentId?: string
}

export enum QueueTypeEnum {
  FCFS = 1,
  Random = 2,
  NoQueue = 3,
}

export enum UnpackRecipientEnum {
  UnboxOwens = 'unbox.owens',
  MintOwens = 'mint.owens',
  NotApplicable = 'notApplicable',
}

export interface BuyTemplateConfiguration {
  user_id: number
  sale_id: number
  subsale_template: number
  payment_cents: number
  user_vname: string
}

export enum ErrorTypeEnum {
  PaymentFailure = 'Payment failure',
  BlockchainFailuee = 'Blockchain failure',
}
