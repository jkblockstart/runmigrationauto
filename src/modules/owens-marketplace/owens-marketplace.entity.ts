import { CreatedModified } from '../../helpers'
import { Entity, Column, PrimaryColumn } from 'typeorm'
import {
  AddedByRoleEnum,
  AddedSchemasInterface,
  AddedTemplatesInterface,
  AssetsHighlightsInterface,
  BlockchainEnum,
  CollectionsInterface,
  OwenTokensInterface,
  PendingAssetsInterface,
  TranferredAssetsInterface,
  TransferTypeEnum,
} from './owens-marketplace.interface'
import { Matches } from 'class-validator'

@Entity()
export class OwenTokens extends CreatedModified implements OwenTokensInterface {
  @PrimaryColumn()
  id: string

  @Column()
  userId: string

  @Column()
  amount: number

  @Column({ nullable: true })
  paymentId: string
}

//TODO: have to fix asset id string issue for this entity
@Entity()
export class TransferredAssets extends CreatedModified implements TranferredAssetsInterface {
  @PrimaryColumn()
  id: string

  @Column()
  assetId: string

  @Column()
  userId: string

  @Column()
  recipient: string

  @Column({ nullable: true })
  transferType: TransferTypeEnum

  @Column({ default: false })
  status: boolean

  @Column({ nullable: true })
  assetCon: string

  @Column({ nullable: true })
  blockchain: BlockchainEnum

  @Column({ nullable: true })
  comment: string
}

@Entity()
export class Collections extends CreatedModified implements CollectionsInterface {
  @PrimaryColumn()
  id: string

  @Column()
  collection: string

  @Column()
  collectionName: string

  @Column()
  collectionImage: string

  @Column({ nullable: true })
  collectionCoverImage: string

  @Column({ nullable: true })
  collectionDescription: string

  @Column({ default: false })
  isFeatured: boolean

  @Column({ default: false })
  txnStatus: boolean

  @Column({ nullable: true })
  txnMessage: string

  @Column({ nullable: true })
  txnId: string

  @Column()
  addedBy: string

  @Column({ nullable: true })
  assetCon: string

  @Column({ nullable: true })
  paymentId: string

  @Column({ default: 1 })
  operatorId: number

  @Column({ default: 2 })
  addedByRole: AddedByRoleEnum

  @Column({ default: 1 })
  blockchain: BlockchainEnum

  @Column({ default: false })
  isHighlight: boolean

  @Column({ default: 1 })
  rank: number
}

@Entity()
export class AddedSchemas extends CreatedModified implements AddedSchemasInterface {
  @PrimaryColumn()
  id: string

  @Column({ nullable: true })
  collectionId: string

  @Column({ nullable: true })
  @Matches('(^[a-z1-5.]{1,11}[a-z1-5]$)|(^[a-z1-5.]{12}[a-j1-5]$)')
  schema: string

  @Column()
  addedBy: string

  @Column({})
  schemaFormat: string

  @Column({ default: false })
  txnStatus: boolean

  @Column({ nullable: true })
  txnMessage: string

  @Column({ nullable: true })
  txnId: string
}

@Entity()
export class AddedTemplates extends CreatedModified implements AddedTemplatesInterface {
  @PrimaryColumn()
  id: string

  @Column({ nullable: true })
  collectionId: string

  @Column({ nullable: true })
  @Matches('(^[a-z1-5.]{1,11}[a-z1-5]$)|(^[a-z1-5.]{12}[a-j1-5]$)')
  schema: string

  @Column()
  addedBy: string

  @Column({})
  templateData: string

  @Column({})
  maxSupply: number

  @Column({ default: false })
  txnStatus: boolean

  @Column({ nullable: true })
  txnMessage: string

  @Column({ nullable: true })
  txnId: string

  @Column({ nullable: true })
  templateId: number
}

@Entity()
export class PendingAssets extends CreatedModified implements PendingAssetsInterface {
  @PrimaryColumn()
  id: string

  @Column()
  saleId: number

  @Column()
  assetId: number

  @Column()
  userId: string
}

@Entity()
export class AssetsHighlights extends CreatedModified implements AssetsHighlightsInterface {
  @PrimaryColumn()
  id: string

  @Column()
  assetId: string

  @Column()
  userId: string

  @Column()
  assetCon: string

  @Column()
  blockchain: BlockchainEnum

  @Column()
  isHighlight: boolean

  @Column({ default: 1 })
  operatorId: number

  @Column({ default: 1 })
  rank: number
}
