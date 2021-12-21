import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common'
import { AddMetadataDto } from './nft.dto'
import { uuid } from 'uuidv4'
import { MetadataInterface } from './nft.interface'

import { getMetadataBy, MetadataRepository } from './nft.repository'
import { AdminService } from 'modules/admin/admin.service'

@Injectable()
export class NFTService {
  constructor(public readonly metadataRepository: MetadataRepository, public readonly adminService: AdminService) {}

  async getMetadata(collection: string, assetId: number) {
    try {
      const metadata = await getMetadataBy({ collection, assetId })
      if (metadata) {
        delete metadata.addedBy
        delete metadata.created
        delete metadata.modified
        delete metadata.id
        delete metadata.collection
        delete metadata.assetCon
      }

      return metadata
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async addMetadata(userId: string, { assetCon, collection, name, image, description, schema, assetId }: AddMetadataDto) {
    try {
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      const id = uuid()
      const metadata: MetadataInterface = {
        id,
        name,
        image,
        description,
        schema,
        assetCon,
        assetId,
        collection,
        addedBy: userId,
      }
      await this.metadataRepository.insert(metadata)
      return { message: `Metadata added successfuly for NFT ${assetId}` }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }
}
