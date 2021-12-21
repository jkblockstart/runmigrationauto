import { CreatedModified } from '../../helpers'
import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm'
import { ChallengeInterface, ChallengeParticipationsInterface } from './challenge.interface'
import { BlockchainEnum } from '../owens-marketplace/owens-marketplace.interface'

@Entity()
export class Challenges extends CreatedModified implements ChallengeInterface {
  @PrimaryGeneratedColumn()
  challengeId: number

  @Column({ nullable: false })
  name: string

  @Column({ nullable: true })
  description: string

  @Column({ nullable: true })
  image: string

  @Column({ nullable: false })
  coverImage: string

  @Column({ nullable: true })
  startTime: Date

  @Column({ nullable: true })
  endTime: Date

  @Column({ nullable: true })
  templateIds: string

  @Column()
  rewardTemplateId: number

  @Column()
  rewardCollection: string

  @Column()
  rewardSchema: string

  @Column()
  enabled: boolean

  @Column({ default: false })
  txnStatus: boolean

  @Column({ nullable: true })
  txnMessage: string

  @Column({ nullable: true })
  txnId: string

  @Column({ nullable: true })
  limit: number

  @Column({ nullable: true })
  rewardImage: string

  @Column({ default: 2 })
  operatorId: number
}

@Entity()
export class ChallengeParticipations extends CreatedModified implements ChallengeParticipationsInterface {
  @PrimaryColumn()
  id: string

  @Column({ nullable: false })
  challengeId: number

  @Column({ nullable: false })
  assetId: string

  @Column({ nullable: false })
  assetCon: string

  @Column({ nullable: false })
  blockchain: BlockchainEnum

  @Column({ nullable: false })
  userId: string

  @Column({ default: false })
  txnStatus: boolean

  @Column({ nullable: true })
  txnMessage: string

  @Column({ nullable: true })
  txnId: string
}

@Entity()
export class ChallengePartialParticipations extends CreatedModified implements ChallengeParticipationsInterface {
  @PrimaryColumn()
  id: string

  @Column({ nullable: false })
  challengeId: number

  @Column({ nullable: false })
  assetId: string

  @Column({ nullable: false })
  templateId: number

  @Column({ nullable: false })
  assetCon: string

  @Column({ nullable: false })
  blockchain: BlockchainEnum

  @Column({ nullable: false })
  userId: string
}
