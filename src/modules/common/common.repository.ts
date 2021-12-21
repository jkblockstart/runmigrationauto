import { getManyBy, getSingleBy } from 'helpers'
import { EntityRepository, getConnection, Repository } from 'typeorm'
import { Configurations, IPFSlist, NFTCarousel } from './common.entity'

@EntityRepository(IPFSlist)
export class IPFSlistRepository extends Repository<IPFSlist> {}

@EntityRepository(NFTCarousel)
export class NFTCarouselRepository extends Repository<NFTCarousel> {}

@EntityRepository(Configurations)
export class ConfigurationRepository extends Repository<Configurations> {}

export const getNFTCarouselsBy = getManyBy(NFTCarousel)

export const getConfigurationsBy = getManyBy(Configurations)
export const getConfigurationBy = getSingleBy(Configurations)

export async function updateNFTCarousel(name: string, active: boolean) {
  const query = `
    UPDATE
      "nft_carousel"
    SET
      "active" = $2
    WHERE
      "name" = $1`
  const result = await getConnection().query(query, [name, active])
  return result
}
