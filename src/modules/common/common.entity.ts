import { CreatedModified } from '../../helpers'
import { Entity, Column, PrimaryColumn } from 'typeorm'
import {
  ConfigurationNameEnum,
  ConfigurationsInterface,
  ConfigurationTypeEnum,
  IPFSlistInterface,
  NFTCarouselInterface,
} from './common.interface'

@Entity()
export class IPFSlist extends CreatedModified implements IPFSlistInterface {
  @PrimaryColumn()
  id: string

  @Column()
  userId: string

  @Column()
  ipfs: string
}

@Entity()
export class NFTCarousel extends CreatedModified implements NFTCarouselInterface {
  @PrimaryColumn()
  id: string

  @Column()
  imageLink: string

  @Column()
  redirectLink: string

  @Column()
  addedBy: string

  @Column({ nullable: true, unique: true })
  name: string

  @Column({ nullable: true })
  description: string

  @Column({ default: false })
  active: boolean

  @Column({ default: 1 })
  operatorId: number
}

@Entity()
export class Configurations extends CreatedModified implements ConfigurationsInterface {
  @PrimaryColumn()
  id: string

  @Column()
  name: ConfigurationNameEnum

  @Column()
  value: number

  @Column()
  type: ConfigurationTypeEnum

  @Column({ default: 1 })
  operatorId: number
}
