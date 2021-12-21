import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common'
import { getOperatorBy } from 'modules/admin/admin.repository'
import { AdminService } from 'modules/admin/admin.service'
import { uuid } from 'uuidv4'
import { AddConfigurationDto, UpdateConfigurationDto, NFTCarouselDto, NFTCarouselUpdateDto } from './common.dto'
import { ConfigurationsInterface, IPFSlistInterface, NFTCarouselInterface } from './common.interface'
import {
  IPFSlistRepository,
  NFTCarouselRepository,
  getNFTCarouselsBy,
  getConfigurationsBy,
  ConfigurationRepository,
  updateNFTCarousel,
  getConfigurationBy,
} from './common.repository'
import { pinataipfs } from './pinata'

@Injectable()
export class CommonService {
  logger: Logger
  constructor(
    public readonly ipfslistRepository: IPFSlistRepository,
    private nftCarouselRepository: NFTCarouselRepository,
    private configurationRepository: ConfigurationRepository,
    public readonly adminService: AdminService
  ) {
    this.logger = new Logger()
  }

  async getIPFS(filename, userId) {
    try {
      const pinataResp = await pinataipfs(filename)
      const obj: IPFSlistInterface = {
        id: uuid(),
        userId: userId,
        ipfs: pinataResp.IpfsHash,
      }
      await this.ipfslistRepository.insert(obj)
      return { ipfs: process.env.IPFS + pinataResp.IpfsHash }
    } catch (err) {
      this.logger.error('err ', err)
      throw new BadRequestException(err.message)
    }
  }

  async addNFTCarousel(userId: string, nftCarouselDto: NFTCarouselDto): Promise<any> {
    try {
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      const nftCarousel: NFTCarouselInterface = {
        id: uuid(),
        imageLink: nftCarouselDto.imageLink,
        redirectLink: nftCarouselDto.redirectLink,
        addedBy: userId,
        name: nftCarouselDto.name,
        description: nftCarouselDto.description,
        active: nftCarouselDto.active,
        operatorId: nftCarouselDto.operatorId,
      }
      await this.nftCarouselRepository.insert(nftCarousel)
      return { message: 'carousel added Successfully' }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getNFTCarousel(operatorId: number): Promise<any> {
    try {
      const operatorExist = await getOperatorBy({ id: operatorId })
      if (!operatorExist) throw new BadRequestException('Invalid operator')
      const nft = getNFTCarouselsBy({ operatorId })
      return nft
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getConfiguration(operatorId: number): Promise<any> {
    try {
      const configurations = getConfigurationsBy({ operatorId })
      return configurations
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async addConfigurations(userId: string, { name, value, operatorId, type }: AddConfigurationDto): Promise<any> {
    try {
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      const configurationExist = await getConfigurationBy({ name, operatorId })
      if (configurationExist) throw new BadRequestException('Configuration already exist')
      const configs: ConfigurationsInterface = {
        id: uuid(),
        name,
        value,
        type,
        operatorId,
      }
      await this.configurationRepository.insert(configs)
      return { message: 'config added Successfully' }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async updateConfiguration(userId: string, { name, value, operatorId }: UpdateConfigurationDto): Promise<any> {
    try {
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      const config = await getConfigurationBy({ name, operatorId })
      if (!config) throw new BadRequestException('Config does not exist')
      await this.configurationRepository.update(config.id, { value })
      return { message: 'Configuration Updated Successfully' }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async updateNFTCarousel(userId: string, NFTCarouselUpdateDto: NFTCarouselUpdateDto): Promise<any> {
    try {
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      await updateNFTCarousel(NFTCarouselUpdateDto.name, NFTCarouselUpdateDto.active)
      const nft = await getNFTCarouselsBy({})
      return { message: 'Carousel Updated Successfully', nft: nft }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getDateTime() {
    try {
      return new Date()
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }
}
