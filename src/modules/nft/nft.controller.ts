import { Controller, HttpCode, HttpStatus, Body, Post, Get, Param } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { AddMetadataDto } from './nft.dto'
import { Auth, GetUserId } from 'modules/user/user.guards'
import { NFTService } from './nft.service'
import { ConfigService } from 'shared/services/config.service'
@Controller('uri')
@ApiTags('NFT')
export class NFTController {
  constructor(public readonly NFTService: NFTService, public readonly configService: ConfigService) {}

  @Get('/:collection/:assetId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'get meta data' })
  async getMetadata(@Param('collection') collection: string, @Param('assetId') assetId: number) {
    return await this.NFTService.getMetadata(collection, assetId)
  }

  @Post('admin/add-metadata')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'add meta data' })
  @ApiBearerAuth()
  @Auth()
  async addMetaData(@GetUserId('id') id: string, @Body() addMetadataDto: AddMetadataDto) {
    return await this.NFTService.addMetadata(id, addMetadataDto)
  }
}
