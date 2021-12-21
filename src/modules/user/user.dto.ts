import { IsString, IsEmail, MinLength, MaxLength, Matches, IsNumber } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { decoratorBundle } from '../../helpers'
import { ClientsEnum } from './user.interface'

export const IsPassword = decoratorBundle([
  IsString(),
  MinLength(6),
  MaxLength(20),
  Matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*$/, {
    message: 'Password must include at least one upper case letter, one lower case letter, and one numeric digit.',
  }),
])

export const IsUsername = decoratorBundle([IsString(), MinLength(6), MaxLength(20)])

export class VerifyOTPDto {
  @ApiProperty()
  @IsEmail()
  email: string

  @ApiProperty()
  @IsNumber()
  verificationCode: number
}

export class EmailDto {
  @ApiProperty()
  @IsEmail()
  email: string
}

export class AccessTokenDto {
  @ApiProperty()
  @IsString()
  accessToken: string
}

export class ThirdPartyLoginDto {
  @ApiProperty()
  @IsString()
  externalToken: string

  @ApiProperty()
  @IsNumber()
  clientId: ClientsEnum

  @ApiProperty()
  @IsNumber()
  operatorId: number
}

export class RegisterEthereumAddressDto {
  @ApiProperty()
  @IsString()
  signature: string
}

export class WaxAccountDto {
  @ApiProperty()
  @IsString()
  account: string
}

export class InstaSignInDto {
  @ApiProperty()
  @IsString()
  id: string

  @ApiProperty()
  @IsString()
  username: string
}
