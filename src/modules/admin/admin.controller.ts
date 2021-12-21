import { Controller, HttpCode, HttpStatus, Body, Post, Get, Param, Res } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { BidDto, ContactUsDto, AdminVerifyOTPDto, AddOperatorDto, WithdrawalLimitDto } from './admin.dto'
import { AdminService } from './admin.service'
import { Response } from 'express'
import * as path from 'path'
import { Auth, GetUserId } from 'modules/user/user.guards'
import { EmailDto } from 'modules/user/user.dto'

@Controller('admin')
@ApiTags('Admin')
export class AdminController {
  constructor(public readonly adminService: AdminService) {}

  @Post('contact-us')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Contact Us / Press' })
  async addContactUs(@Body() contactUsDto: ContactUsDto) {
    return await this.adminService.addContactUs(contactUsDto)
  }

  @Get('contact-us/:requestType/:limit/:skip')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get comtact us' })
  async getContactUs(
    @Param('requestType') requestType: number,
    @Param('limit') limit: number,
    @Param('skip') skip: number,
    @Res() res: Response
  ) {
    const data = await this.adminService.getContactUs(requestType, limit, skip)
    res.render(path.resolve(__dirname + './../../../templates/contactUs.ejs'), { data })
  }

  @Post('place-bid')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Place Bid for user' })
  @ApiBearerAuth()
  @Auth()
  async placeBid(@GetUserId('id') id: string, @Body() bidDto: BidDto) {
    return await this.adminService.placeBid(id, bidDto)
  }

  @Post('payment-details')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get payment details' })
  @ApiBearerAuth()
  @Auth()
  async getUserPaymentsDetails(@GetUserId('id') id: string, @Body() emailDto: EmailDto) {
    return await this.adminService.getUserPaymentsDetails(id, emailDto)
  }

  //need to remove later
  @Get('tables-data/:table')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get table data' })
  @ApiBearerAuth()
  @Auth()
  async getTableData(@GetUserId('id') id: string, @Param('table') table: string) {
    return await this.adminService.getTableData(id, table)
  }

  @Get('adminlogin')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Admin Login' })
  async getUserList(@Res() res: Response) {
    res.setHeader('Content-Security-Policy', "script-src  'unsafe-inline';")
    res.render('adminLogin.ejs', { email: '', message: '' })
  }

  @Get('verifyOTP')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Verify OTP' })
  async getVerifyOTP(@Res() res: Response) {
    res.setHeader('Content-Security-Policy', "script-src  'unsafe-inline';")
    res.render('adminLogin.ejs', { email: '', message: '' })
  }

  @Post('verifyemail')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Admin Login' })
  async verifyemail(@Body() emailDto: EmailDto) {
    return await this.adminService.getEmailSendOTP(emailDto)
  }

  @Post('verifyOTP')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Verify OTP' })
  async verifyOTP(@Body() verifyOTPDto: AdminVerifyOTPDto, @Res() res: Response) {
    const otpRes = await this.adminService.verifyOTP({
      email: verifyOTPDto.email,
      verificationCode: parseInt(verifyOTPDto.verificationCode),
    })
    if (otpRes.code == 200) {
      res.setHeader('Content-Security-Policy', "script-src  'unsafe-inline';")
      if (verifyOTPDto.type == 'sale') {
        res.render('adminAction.ejs', otpRes)
      } else if (verifyOTPDto.type == 'payment') {
        res.render('adminView.ejs', otpRes)
      }
    } else {
      res.setHeader('Content-Security-Policy', "script-src  'unsafe-inline';")
      res.render('adminLogin.ejs', { email: verifyOTPDto.email, message: otpRes.message })
    }
  }

  // @Get('reminder-mail')
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({ description: 'Send Remainder mail' })
  // async sendRamainderMail() {
  //   return await this.adminService.sendRamainderMail()
  // }

  // @Get('reminder-mail/2')
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({ description: 'Send Remainder mail' })
  // async sendRamainderMail2() {
  //   return await this.adminService.sendRamainderMail2()
  // }

  // @Get('outbid-mail/:username')
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({ description: 'Send overbid mail' })
  // async sendOutBidMail(@Param('username') username: string) {
  //   return await this.adminService.sendOutBidMail(username)
  // }

  //OPERATOR SPECIFIC APIS
  @Post('new-operator')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Add new operator' })
  @ApiBearerAuth()
  @Auth()
  async addNewOperator(@GetUserId('id') id: string, @Body() addOperatorDto: AddOperatorDto) {
    return await this.adminService.addNewOperator(id, addOperatorDto)
  }

  @Post('set-withdraw-limit')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Add new operator' })
  @ApiBearerAuth()
  @Auth()
  async addWithdrawLimit(@GetUserId('id') id: string, @Body() withdrawalLimitDto: WithdrawalLimitDto) {
    return await this.adminService.setWithdrawLimit(id, withdrawalLimitDto)
  }
}
