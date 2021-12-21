import { Injectable, InternalServerErrorException, BadRequestException, HttpService, ForbiddenException } from '@nestjs/common'
import { getOperatorBy } from 'modules/admin/admin.repository'
import { AdminService } from 'modules/admin/admin.service'
import { SmartContractService } from 'modules/smart-contract/smart-contract.service'
import { getUserBy } from 'modules/user/user.repository'
import { ConfigService } from 'shared/services/config.service'

import { uuid } from 'uuidv4'

import { ChallengePartialSubmissionDto, CreateChallengesDto, EditChallengesDto, EnterChallengeDto } from './challenge.dto'
import {
  ChallengeInterface,
  ChallengePartialParticipationsInterface,
  ChallengeParticipationConfiguration,
  ChallengeParticipationsInterface,
  CreateChallengeConfiguration,
} from './challenge.interface'
import {
  ChallengePartialParticipationsRepository,
  ChallengeParticipationsRepository,
  ChallengeRepository,
  getActiveChallenges,
  getChallengeBy,
  getChallengePartialParticipationBy,
  getChallengePartialParticipationsBy,
  getChallengeParticipationBy,
  getChallengeParticipationsBy,
  getChallengeSubmissions,
  getPreviousChallenges,
  getTotalSubmissionForActiveChallenges,
  markCardSubmissionSuccessful,
} from './challenge.repository'
@Injectable()
export class ChallengeService {
  constructor(
    public readonly challengeRepository: ChallengeRepository,
    public readonly challengeParticipationsRepository: ChallengeParticipationsRepository,
    public readonly challengePartialParticipationsRepository: ChallengePartialParticipationsRepository,
    public readonly configService: ConfigService,
    public readonly smartContractService: SmartContractService,
    public readonly adminService: AdminService,
    private readonly http: HttpService
  ) {}

  async addChallenges(
    userId: string,
    {
      name,
      description,
      image,
      coverImage,
      startTime,
      endTime,
      templateIds,
      rewardTemplateId,
      rewardCollection,
      rewardSchema,
      limit,
      rewardImage,
      enabled,
      operatorId,
    }: CreateChallengesDto
  ) {
    try {
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      if (startTime <= new Date() || endTime < new Date() || endTime < startTime) throw new BadRequestException('invalid start end time')
      const operatorExist = await getOperatorBy({ id: operatorId })
      if (!operatorExist) throw new BadRequestException('Invalid operator')
      const challenge: ChallengeInterface = {
        name,
        description,
        image,
        coverImage,
        startTime,
        endTime,
        templateIds: templateIds.toString(),
        enabled,
        rewardTemplateId,
        rewardCollection,
        rewardSchema,
        txnStatus: false,
        limit,
        rewardImage,
        operatorId,
      }
      const challengeRepoResult = await this.challengeRepository.insert(challenge)
      const createChallengeConfiguration: CreateChallengeConfiguration = {
        challenge_id: challengeRepoResult.identifiers[0].challengeId,
        required_template_ids: templateIds,
        start_time: startTime,
        end_time: endTime,
        reward_template_id: rewardTemplateId,
        reward_schema: rewardSchema,
        reward_collection: rewardCollection,
      }
      const smartContractResult = await this.smartContractService.createChallenge(createChallengeConfiguration)
      await this.challengeRepository.update(challengeRepoResult.identifiers[0].challengeId, {
        txnMessage: smartContractResult.txnMessage,
        txnId: smartContractResult.txnId,
        txnStatus: smartContractResult.txnStatus,
      })

      if (smartContractResult.txnStatus) {
        return { message: 'challenge added succesfully' }
      } else {
        throw new InternalServerErrorException(smartContractResult.txnMessage)
      }
    } catch (err) {
      throw new InternalServerErrorException(err.message)
    }
  }

  async editChallenges(
    userId: string,
    { challengeId, name, description, image, coverImage, enabled, rewardImage, operatorId }: EditChallengesDto
  ) {
    try {
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      const operatorExist = await getOperatorBy({ id: operatorId })
      if (!operatorExist) throw new BadRequestException('Invalid operator')
      await this.challengeRepository.update(challengeId, {
        name,
        description,
        image,
        coverImage,
        enabled,
        rewardImage,
        operatorId,
      })
      return { message: 'challenge updated succesfully' }
    } catch (err) {
      throw new InternalServerErrorException(err.message)
    }
  }

