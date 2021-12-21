import { BlockchainEnum } from 'modules/owens-marketplace/owens-marketplace.interface'

export interface ChallengeInterface {
  name: string
  description: string
  image: string
  coverImage: string
  startTime: Date
  endTime: Date
  templateIds: string
  enabled: boolean
  rewardTemplateId: number
  rewardSchema: string
  rewardCollection: string

  txnStatus?: boolean
  txnMessage?: string
  txnId?: string
  limit: number
  rewardImage: string
  operatorId: number
}

export interface ChallengeParticipationsInterface {
  id: string
  challengeId: number
  assetId: string
  assetCon: string
  blockchain: BlockchainEnum
  userId: string
  txnStatus?: boolean
  txnMessage?: string
  txnId?: string
}

export interface ChallengePartialParticipationsInterface {
  id: string
  challengeId: number
  assetId: string
  templateId: number
  assetCon: string
  blockchain: BlockchainEnum
  userId: string
}
export interface ChallengeParticipationConfiguration {
  dappaccount: string
  challenge_id: number
  asset_ids: string[]
}

export interface CreateChallengeConfiguration {
  challenge_id: number
  required_template_ids: number[]
  start_time: Date
  end_time: Date
  reward_template_id: number
  reward_schema: string
  reward_collection: string
}
