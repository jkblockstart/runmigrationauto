import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Auth, GetUserId } from 'modules/user/user.guards'
import { ChallengePartialSubmissionDto, CreateChallengesDto, EditChallengesDto, EnterChallengeDto } from './challenge.dto'
import { ChallengeService } from './challenge.service'

@Controller('challenges')
@ApiTags('Challenges')
export class ChallengeController {
  constructor(private challengeService: ChallengeService) {}

  @Post('admin/add-challenges')
  @ApiBearerAuth()
  @Auth()
  async addChallenges(@GetUserId('id') userId: string, @Body() createChallengesDto: CreateChallengesDto) {
    return this.challengeService.addChallenges(userId, createChallengesDto)
  }

  @Post('admin/edit-challenges')
  @ApiBearerAuth()
  @Auth()
  async editChallenges(@GetUserId('id') userId: string, @Body() editChallengesDto: EditChallengesDto) {
    return this.challengeService.editChallenges(userId, editChallengesDto)
  }

  @Get('public/get-challenges/:operatorId')
  async getChallengesList(@Param('operatorId') operatorId: number) {
    return this.challengeService.getChallenges(operatorId)
  }

  @Get('public/get-previous-challenges/:operatorId')
  async getPreviousChallengesList(@Param('operatorId') operatorId: number) {
    return this.challengeService.getPreviousChallengesList(operatorId)
  }

  //TODO: lock and testing
  @Post('enter-challenge')
  @ApiBearerAuth()
  @Auth()
  async enterChallenge(@GetUserId('id') id: string, @Body() enterChallengeDto: EnterChallengeDto) {
    return this.challengeService.enterChallenge(id, enterChallengeDto)
  }

  @Post('challenge-partial-submission')
  @ApiBearerAuth()
  @Auth()
  async challengePartialSubmission(@GetUserId('id') id: string, @Body() challengePartialSubmissionDto: ChallengePartialSubmissionDto) {
    return this.challengeService.challengePartialSubmission(id, challengePartialSubmissionDto)
  }

  //TODO have to add key to show whether partially submitted or nnot
  @Get('assets-for-challenge/:challengeId')
  @ApiBearerAuth()
  @Auth()
  async getUserAssetsForChallenge(@GetUserId('id') id: string, @Param('challengeId') challengeId: number) {
    return this.challengeService.getUserAssetsForChallenge(id, challengeId)
  }

  @Get('get-challenge-cards/:challengeId')
  @ApiBearerAuth()
  @Auth()
  async getCardSubmittedInChallenge(@GetUserId('id') id: string, @Param('challengeId') challengeId: number) {
    return this.challengeService.getCardSubmittedInChallenge(id, challengeId)
  }

  @Get('get-challenge-cards-count/:challengeId')
  async getSubmittedCardCount(@Param('challengeId') challengeId: number) {
    return this.challengeService.getSubmittedCardCount(challengeId)
  }
}
