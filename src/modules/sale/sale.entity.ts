import { CreatedModified } from '../../helpers'
import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm'
import {
  EthereumSaleInterface,
  QueueTypeEnum,
  SaleInterface,
  SaleQueueInterface,
  SaleRegistrationInterface,
  SoldTemplateInterface,
  UnpackRecipientEnum,
} from './sale.interface'
import { BlockchainEnum } from '../owens-marketplace/owens-marketplace.interface'

@Entity()
export class Sales extends CreatedModified implements SaleInterface {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: true })
  collectionId: string

  @Column({ nullable: true })
  templateId: number

  @Column({ nullable: true })
  templateName: string

  @Column({ nullable: true })
  templateDescription: string

  @Column({ nullable: true })
  templateImage: string

  @Column({ nullable: true })
  schema: string

  @Column({ nullable: true })
  price: number

  @Column({ nullable: true })
  limitPerUser: number

  @Column({ nullable: true })
  maxIssue: number

  @Column({ nullable: true })
  queueType: QueueTypeEnum

  @Column({ default: false })
  queueInitialized: boolean

  @Column({ default: false })
  isFreePack: boolean

  @Column({ nullable: true })
  saleStartTime: Date

  @Column({ nullable: true })
  saleEndTime: Date

  @Column({ nullable: true })
  registrationStartTime: Date

  @Column({ nullable: true })
  registrationEndTime: Date

  @Column({ nullable: true })
  unpackStartTime: Date

  @Column({ nullable: true })
  addedBy: string

  @Column({ nullable: true })
  assetCon: string

  @Column({ default: false })
  txnStatus: boolean

  @Column({ nullable: true })
  txnMessage: string

  @Column({ nullable: true })
  txnId: string

  @Column({ default: false })
  queueConfigurationInitialized: boolean

  @Column({ default: true })
  isFeatured: boolean

  @Column({ default: true })
  isReRegistrationEnabled: boolean

  @Column({ default: true })
  isEnabled: boolean

  @Column({ default: true })
  showCollectionName: boolean

  @Column({ nullable: true })
  queueInitializationTime: Date

  @Column({ default: null })
  blockchain: BlockchainEnum

  @Column({ nullable: true })
  paymentId: string

  @Column({ default: 1 })
  operatorId: number

  @Column({ default: null })
  unpackRecipient: UnpackRecipientEnum

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 3.5 })
  chargeFee: number

  @Column({ default: false })
  isBlockchainBuyEnabled: boolean
}

@Entity()
export class EthereumSales extends CreatedModified implements EthereumSaleInterface {
  @PrimaryColumn()
  id: string

  @Column({ nullable: true })
  saleId: number

  @Column({ nullable: true })
  assetCon: string

  @Column({ default: false })
  mintOnBuy: boolean

  @Column()
  from: number

  @Column()
  to: number
}

@Entity()
export class SaleQueue extends CreatedModified implements SaleQueueInterface {
  @PrimaryColumn()
  id: string

  @Column()
  saleId: number

  @Column()
  intervalSeconds: number

  @Column({ nullable: true })
  minRank: number

  @Column({ nullable: true })
  maxRank: number

  @Column()
  addedBy: string

  @Column({ nullable: true })
  slotStartTime: Date

  @Column({ nullable: true })
  slotEndTime: Date

  @Column({ default: false })
  txnStatus: boolean

  @Column({ nullable: true })
  txnMessage: string

  @Column({ nullable: true })
  txnId: string
}

@Entity()
export class SaleRegistration extends CreatedModified implements SaleRegistrationInterface {
  @PrimaryColumn()
  id: string

  @Column({ nullable: true })
  saleId: number

  @Column()
  userId: string

  @Column()
  username: string

  @Column()
  rank: number
}

@Entity()
export class SoldTemplates extends CreatedModified implements SoldTemplateInterface {
  @PrimaryColumn()
  id: string

  @Column({ nullable: true })
  templateId: number

  @Column()
  saleId: number

  @Column()
  userId: string

  @Column()
  units: number

  @Column()
  amount: number

  @Column()
  currency: string

  @Column({ default: false })
  txnStatus: boolean

  @Column({ nullable: true })
  txnMessage: string

  @Column({ nullable: true })
  txnId: string

  @Column({ nullable: true })
  paymentId: string
}
