import { IsString, IsNumber } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class AddMetadataDto {
  @ApiProperty()
  @IsString()
  name: string

  @ApiProperty()
  @IsString()
  image: string

  @ApiProperty()
  @IsString()
  description: string

  @ApiProperty()
  @IsString()
  schema: string

  @ApiProperty()
  @IsString()
  assetCon: string

  @ApiProperty()
  @IsNumber()
  assetId: number

  @ApiProperty()
  @IsString()
  collection: string
}
