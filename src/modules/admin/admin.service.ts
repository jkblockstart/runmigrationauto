import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common'
import { AddOperatorDto, BidDto, ContactUsDto, WithdrawalLimitDto } from './admin.dto'
import { uuid } from 'uuidv4'
import {
  AdminBidsRepository,
  ContactUsRepository,
  getContactUsMessages,
  getData,
  getOperatorBy,
  OperatorsRepository,
  WithdrawLimitRepository,
} from './admin.repository'
import { Bid, ContactUsInterface, OperatorsInterface, Txn } from './admin.interface'
import { getUserBy } from 'modules/user/user.repository'
import { ConfigService } from 'shared/services/config.service'
import { SmartContractService } from 'modules/smart-contract/smart-contract.service'
import { EmailDto, VerifyOTPDto } from 'modules/user/user.dto'
import { getPayments } from 'modules/payment/payment.repository'
import { UserService } from 'modules/user/user.service'
import { MailerService } from 'modules/mailer/mailer.service'
import { getCollection } from 'modules/owens-marketplace/owens-marketplace.repository'

import { getConfigurationsBy, getNFTCarouselsBy } from 'modules/common/common.repository'
import { getAllCurrentChallenges } from 'modules/challenge/challenge.repository'
@Injectable()
export class AdminService {
  logger: Logger
  constructor(
    public readonly contactUsRepository: ContactUsRepository,
    public readonly withdrawLimitRepository: WithdrawLimitRepository,
    public readonly configService: ConfigService,
    public readonly adminBidsRepository: AdminBidsRepository,
    public readonly smartContractService: SmartContractService,
    @Inject(forwardRef(() => UserService))
    public readonly userService: UserService,
    public readonly mailerService: MailerService,
    public readonly operatorsRepository: OperatorsRepository
  ) {
    this.logger = new Logger()
  }

