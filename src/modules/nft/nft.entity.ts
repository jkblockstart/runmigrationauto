import { CreatedModified } from '../../helpers'
import { Entity, Column, PrimaryColumn } from 'typeorm'
import { MetadataInterface } from './nft.interface'

@Entity()
export class Metadata extends CreatedModified implements MetadataInterface {
  @PrimaryColumn()
  id: string

  @Column({ nullable: true })
  name: string

  @Column({ nullable: true })
  image: string

  @Column({ nullable: true })
  description: string

  @Column({ nullable: true })
  assetCon: string

  @Column({ nullable: true })
  collection: string

  @Column({ nullable: true })
  assetId: number

  @Column({ nullable: true })
  schema: string

  @Column({ nullable: true })
  addedBy: string
}
