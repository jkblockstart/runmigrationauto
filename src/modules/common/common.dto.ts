import { IsBoolean, IsEnum, IsString, IsNumber, Min, Max, IsDateString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { ConfigurationNameEnum, ConfigurationTypeEnum } from './common.interface'
import { Type } from 'class-transformer'
export class NFTCarouselDto {
  @ApiProperty()
  @IsString()
  redirectLink: string

  @ApiProperty()
  @IsString()
  name: string

  @ApiProperty()
  @IsString()
  description: string

  @ApiProperty()
  @IsBoolean()
  active: boolean

  @ApiProperty()
  @IsNumber()
  operatorId: number

  @ApiProperty()
  @IsString()
  imageLink: string
}

export class NFTCarouselUpdateDto {
  @ApiProperty()
  @IsString()
  name: string

  @ApiProperty()
  @IsBoolean()
  active: boolean
}

export class UpdateConfigurationDto {
  @ApiProperty()
  @IsString()
  name: ConfigurationNameEnum

  @ApiProperty()
  @IsNumber()
  value: number

  @ApiProperty()
  @IsNumber()
  operatorId: number
}

export class AddConfigurationDto {
  @ApiProperty()
  @IsEnum(ConfigurationNameEnum)
  name: ConfigurationNameEnum

  @ApiProperty()
  @IsNumber()
  value: number

  @ApiProperty()
  @IsEnum(ConfigurationTypeEnum)
  type: ConfigurationTypeEnum

  @ApiProperty()
  @IsNumber()
  operatorId: number
}

export class PageDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number

  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(100)
  limit: number
}

export class StartEndTimeDto extends PageDto {
  @ApiProperty()
  @IsDateString()
  startDatetime: Date

  @ApiProperty()
  @IsDateString()
  endDatetime: Date
}
