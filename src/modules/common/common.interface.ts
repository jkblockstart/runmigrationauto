export interface IPFSlistInterface {
  id: string
  userId: string
  ipfs: string
}

export class NFTCarouselInterface {
  id: string
  imageLink: string
  redirectLink: string
  addedBy: string
  name: string
  description: string
  active: boolean
  operatorId: number
}

export class ConfigurationsInterface {
  id: string
  name: ConfigurationNameEnum
  value: number
  type: ConfigurationTypeEnum
  operatorId: number
}

export enum ConfigurationNameEnum {
  CAROUSEL = 'CAROUSEL',
  COLLECTION_FEE = 'COLLECTION_FEE',
  FEE_ACTIVATION = 'FEE_ACTIVATION',
  SALE_FEE = 'SALE_FEE',
}

export enum ConfigurationTypeEnum {
  Parameter = 1,
  Feature = 2,
}
