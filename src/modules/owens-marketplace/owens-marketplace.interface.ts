export interface ListCardInterface {
  vaccount: string
  assetId: number
  assetCon: string
  price?: string
}

export interface OfferInterface extends ListCardInterface {
  listBy: string
}

export interface AcceptOfferInterface extends OfferInterface {
  offeredBy: string
}

export interface WithdrawCardInterface {
  assets: any[]
  userAddress: string
  memo?: string
  blockchain: BlockchainEnum
}

export interface GameSendCardInterface {
  vaccount: string
  // assetIds: number[]
  assets: any
  matchId: number
  matchContract: string
}

export interface GameRemoveCardInterface {
  vaccount: string
  assetIds: number[]
  matchContract: string
}

export interface GameRemoveCardFantasy4Interface {
  vaccount: string
  teamIds: number[]
  matchId: number
}

export class FilterInterface {
  assetId: number
  schemeName: string
  price: string
  name: string
  collectionName: string
  filterData: string
  mint: string
  page: number
  limit: number
  blockchain: number
  sortBy: string
  templateIds: string
}

export class OwenTokensInterface {
  id: string
  userId: string
  amount: number
  paymentId: string
}

export class TranferredAssetsInterface {
  id: string
  assetId: string
  userId: string
  recipient: string
  transferType: TransferTypeEnum
  status: boolean
  assetCon: string
  blockchain: BlockchainEnum
  comment?: string
}

export class TransferCardInterface {
  assets: any[]
  toEmail: string
}

export enum TransferTypeEnum {
  Withdraw = 1,
  Gift = 2,
  Unpack = 3,
  GameSendCard = 4,
  GameRemoveCard = 5,
  Deposit = 6,
}

export class EnableTemplateConfiguration {
  pack_template: number
}

export interface CollectionsInterface {
  id: string
  collection: string
  collectionImage: string
  collectionName: string
  collectionCoverImage?: string
  collectionDescription?: string
  addedBy: string
  txnStatus?: boolean
  txnMessage?: string
  txnId?: string
  isFeatured?: boolean
  assetCon?: string
  paymentId?: string
  operatorId?: number
  addedByRole: AddedByRoleEnum
  blockchain: BlockchainEnum
  isHighlight: boolean
  rank?: number
}

export interface NewCollectionConfiguration {
  author: string
  collection_name: string
  allow_notify: boolean
  authorized_accounts: string[]
  market_fee: number
  notify_accounts: string[]
  data: any[]
}

export interface NewSchemaConfiguration {
  authorized_creator: string
  collection_name: string
  schema_name: string
  schema_format: any[]
}

export interface AddedSchemasInterface {
  id: string
  collectionId: string
  schema: string
  schemaFormat: string
  addedBy: string
  txnStatus?: boolean
  txnMessage?: string
  txnId?: string
}

export interface AddedTemplatesInterface {
  id: string
  collectionId: string
  schema: string
  maxSupply: number
  addedBy: string
  templateData: string
  txnStatus?: boolean
  txnMessage?: string
  txnId?: string
}

export interface NewTemplateConfiguration {
  authorized_creator: string
  collection_name: string
  schema_name: string
  transferable: boolean
  burnable: boolean
  max_supply: number
  immutable_data: any[]
}

export enum BlockchainEnum {
  Wax = 1,
  Ethereum = 2,
}

export enum AddedByRoleEnum {
  User = 1,
  Admin = 2,
}

export class DepositInterface {
  vaccount: string
  contract: string
  assetId: number
  blockchain: BlockchainEnum
  userAddress: string
}

export interface PendingAssetsInterface {
  id: string
  saleId: number
  assetId: number
  userId: string
}

export interface AssetsHighlightsInterface {
  id: string
  assetId: string
  userId: string
  assetCon: string
  blockchain: number
  isHighlight: boolean
  operatorId: number
  rank?: number
}
