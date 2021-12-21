import { Controller, Post, UseInterceptors, UploadedFile, Body, HttpCode, HttpStatus, Get, Param } from '@nestjs/common'
import { ApiBearerAuth, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { Auth, GetUserId, GetOperatorId } from 'modules/user/user.guards'
import { CommonService } from './common.service'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { AddConfigurationDto, UpdateConfigurationDto, NFTCarouselDto, NFTCarouselUpdateDto } from './common.dto'
@Controller('common')
@ApiTags('common')
export class CommonController {
  constructor(public readonly commonService: CommonService) {}

  @Post('getIPFS')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Successfully Created IPFS' })
  @Auth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          callback(null, Math.floor(100000 + Math.random() * 900000) + Date.now() + '.jpg')
        },
      }),
      limits: { fileSize: 4048 * 4048 },
    })
  )
  async uploadImage(@UploadedFile() file: any, @Body() data: any, @GetUserId('id') id: string) {
    return await this.commonService.getIPFS(file.filename, id)
  }

  @Post('add-carousel')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'add carousel' })
  @Auth()
  async addNFTCarousel(@Body() nftCarouselDto: NFTCarouselDto, @GetUserId('id') id: string) {
    return await this.commonService.addNFTCarousel(id, nftCarouselDto)
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('update-carousel')
  @Auth()
  async updateNFTCarousel(@GetUserId('id') userId: string, @Body() NFTCarouselUpdateDto: NFTCarouselUpdateDto) {
    return await this.commonService.updateNFTCarousel(userId, NFTCarouselUpdateDto)
  }

  @HttpCode(HttpStatus.OK)
  @Get('get-carousel/:operatorId')
  async getNFTCarousel(@Param('operatorId') operatorId: number) {
    return await this.commonService.getNFTCarousel(operatorId)
  }

  @HttpCode(HttpStatus.OK)
  @Get('get-configuration')
  @ApiBearerAuth()
  @Auth()
  async getConfiguration(@GetOperatorId('operatorId') operatorId: number) {
    return await this.commonService.getConfiguration(operatorId)
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('add-configuration')
  @Auth()
  async addFeatures(@GetUserId('id') userId: string, @Body() configurationsDto: AddConfigurationDto) {
    return await this.commonService.addConfigurations(userId, configurationsDto)
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('update-configuration')
  @Auth()
  async updateConfiguration(@GetUserId('id') userId: string, @Body() updateConfigurationDto: UpdateConfigurationDto) {
    return await this.commonService.updateConfiguration(userId, updateConfigurationDto)
  }

  @HttpCode(HttpStatus.OK)
  @Get('public/getDateTime')
  async getDateTime() {
    return await this.commonService.getDateTime()
  }
}
