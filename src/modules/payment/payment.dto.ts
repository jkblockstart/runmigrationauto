import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class PaymentDto {
  @ApiProperty()
  @IsNotEmpty()
  amount: string

  @ApiProperty()
  @IsNotEmpty()
  currency: string

  @ApiProperty()
  @IsNotEmpty()
  card: string

  @ApiProperty()
  @IsNotEmpty()
  description: string

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  saveCard?: boolean
}

export class PaymentWithdrawDto {
  @ApiProperty()
  @IsNotEmpty()
  balance: string

  @ApiProperty()
  @IsNotEmpty()
  vaccount: string

  @ApiProperty()
  @IsNotEmpty()
  customerId: string

  @ApiProperty()
  @IsNotEmpty()
  fundingSourceId: string
}

export class DwollaCustomerDto {
  @ApiProperty()
  @IsNotEmpty()
  firstName: string

  @ApiProperty()
  @IsNotEmpty()
  lastName: string

  @ApiProperty()
  @IsNotEmpty()
  type: string

  @ApiProperty()
  @IsNotEmpty()
  routingNumber: string

  @ApiProperty()
  @IsNotEmpty()
  accountNumber: string

  @ApiProperty()
  @IsNotEmpty()
  bankAccountType: string

  @ApiProperty()
  @IsNotEmpty()
  bankName: string

  @ApiProperty()
  businessName?: string
}

export class DwollaWebhookUrlDto {
  @ApiProperty()
  @IsNotEmpty()
  url: string
}

export class WithPersonaDto {
  @ApiProperty()
  @IsNotEmpty()
  inquiryId: string
}
