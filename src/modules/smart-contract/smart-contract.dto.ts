import { IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class AddressDto {
  @ApiProperty()
  @IsString()
  address: string
}