  async getChallenges(operatorId: number) {
    const operatorExist = await getOperatorBy({ id: operatorId })
    if (!operatorExist) throw new BadRequestException('Invalid operator')
    const challengesList = await getActiveChallenges(operatorId)
    if (!challengesList[0]) throw new BadRequestException('No Challenges Found')
    const challenge = []
    for (const challenges of challengesList) {
      challenge.push(challenges.challengeId)
    }
    const totalSubmissions = await getTotalSubmissionForActiveChallenges(challenge)
    for (const challenges of challengesList) {
      for (const totalSubmission of totalSubmissions) {
        if (challenges.challengeId == totalSubmission.challengeId) {
          challenges.totalSubmission = totalSubmission.totalSubmission
        }
      }
    }
    return challengesList
  }

  async getPreviousChallengesList(operatorId: number) {
    const operatorExist = await getOperatorBy({ id: operatorId })
    if (!operatorExist) throw new BadRequestException('Invalid operator')
    const challengesList = await getPreviousChallenges(operatorId)
    if (!challengesList[0]) throw new BadRequestException('No Challenges Found')
    const challenge = []
    for (const challenges of challengesList) {
      challenge.push(challenges.challengeId)
    }
    const totalSubmissions = await getTotalSubmissionForActiveChallenges(challenge)
    for (const challenges of challengesList) {
      for (const totalSubmission of totalSubmissions) {
        if (challenges.challengeId == totalSubmission.challengeId) {
          challenges.totalSubmission = totalSubmission.totalSubmission
        }
      }
    }
    return challengesList
  }

  async getSubmittedCardCount(challengeId: number) {
    const submittedCardCount = await getChallengeSubmissions(challengeId)
    return { totalSubmission: submittedCardCount[0].totalSubmission }
  }

