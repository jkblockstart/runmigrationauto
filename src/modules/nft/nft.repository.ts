import { getSingleBy } from '../../helpers'
import { EntityRepository, Repository } from 'typeorm'
import { Metadata } from './nft.entity'

export const getMetadataBy = getSingleBy(Metadata)

@EntityRepository(Metadata)
export class MetadataRepository extends Repository<Metadata> {}
