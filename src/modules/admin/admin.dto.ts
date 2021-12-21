import { IsString, IsEmail, IsNumber, IsDateString, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { BidSourceEnum, RequestTypeEnum } from './admin.interface'
import { PageDto } from 'modules/common/common.dto'
import { Type } from 'class-transformer'

export class ContactUsDto {
  @ApiProperty()
  @IsEmail()
  email: string

  @ApiProperty()
  @IsString()
  subject: string

  @ApiProperty()
  @IsString()
  message: string

  @ApiProperty()
  @IsNumber()
  requestType: RequestTypeEnum
}

export class BidDto {
  @ApiProperty()
  @IsString()
  username: string

  @ApiProperty()
  @IsString()
  amount: string

  @ApiProperty()
  @IsNumber()
  bidSource: BidSourceEnum
}

export class AdminVerifyOTPDto {
  @ApiProperty()
  @IsEmail()
  email: string

  @ApiProperty()
  @IsString()
  verificationCode: string

  @ApiProperty()
  @IsString()
  type: string
}

export class AddOperatorDto {
  @ApiProperty()
  @IsString()
  name: string

  @ApiProperty()
  @IsString()
  onboardingEmailSender: string

  @ApiProperty()
  @IsString()
  email: string
}

export class WithdrawalLimitDto {
  @ApiProperty()
  @IsString()
  nonKYCWithdrawalLimit: string

  @ApiProperty()
  @IsString()
  KYCWithdrawalLimit: string

  @ApiProperty()
  @IsString()
  dailyWithdrawalLimit?: string

  @ApiProperty()
  @IsString()
  weeklyWithdrawalLimit?: string

  @ApiProperty()
  @IsString()
  monthlyWithdrawalLimit?: string
}
