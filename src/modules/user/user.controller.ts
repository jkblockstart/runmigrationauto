import { Controller, HttpCode, HttpStatus, Body, Post, Get, Res, Param } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { AccessTokenDto, EmailDto, RegisterEthereumAddressDto, ThirdPartyLoginDto, VerifyOTPDto, WaxAccountDto } from './user.dto'
import { Auth, GetUserId, GetOperatorId } from './user.guards'
import { UserService } from './user.service'
import { Response } from 'express'
import * as path from 'path'
import { ConfigService } from 'shared/services/config.service'
@Controller('user')
@ApiTags('User')
export class UserController {
  constructor(public readonly userService: UserService, public readonly configService: ConfigService) {}

  @Post('verification-code/:operatorId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: '' })
  async onboard(@Body() userDto: EmailDto, @Param('operatorId') operatorId: number) {
    return await this.userService.onboard(userDto, operatorId)
  }

  @Post('newsletter-register/:operatorId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Register for news letter' })
  async registerForNewsletter(@Body() userDto: EmailDto, @Param('operatorId') operatorId: number) {
    return await this.userService.registerForNewsletter(userDto, operatorId)
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Verify otp' })
  async verifyOTP(@Body() verifyOTPDto: VerifyOTPDto) {
    return await this.userService.verifyOTP(verifyOTPDto)
  }

  @Get('details')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'User Details' })
  @ApiBearerAuth()
  @Auth()
  async getUserDetails(@GetUserId('id') id: string, @GetOperatorId('operatorId') operatorId: number) {
    return await this.userService.getUserDetails(id, operatorId)
  }

  @Get('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Refresh Token' })
  @ApiBearerAuth()
  @Auth()
  async refreshToken(@GetUserId('id') id: string, @GetOperatorId('operatorId') operatorId: number) {
    return await this.userService.refreshToken(id, operatorId)
  }

  @Get('user-list')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'User Details' })
  async getUserList(@Res() res: Response) {
    const data = await this.userService.getUserList()
    res.render(path.resolve(__dirname + './../../../templates/registeredUser.ejs'), { data })
  }

  @Post('facebook-signin/:operatorId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Fb-SignIn login' })
  async facebookSignIn(@Body() accessTokenDto: AccessTokenDto, @Param('operatorId') operatorId: number) {
    return await this.userService.facebookSignIn(accessTokenDto, operatorId)
  }

  @Post('owens-app-signin')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Owens app login' })
  async owensAppSignin(@Body() accessTokenDto: AccessTokenDto) {
    return await this.userService.owensAppSignin(accessTokenDto)
  }

  @Post('external-login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Owens app login' })
  async thirdPartyLogin(@Body() thirdPartyLoginDto: ThirdPartyLoginDto) {
    return await this.userService.thirdPartyLogin(thirdPartyLoginDto)
  }

  @Post('register-ethereum-address')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Add ethereum address' })
  @ApiBearerAuth()
  @Auth()
  async registerEthereumAddress(@GetUserId('id') id: string, @Body() registerEthereumAddressDto: RegisterEthereumAddressDto) {
    return await this.userService.registerEthereumAddress(id, registerEthereumAddressDto)
  }

  @Post('add-waxAccount')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Add wax account' })
  @ApiBearerAuth()
  @Auth()
  async addWaxAccount(@GetUserId('id') id: string, @Body() waxAccountDto: WaxAccountDto) {
    return await this.userService.addWaxAccount(id, waxAccountDto)
  }

  @Get('waxAccounts')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Add wax account' })
  @ApiBearerAuth()
  @Auth()
  async getWaxAccounts(@GetUserId('id') id: string) {
    return await this.userService.getWaxAccounts(id)
  }

  @Post('insta-signin/:operatorId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Insta signin' })
  async instaSignin(@Body() accessTokenDto: AccessTokenDto, @Param('operatorId') operatorId: number) {
    return await this.userService.processInstaCode(accessTokenDto, operatorId)
  }

  @Post('google-signin/:operatorId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Google-SignIn login' })
  async googleSignIn(@Body() accessTokenDto: AccessTokenDto, @Param('operatorId') operatorId: number) {
    return await this.userService.getUserDetailsGoogle(accessTokenDto, operatorId)
  }

  @Get('total-users')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get total user to owens paltofrm' })
  async getTotalUsers(@GetUserId('id') id: string) {
    return await this.userService.getTotalUsers(id)
  }
}