  async addContactUs({ email, subject, message, requestType }: ContactUsDto): Promise<any> {
    try {
      const id = uuid()
      const contactusDetails: ContactUsInterface = {
        id,
        email: email.toLocaleLowerCase(),
        subject,
        message,
        requestType,
      }
      await this.contactUsRepository.insert(contactusDetails)
      return { message: 'Form Submission Successful' }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getContactUs(requestType: number, limit: number, skip: number): Promise<any> {
    try {
      return await getContactUsMessages(requestType, limit, skip)
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async placeBid(userId: string, { username, amount, bidSource }: BidDto): Promise<any> {
    try {
      const isAdmin = await this.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      const usernameValid = await getUserBy({ username })
      const whitelistedUsernames = JSON.parse(JSON.stringify(this.configService.get('WHITELISTED_USERNAME')))
      if (!usernameValid && !whitelistedUsernames.includes(username)) throw new BadRequestException('Username doesnt exist !!')
      const userExistingBid = await this.smartContractService.getUserBid(username)
      const minimumBid = await this.smartContractService.getMinimumBid()
      if (userExistingBid < minimumBid && parseFloat(amount) < minimumBid)
        throw new BadRequestException('First bid cannot be less than minimum bid')

      if (parseFloat(amount) <= 0) throw new BadRequestException('Amount must be greater than 0')

      const txnDetails: Txn = await this.smartContractService.placeBid(username, amount)
      const bidId = uuid()
      const bid: Bid = {
        id: bidId,
        username,
        amount,
        bidSource,
        txnHash: txnDetails.txnHash,
        status: txnDetails.status,
        message: txnDetails.message,
      }
      await this.adminBidsRepository.insert(bid)
      return { message: txnDetails.message, txnHash: txnDetails.txnHash, status: txnDetails.status }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async checkAdmin(userId: string): Promise<boolean> {
    const user = await getUserBy({ id: userId })
    if (JSON.parse(JSON.stringify(this.configService.get('SUPER_ADMIN'))).includes(user.email)) return true
    else return false
  }

  async placeBidInternal({ username, amount, bidSource }: BidDto): Promise<string> {
    try {
      const txnDetails: Txn = await this.smartContractService.placeBid(username, amount)
      const bidId = uuid()
      const bid: Bid = {
        id: bidId,
        username,
        amount,
        bidSource,
        txnHash: txnDetails.txnHash,
        status: txnDetails.status,
        message: txnDetails.message,
      }
      await this.adminBidsRepository.insert(bid)
      return bidId
    } catch (err) {
      return 'InvalidId'
    }
  }

  async getUserPaymentsDetails(userId: string, { email }: EmailDto): Promise<any[]> {
    try {
      const isAdmin = await this.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      const user = await getUserBy({ email })
      if (!user) throw new BadRequestException('User not found..')
      const paymentDetails = await getPayments()
      return paymentDetails
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getTableData(userId: string, table: string): Promise<any[]> {
    try {
      const isAdmin = await this.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      const paymentDetails = await getData(table)
      return paymentDetails
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getEmailSendOTP({ email }: EmailDto) {
    try {
      const user = await getUserBy({ email })
      if (!user) throw new BadRequestException('User not found..')
      const isAdmin = await this.checkAdmin(user.id)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      const operatorId = 1
      const otpResponse = await this.userService.sendLoginMail(email, user.id, operatorId)
      return otpResponse
    } catch (err) {
      this.logger.error('err aya ', err)
      throw new BadRequestException(err.message)
    }
  }

  async verifyOTP({ email, verificationCode }: VerifyOTPDto) {
    try {
      const user = await getUserBy({ email: email })
      if (!user) return { message: 'User not found..' }
      const isAdmin = await this.checkAdmin(user.id)
      if (!isAdmin) return { message: 'Only admin allowed' }
      const otpResponse = await this.userService.verifyOTP({ email, verificationCode })
      if (otpResponse.code == 200) {
        const collectionList = await getCollection()
        const NFTCarousel = await getNFTCarouselsBy({})
        const configurationList = await getConfigurationsBy({})
        const totalUser = await this.userService.getTotalUsers(user.id)
        const challengesList = await getAllCurrentChallenges()
        return {
          username: otpResponse.username,
          token: otpResponse.token,
          code: 200,
          collectionList: collectionList ? collectionList : [],
          NFTCarousel: NFTCarousel ? NFTCarousel : [],
          configurationList: configurationList ? configurationList : [],
          totalUser: totalUser,
          challengesList: challengesList,
          QueueTypeEnum: [
            { name: 'FCFS', value: '1' },
            { name: 'Random', value: '2' },
            { name: 'NoQueue', value: '3' },
          ],
          QueueRankingTypeEnum: [
            { name: 'Scaterred', value: '1' },
            { name: 'Combined', value: '2' },
            { name: 'NotApplicable', value: '3' },
          ],
          BooleanValue: [
            { name: 'True', value: 'true' },
            { name: 'False', value: 'false' },
          ],
          url: this.configService.get('BACKEND_URL'),
        }
      } else return otpResponse
    } catch (err) {
      this.logger.error(err)
      return { message: err.message }
    }
  }

  async sendRamainderMail() {
    const replacements = {
      baseUrl: this.configService.get('IMAGES_BUCKET'),
      baseUrl2: this.configService.get('IMAGES_BUCKET2'),
    }
    const templateName = 'remainderEmail'
    const userList = await this.userService.getUserList()
    const bcc1 = []
    const bcc2 = []
    const bcc3 = []
    for (let i = 0; i < userList.length; i++) {
      if (i <= 49) {
        bcc1.push(userList[i].email)
      } else if (i >= 50 && i <= 98) {
        bcc2.push(userList[i].email)
      } else {
        bcc3.push(userList[i].email)
      }
    }
    let emailOptions = {
      to: [],
      from: 'admin@owens.market',
      bcc: bcc1,
      subject: 'SHONTELLE | ' + 'Reminder',
    }
    await this.mailerService.sendMail(emailOptions, templateName, replacements)
    if (bcc2.length > 0) {
      emailOptions = {
        to: [],
        from: 'admin@owens.market',
        bcc: bcc2,
        subject: 'SHONTELLE | ' + 'Reminder',
      }
      await this.mailerService.sendMail(emailOptions, templateName, replacements)
    }
    if (bcc3.length > 0) {
      emailOptions = {
        to: [],
        from: 'admin@owens.market',
        bcc: bcc3,
        subject: 'SHONTELLE | ' + 'Reminder',
      }
      await this.mailerService.sendMail(emailOptions, templateName, replacements)
    }
  }

  async sendRamainderMail2() {
    const replacements = {
      baseUrl: this.configService.get('IMAGES_BUCKET'),
      baseUrl2: this.configService.get('IMAGES_BUCKET2'),
    }
    const templateName = 'remainderEmail2'
    const userList = await this.userService.getUserList()
    const bcc1 = []
    const bcc2 = []
    const bcc3 = []
    for (let i = 0; i < userList.length; i++) {
      if (i <= 49) {
        bcc1.push(userList[i].email)
      } else if (i >= 50 && i <= 98) {
        bcc2.push(userList[i].email)
      } else {
        bcc3.push(userList[i].email)
      }
    }
    let emailOptions = {
      to: [],
      from: 'admin@owens.market',
      bcc: bcc1,
      subject: 'SHONTELLE | ' + 'Reminder',
    }
    await this.mailerService.sendMail(emailOptions, templateName, replacements)
    if (bcc2.length > 0) {
      emailOptions = {
        to: [],
        from: 'admin@owens.market',
        bcc: bcc2,
        subject: 'SHONTELLE | ' + 'Reminder',
      }
      await this.mailerService.sendMail(emailOptions, templateName, replacements)
    }
    if (bcc3.length > 0) {
      emailOptions = {
        to: [],
        from: 'admin@owens.market',
        bcc: bcc3,
        subject: 'SHONTELLE | ' + 'Reminder',
      }
      await this.mailerService.sendMail(emailOptions, templateName, replacements)
    }
  }

  async sendOutBidMail(username: string) {
    const replacements = {
      baseUrl: this.configService.get('IMAGES_BUCKET'),
      baseUrl2: this.configService.get('IMAGES_BUCKET2'),
    }
    const user = await getUserBy({ username })
    if (!user) throw new BadRequestException('User not found')
    const templateName = 'outbidEmail'
    const emailOptions = {
      to: [user.email],
      from: 'admin@owens.market',
      bcc: [''],
      subject: 'SHONTELLE | ' + 'You have been outbid',
    }
    await this.mailerService.sendMail(emailOptions, templateName, replacements)
  }

  async addNewOperator(userId: string, { name, onboardingEmailSender, email }: AddOperatorDto) {
    try {
      const isAdmin = await this.checkAdmin(userId)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      const operatorExist = await getOperatorBy({ email })
      if (operatorExist) throw new BadRequestException('Operator already exist')
      const operator: OperatorsInterface = {
        name,
        onboardingEmailSender,
        email,
        addedBy: userId,
      }
      await this.operatorsRepository.insert(operator)
      return { message: 'Operator added successfully' }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }
  async setWithdrawLimit(id: string, withdrawalLimitDto: WithdrawalLimitDto) {
    try {
      const isAdmin = await this.checkAdmin(id)
      if (!isAdmin) throw new ForbiddenException('Only admin allowed')
      const withdrawKey = this.configService.get('WITHDRAW_ADMIN_KEY')
      if (!withdrawKey) throw new ForbiddenException('withdraw admin not found!')
      const withdrawlimit = await this.withdrawLimitRepository.findOne({ id: withdrawKey })
      if (!withdrawlimit) {
        const res = await this.withdrawLimitRepository.insert({
          id: withdrawKey,
          nonKYCPerTransLimit: withdrawalLimitDto.nonKYCWithdrawalLimit,
          withdrawKYCLimit: withdrawalLimitDto.KYCWithdrawalLimit,
          weeklyWithdrawLimit: withdrawalLimitDto.weeklyWithdrawalLimit ? withdrawalLimitDto.weeklyWithdrawalLimit : null,
          dailyWithdrawLimit: withdrawalLimitDto.dailyWithdrawalLimit ? withdrawalLimitDto.dailyWithdrawalLimit : null,
          monthlyWithdrawLimit: withdrawalLimitDto.monthlyWithdrawalLimit ? withdrawalLimitDto.monthlyWithdrawalLimit : null,
        })
        if (res) {
          return { message: 'successfully added withdraw limit' }
        }
      } else {
        const res = await this.withdrawLimitRepository.update(
          { id: withdrawKey },
          {
            nonKYCPerTransLimit: withdrawalLimitDto.nonKYCWithdrawalLimit,
            withdrawKYCLimit: withdrawalLimitDto.KYCWithdrawalLimit,
            weeklyWithdrawLimit: withdrawalLimitDto.weeklyWithdrawalLimit
              ? withdrawalLimitDto.weeklyWithdrawalLimit
              : withdrawlimit.weeklyWithdrawLimit,
            dailyWithdrawLimit: withdrawalLimitDto.dailyWithdrawalLimit
              ? withdrawalLimitDto.dailyWithdrawalLimit
              : withdrawlimit.dailyWithdrawLimit,
            monthlyWithdrawLimit: withdrawalLimitDto.monthlyWithdrawalLimit
              ? withdrawalLimitDto.monthlyWithdrawalLimit
              : withdrawlimit.monthlyWithdrawLimit,
          }
        )
        if (res) {
          return { message: 'Successfully Updated new withdraw limit!' }
        }
      }
    } catch (e) {
      throw new InternalServerErrorException(e.message)
    }
  }
}
