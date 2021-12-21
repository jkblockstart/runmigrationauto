import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { Auth, GetUserId } from 'modules/user/user.guards'
import { AddressDto } from './smart-contract.dto'
import { SmartContractService } from './smart-contract.service'
@Controller('smart-contract')
@ApiTags('SmartContract')
export class SmartContractController {
  constructor(public readonly smartContractService: SmartContractService) {}

  @Get('top-bidder')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get Top bidders list' })
  async getTopBidders() {
    return await this.smartContractService.getTopBidders()
  }

  @Get('user-bid/:username')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get Users bid' })
  async getUserBid(@Param('username') username: string) {
    return await this.smartContractService.getUserBid(username)
  }

  @Get('minimum-bid')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get minimum bid' })
  async getMinimumBid() {
    return await this.smartContractService.getMinimumBid()
  }

  @Get('auction-endtime')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get auction endtime' })
  async getAuctionEndTime() {
    return await this.smartContractService.getAuctionEndTime()
  }

  @Get('gas-price')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get gas price' })
  async getGasPrice() {
    return await this.smartContractService.getGasPrice()
  }

  @Post('register-primary-address/')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Register primary address' })
  @ApiBearerAuth()
  @Auth()
  async registerPrimaryAddress(@GetUserId('id') id, @Body() addressDto: AddressDto) {
    return await this.smartContractService.registerAddressInternal(id, addressDto)
  }

  @Get('transferToken/')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get sale list' })
  async transferToken() {
    return await this.smartContractService.transferToken()
  }

  @Get('ethereum-assets/:address')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get all nfts/assets owned by an ethereum address' })
  async getEthereumAssets(@Param('address') address: string) {
    return await this.smartContractService.getEthereumAssets(address)
  }

  @Get('ethereum/user-nfts/:assetCon')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get all nfts/assets owned by an ethereum address of given smart contract' })
  @ApiBearerAuth()
  @Auth()
  async getUsersNFT(@GetUserId('id') id, @Param('assetCon') assetCon: string) {
    return await this.smartContractService.getUsersNFT(id, assetCon)
  }

  @Get('ethereum-tokens/:address')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Get all ERC20 owned by an ethereum address' })
  async getEthereumTokens(@Param('address') address: string) {
    return await this.smartContractService.getEthereumTokens(address)
  }
}
