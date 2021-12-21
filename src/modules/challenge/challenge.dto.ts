import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsBoolean, IsDefined, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator'
import { BlockchainEnum } from 'modules/owens-marketplace/owens-marketplace.interface'

export class CreateChallengesDto {
  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  name: string

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  description: string

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  image: string

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  coverImage: string

  @IsNotEmpty()
  @ApiProperty()
  startTime: Date

  @IsNotEmpty()
  @ApiProperty()
  endTime: Date

  @IsNotEmpty()
  @ApiProperty()
  templateIds: number[]

  @IsNotEmpty()
  @ApiProperty()
  @IsNumber()
  rewardTemplateId: number

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  rewardCollection: string

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  rewardSchema: string

  @IsNotEmpty()
  @ApiProperty()
  @IsNumber()
  limit: number

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  rewardImage: string

  @ApiProperty()
  @IsBoolean()
  enabled: boolean

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  operatorId: number
}

export class EditChallengesDto {
  @IsNotEmpty()
  @ApiProperty()
  @IsNumber()
  challengeId: number

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  name: string

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  description: string

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  image: string

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  coverImage: string

  @ApiProperty()
  @IsBoolean()
  enabled: boolean

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  rewardImage: string

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  operatorId: number
}
class Data {
  @IsNotEmpty()
  @ApiProperty()
  @IsNumber()
  assetId: number

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  assetCon: string
}

export class EnterChallengeDto {
  @IsNotEmpty()
  @ApiProperty()
  @IsNumber()
  challengeId: number

  @ValidateNested({ each: true })
  @IsDefined()
  @ApiProperty()
  @Type(() => Data)
  assets: Data[] //[{ assetId: number, assetCon: string }];

  @IsNotEmpty()
  @ApiProperty()
  blockchain: BlockchainEnum
}
export class ChallengePartialSubmissionDto {
  @IsNotEmpty()
  @ApiProperty()
  @IsNumber()
  challengeId: number

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  assetId: number

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  templateId: number

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  assetCon: string

  @IsNotEmpty()
  @ApiProperty()
  blockchain: BlockchainEnum
}