  async enterChallenge(userId: string, { challengeId, assets, blockchain }: EnterChallengeDto) {
    try {
      const challengeDetail = await getChallengeBy({ challengeId })
      if (!challengeDetail || !challengeDetail.txnStatus || !challengeDetail.enabled) throw new BadRequestException('Invalid challenge')
      if (challengeDetail.startTime > new Date()) throw new BadRequestException('challenge not started')
      if (challengeDetail.endTime < new Date()) throw new BadRequestException('challenge over')
      const challengeTemplateIds = challengeDetail.templateIds.split(',')
      if (assets.length != challengeTemplateIds.length) throw new BadRequestException('Invalid asset count')
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const user = await getUserBy({ id: userId })
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/card/userCardsByTemp/?apiKey=${apiKey}&email=${
        user.email
      }&templateIds=[${challengeDetail.templateIds}]`
      const { data: challengeSpecificAsset } = await this.http.get(url, { headers: {} }).toPromise()
      const assetIds = []
      const isParticipated = await getChallengeParticipationBy({
        challengeId,
        userId: userId,
        txnStatus: true,
      })
      if (isParticipated) throw new BadRequestException(`You already particiapated in this challenge`)
      const challengeSubmissions = await getChallengeSubmissions(challengeId)
      if (challengeSubmissions[0].totalSubmission >= challengeDetail.limit)
        throw new BadRequestException(`No more submission accepted. Submissions have reached it's limit`)
      for (const asset of assets) {
        const isAssetUsed = await getChallengeParticipationBy({
          challengeId,
          assetId: asset.assetId.toString(),
          assetCon: asset.assetCon,
          txnStatus: true,
          blockchain,
        })
        if (isAssetUsed) throw new BadRequestException(`Asset ${asset.assetId} already used in the challenge`)
        assetIds.push(asset.assetId)
      }
      for (const templateId of challengeTemplateIds) {
        let isAssetFound = false
        for (const asset of challengeSpecificAsset[templateId]) {
          if (assetIds.includes(asset.id)) {
            isAssetFound = true
            break
          }
        }
        if (!isAssetFound) throw new BadRequestException(`Asset not available for template ${templateId}`)
      }
      const ids = []
      for (const asset of assets) {
        const id = uuid()
        const challengeParticipationDetail: ChallengeParticipationsInterface = {
          id,
          challengeId,
          assetId: asset.assetId.toString(),
          assetCon: asset.assetCon,
          blockchain,
          userId,
        }
        ids.push(id)
        await this.challengeParticipationsRepository.insert(challengeParticipationDetail)
      }

      const challengeParticipationConfiguration: ChallengeParticipationConfiguration = {
        dappaccount: user.username,
        challenge_id: challengeId,
        asset_ids: assetIds,
      }

      const smartContractResult = await this.smartContractService.challengeParticipation(challengeParticipationConfiguration)
      await markCardSubmissionSuccessful(ids, smartContractResult.txnStatus, smartContractResult.txnMessage, smartContractResult.txnId)
      if (smartContractResult.txnStatus) {
        for (const asset of assets) {
          const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/cardschema/lock?apiKey=${apiKey}&email=${
            user.email
          }&assetId=${asset.assetId.toString()}&assetCon=${asset.assetCon}&unlockAt=${challengeDetail.endTime}`
          await this.http.get(url, { headers: {} }).toPromise()
        }
        return { message: 'Challenge Card Added Successfully' }
      } else {
        return { message: smartContractResult.txnMessage }
      }
    } catch (e) {
      throw new InternalServerErrorException(e)
    }
  }

  async challengePartialSubmission(
    userId: string,
    { challengeId, assetCon, assetId, blockchain, templateId }: ChallengePartialSubmissionDto
  ) {
    try {
      const challengeDetail = await getChallengeBy({ challengeId })

      if (!challengeDetail || !challengeDetail.txnStatus || !challengeDetail.enabled) throw new BadRequestException('Invalid challenge')
      if (challengeDetail.startTime > new Date()) throw new BadRequestException('challenge not started')
      if (challengeDetail.endTime < new Date()) throw new BadRequestException('challenge over')
      const isAssetUsed = await getChallengeParticipationBy({
        challengeId,
        assetId: assetId.toString(),
        assetCon: assetCon,
        txnStatus: true,
        blockchain,
      })
      if (isAssetUsed) throw new BadRequestException('Asset already used')
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const user = await getUserBy({ id: userId })
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/card/userCardsByTemp/?apiKey=${apiKey}&email=${
        user.email
      }&templateIds=[${challengeDetail.templateIds}]`
      const { data: challengeSpecificAsset } = await this.http.get(url, { headers: {} }).toPromise()
      let isAssetFound = false
      for (const asset of challengeSpecificAsset[templateId]) {
        if (assetId == asset.id) {
          isAssetFound = true
          break
        }
      }
      if (!isAssetFound) throw new BadRequestException(`invalid asset`)

      const challengeParticiapationDetails = await getChallengePartialParticipationBy({ challengeId, userId, templateId })

      if (challengeParticiapationDetails) {
        await this.challengePartialParticipationsRepository.update(challengeParticiapationDetails.id, {
          assetId: assetId.toString(),
          assetCon,
          blockchain,
        })
      } else {
        const challengeParticiapationData: ChallengePartialParticipationsInterface = {
          id: uuid(),
          challengeId,
          assetId: assetId.toString(),
          assetCon,
          templateId,
          blockchain,
          userId,
        }
        await this.challengePartialParticipationsRepository.insert(challengeParticiapationData)
      }
      return { message: 'asset updated Succcessfully' }
    } catch (e) {
      throw new InternalServerErrorException(e)
    }
  }

  async getUserAssetsForChallenge(userId: string, challengeId: number) {
    try {
      const challengeDetail = await getChallengeBy({ challengeId })
      if (!challengeDetail || !challengeDetail.txnStatus || !challengeDetail.enabled) throw new BadRequestException('Invalid challenge')
      if (challengeDetail.startTime > new Date()) throw new BadRequestException('challenge not started')
      if (challengeDetail.endTime < new Date()) throw new BadRequestException('challenge over')
      const challengeTemplateIds = challengeDetail.templateIds.split(',')
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const user = await getUserBy({ id: userId })
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/card/userCardsByTemp/?apiKey=${apiKey}&email=${
        user.email
      }&templateIds=[${challengeDetail.templateIds}]`
      const { data: challengeSpecificAsset } = await this.http.get(url, { headers: {} }).toPromise()
      const challengeParticiapationsDetails = await getChallengePartialParticipationsBy({ challengeId, userId })
      const assetIds = []
      for (const asset of challengeParticiapationsDetails) {
        assetIds.push(asset.assetId)
      }
      for (const templateId of challengeTemplateIds) {
        for (const asset of challengeSpecificAsset[templateId]) {
          if (assetIds.includes(asset.id.toString())) {
            asset.selected = true
          } else {
            asset.selected = false
          }
        }
      }
      return challengeSpecificAsset
    } catch (e) {
      throw new InternalServerErrorException(e)
    }
  }

  async getCardSubmittedInChallenge(userId: string, challengeId: number) {
    try {
      const user = await getUserBy({ id: userId })
      const isParticipated = await getChallengeParticipationsBy({
        challengeId,
        userId: userId,
        txnStatus: true,
      })
      if (!isParticipated[0]) throw new BadRequestException(`You have no cards submitted for this challenge`)
      const assetIds = []
      for (const asset of isParticipated) {
        assetIds.push({ assetId: asset.assetId, assetCon: asset.assetCon, blockchain: asset })
      }
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/card/assetByIds/?apiKey=${apiKey}&email=${
        user.email
      }&assets=${JSON.stringify(assetIds)}`
      const { data: challengeSpecificAsset } = await this.http.get(url, { headers: {} }).toPromise()
      return challengeSpecificAsset
    } catch (e) {
      throw new InternalServerErrorException(e)
    }
  }
}
