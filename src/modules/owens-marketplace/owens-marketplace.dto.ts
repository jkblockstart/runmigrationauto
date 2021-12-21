import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { BlockchainEnum } from './owens-marketplace.interface'
import { Type } from 'class-transformer'

export class ListCardDto {
  @ApiProperty()
  @IsNumber()
  assetId: number

  @ApiProperty()
  @IsString()
  assetCon: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  price: string
}

export class OfferDto extends ListCardDto {
  @ApiProperty()
  @IsString()
  listBy: string
}

export class AcceptOfferDto extends OfferDto {
  @ApiProperty()
  @IsString()
  offeredBy: string
}

export class WithdrawCardDto {
  @ApiProperty()
  @IsArray()
  assetIds: number[]

  @ApiProperty()
  @IsString()
  userAccount: string

  @ApiProperty()
  @IsArray()
  assetCons: string[]

  @ApiProperty()
  @IsNumber()
  blockchain: BlockchainEnum
}

export class Asset {
  @IsNotEmpty()
  @ApiProperty()
  assetId: number

  @IsNotEmpty()
  @ApiProperty()
  assetCon: string
}

export class GameSendCardDto {
  @ApiProperty()
  @IsArray()
  assetIds: number[]
  // assets: Asset[]

  @ApiProperty()
  @IsString()
  contract: string

  @ApiProperty()
  @IsNumber()
  matchId: number
}

export class GameRemoveCardDto {
  @ApiProperty()
  @IsArray()
  assetIds: number[]

  @ApiProperty()
  @IsString()
  contract: string
}

export class GameRemoveCardFantasy4Dto {
  @ApiProperty()
  @IsArray()
  teamIds: number[]

  @ApiProperty()
  @IsString()
  contract: string

  @ApiProperty()
  @IsNumber()
  matchId: number
}

export class FilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  assetId: number

  @ApiPropertyOptional()
  @IsOptional()
  schemeName: string

  @ApiPropertyOptional()
  @IsOptional()
  price: string

  @ApiPropertyOptional()
  @IsOptional()
  assetName: string

  @ApiPropertyOptional()
  @IsOptional()
  collectionName: string

  @ApiPropertyOptional()
  @IsOptional()
  filterData: string

  @ApiPropertyOptional()
  @IsOptional()
  mint: string

  @ApiPropertyOptional()
  @IsOptional()
  page: number

  @ApiPropertyOptional()
  @IsOptional()
  limit: number

  @ApiPropertyOptional()
  @IsOptional()
  blockchain: BlockchainEnum

  @ApiPropertyOptional()
  @IsOptional()
  sortBy: string

  @ApiPropertyOptional()
  @IsOptional()
  templateIds: string
}

export class TransferCardDto {
  @ApiProperty()
  @IsArray()
  assetIds: number[]

  @ApiProperty()
  @IsString()
  recipient: string

  @ApiProperty()
  @IsArray()
  assetCons: string[]
}

export class AddCollectionDto {
  @ApiProperty()
  @IsString()
  collectionName: string

  @ApiProperty()
  @IsString()
  collectionImage: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  collectionCoverImage: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  collectionDescription: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  amount: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currency: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  card: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description: string

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  saveCard?: boolean

  @ApiProperty()
  @IsNumber()
  blockchain?: BlockchainEnum
}

export class AdminAddCollectionDto extends AddCollectionDto {
  @ApiProperty()
  @IsString()
  collection: string

  @ApiPropertyOptional()
  @IsOptional()
  isFeatured: boolean
}
export class AddSchemaDto {
  @ApiProperty()
  @Matches('(^[a-z1-5.]{1,11}[a-z1-5]$)|(^[a-z1-5.]{12}[a-j1-5]$)')
  collection: string

  @ApiProperty()
  @Matches('(^[a-z1-5.]{1,11}[a-z1-5]$)|(^[a-z1-5.]{12}[a-j1-5]$)')
  schema: string

  @ApiProperty()
  @IsArray()
  names: string[]

  @ApiProperty()
  @IsArray()
  types: string[]
}

export class AddTemplateDto {
  @ApiProperty()
  @IsString()
  collectionId: string

  @ApiProperty()
  @Matches('(^[a-z1-5.]{1,11}[a-z1-5]$)|(^[a-z1-5.]{12}[a-j1-5]$)')
  schema: string

  @ApiProperty()
  @IsNumber()
  maxSupply: number

  @ApiProperty()
  @IsObject()
  data: any
}

export class UpdateFeatureDto {
  @ApiProperty()
  @IsString()
  collection: string

  @ApiProperty()
  @IsBoolean()
  isFeatured: boolean

  @ApiProperty()
  @IsBoolean()
  isHighlight: boolean
}

export class DepositAssetDto {
  @ApiProperty()
  @IsString()
  assetCon: string

  @ApiProperty()
  @IsNumber()
  assetId: number

  @ApiProperty()
  @IsNumber()
  blockchain: BlockchainEnum

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  txnId: string

  @ApiPropertyOptional()
  @IsString()
  userAddress: string
}
export class DepositMintedAssetDto {
  @ApiProperty()
  @IsNumber()
  saleId: number

  @ApiProperty()
  @IsNumber()
  fromNFTId: number

  @ApiProperty()
  @IsNumber()
  toNFTId: number
}

export class AssetsHighlightsDto {
  @ApiProperty()
  @IsNumber()
  assetId: number

  @ApiProperty()
  @IsString()
  assetCon: string

  @ApiProperty()
  @IsNumber()
  blockchain: BlockchainEnum

  @ApiProperty()
  @IsBoolean()
  isHighlight: boolean

  @ApiProperty()
  @IsNumber()
  operatorId: number
}

class Data {
  @IsNotEmpty()
  @IsNumber()
  assetId: number

  @IsNotEmpty()
  @IsNumber()
  rank: number

  @ApiProperty()
  @IsString()
  assetCon: string
}

export class AssetsHighlightsRankDto {
  @ValidateNested({ each: true })
  @IsDefined()
  @Type(() => Data)
  asset: Data[]

  @ApiProperty()
  @IsNumber()
  operatorId: number
}

class DataCollection {
  @ApiProperty()
  @IsString()
  collection: string

  @IsNotEmpty()
  @IsNumber()
  rank: number
}

export class CollectionHighlightsRankDto {
  @ValidateNested({ each: true })
  @IsDefined()
  @Type(() => DataCollection)
  asset: DataCollection[]

  @ApiProperty()
  @IsNumber()
  operatorId: number
}
