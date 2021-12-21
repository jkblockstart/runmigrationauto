import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { QueueTypeEnum, UnpackRecipientEnum } from './sale.interface'
import { BlockchainEnum } from 'modules/owens-marketplace/owens-marketplace.interface'
import { Type } from 'class-transformer'
import { PageDto } from 'modules/common/common.dto'

export class AdvancedSaleDto {
  @ApiProperty()
  @IsString()
  collectionId: string

  @ApiProperty()
  @IsNumber()
  templateId: number

  @ApiProperty()
  @IsString()
  templateName: string

  @ApiProperty()
  @IsString()
  templateDescription: string

  @ApiProperty()
  @IsString()
  templateImage: string

  @ApiProperty()
  @IsString()
  schema: string

  @ApiProperty()
  @IsNumber()
  price: number

  @ApiProperty()
  @IsNumber()
  limitPerUser: number

  @ApiProperty()
  @IsNumber()
  maxIssue: number

  @ApiProperty()
  @IsNumber()
  queueType: QueueTypeEnum

  @ApiProperty()
  @IsBoolean()
  isFreePack: boolean

  @ApiProperty()
  @IsDateString()
  saleStartTime: Date

  @ApiProperty()
  @IsDateString()
  saleEndTime: Date

  @ApiProperty()
  @IsDateString()
  registrationStartTime: Date

  @ApiProperty()
  @IsDateString()
  registrationEndTime: Date

  @ApiProperty()
  @IsDateString()
  unpackStartTime: Date

  @ApiProperty()
  @IsBoolean()
  isReRegistrationEnabled: boolean

  @ApiProperty()
  @IsDateString()
  queueInitializationTime: Date

  @ApiProperty()
  @IsNumber()
  blockchain: BlockchainEnum

  @ApiProperty()
  @IsString()
  assetCon: string

  @ApiProperty()
  @IsNumber()
  operatorId: number

  @ApiProperty()
  @IsBoolean()
  mintOnBuy: boolean

  @ApiProperty()
  @IsString()
  unpackRecipient: UnpackRecipientEnum

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  chargeFee: number

  @ApiProperty()
  @IsBoolean()
  isBlockchainBuyEnabled: boolean
}

export class SaleEndTimeDto {
  @ApiProperty()
  @IsDateString()
  saleEndTime: Date

  @ApiProperty()
  @IsNumber()
  saleId: number
}

export class UpdateSaleDto {
  @ApiProperty()
  @IsNumber()
  saleId: number

  @ApiProperty()
  @IsString()
  templateName: string

  @ApiProperty()
  @IsString()
  templateDescription: string

  @ApiProperty()
  @IsString()
  templateImage: string

  @ApiProperty()
  @IsDateString()
  unpackStartTime: Date

  @ApiProperty()
  @IsDateString()
  queueInitializationTime: Date
}

export class AddQueueDto {
  @ApiProperty()
  @IsNumber()
  saleId: number

  @ApiProperty()
  @IsNumber()
  intervalSeconds: number

  @ApiProperty()
  @IsNumber()
  minRank: number

  @ApiProperty()
  @IsNumber()
  maxRank: number
}

export class BasicSaleDto {
  @ApiProperty()
  @IsString()
  collectionId: string

  @ApiProperty()
  @IsString()
  templateName: string

  @ApiProperty()
  @IsString()
  templateImage: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  templateDescription: string

  @ApiProperty()
  @IsNumber()
  maxSupply: number

  @ApiProperty()
  @IsDateString()
  saleStartTime: Date

  @ApiProperty()
  @IsDateString()
  saleEndTime: Date

  @ApiProperty()
  @IsNumber()
  limitPerUser: number

  @ApiProperty()
  @IsNumber()
  price: number

  @ApiProperty()
  @IsNumber()
  blockchain: BlockchainEnum

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
}

export class AddSimilarQueueDto {
  @ApiProperty()
  @IsNumber()
  saleId: number

  @ApiProperty()
  @IsNumber()
  intervalSeconds: number

  @ApiProperty()
  @IsNumber()
  allowedRanks: number
}

export class BuyTemplateDto {
  @ApiProperty()
  @IsString()
  amount: string

  @ApiProperty()
  @IsString()
  currency: string

  @ApiProperty()
  @IsString()
  card: string

  @ApiProperty()
  @IsString()
  description: string

  @ApiProperty()
  @IsNumber()
  saleId: number

  @ApiProperty()
  @IsNumber()
  templateId: number

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  saveCard?: boolean
}

export class PaymentRefundDto {
  @ApiProperty()
  @IsString()
  paymentId: string
}

export class SoldTemplateFilterDto extends PageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  saleId: number

  @ApiProperty()
  @IsDateString()
  startDatetime: Date

  @ApiProperty()
  @IsDateString()
  endDatetime: Date
}
