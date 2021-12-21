import { Injectable, BadRequestException, HttpService, Logger, forwardRef, Inject } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import {
  AccessTokenDto,
  EmailDto,
  InstaSignInDto,
  RegisterEthereumAddressDto,
  ThirdPartyLoginDto,
  VerifyOTPDto,
  WaxAccountDto,
} from './user.dto'
import { uuid } from 'uuidv4'
import { ClientsEnum, JwtPayload, User, Verification, WaxAccountsInterface } from './user.interface'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Hashids = require('hashids/cjs')
import * as fetch from 'node-fetch'
import {
  EmailVerificationRepository,
  getEmailVerificationBy,
  getUserBy,
  getUserList,
  getWaxAccountBy,
  getWaxAccountsBy,
  ResetPasswordRepository,
  UserRepository,
  WaxAccountsRepository,
} from './user.repository'
import { ConfigService } from 'shared/services/config.service'
import { MailerService } from 'modules/mailer/mailer.service'
import { SmartContractService } from 'modules/smart-contract/smart-contract.service'
import { AdminService } from 'modules/admin/admin.service'
import { getOperatorBy } from 'modules/admin/admin.repository'

import { OAuth2Client } from 'google-auth-library'
@Injectable()
export class UserService {
  logger: Logger
  constructor(
    public readonly userRepository: UserRepository,
    public readonly jwtService: JwtService,
    public readonly emailVerificationRepository: EmailVerificationRepository,
    public readonly resetPasswordRepository: ResetPasswordRepository,
    public readonly waxAccountsRepository: WaxAccountsRepository,
    public readonly configService: ConfigService,
    public readonly mailerService: MailerService,
    public readonly smartContractService: SmartContractService,
    private readonly http: HttpService,
    @Inject(forwardRef(() => AdminService))
    private readonly adminService: AdminService
  ) {
    this.logger = new Logger()
  }

  async onboard({ email }: EmailDto, operatorId: number): Promise<any> {
    try {
      const operatorExist = await getOperatorBy({ id: operatorId })
      if (!operatorExist) throw new BadRequestException('Invalid operator')
      email = email.toLocaleLowerCase()
      const user = await getUserBy({ email })
      if (user) {
        await this.userRepository.update(user.id, { currentOperatorId: operatorId })
        if (user.emailVerified === true) return await this.sendLoginMail(email, user.id, operatorId)
        return await this.sendSignupMail(email, user.id, operatorId)
      }
      const id = uuid()
      const username = await this.getUsername(email)
      const register: User = {
        id,
        email: email.toLocaleLowerCase(),
        username,
        currentOperatorId: operatorId,
      }
      await this.userRepository.insert(register)
      return await this.sendSignupMail(email, id, operatorId)
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async registerForNewsletter({ email }: EmailDto, operatorId: number): Promise<any> {
    try {
      const operatorExist = await getOperatorBy({ id: operatorId })
      if (!operatorExist) throw new BadRequestException('Invalid operator')
      email = email.toLocaleLowerCase()
      const user = await getUserBy({ email })
      if (user) throw new BadRequestException('Already Registered')
      const id = uuid()
      const username = await this.getUsername(email)
      const register: User = {
        id,
        email: email.toLocaleLowerCase(),
        username,
        currentOperatorId: operatorId,
      }
      await this.userRepository.insert(register)
      return {
        message: 'Registered successfully for newsletter',
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  //INTERNAL
  async getUsername(email: string): Promise<any> {
    const hashid = new Hashids(email.toLowerCase(), 9)
    const hashsh = hashid.encode(999)
    const username = 'dap' + (await this.reshapeUsername(hashsh.toLowerCase()))
    return username
  }

  //INTERNAL
  async reshapeUsername(username: string): Promise<any> {
    let reshapedUsername = ''
    const encoding = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o']
    for (let i = 0; i < username.length; i++) {
      if (parseInt(username.charAt(i)) === 0 || parseInt(username.charAt(i)) > 5) {
        reshapedUsername += encoding[username.charAt(i)]
      } else reshapedUsername += username.charAt(i)
    }
    return reshapedUsername
  }

  async verifyOTP({ email, verificationCode }: VerifyOTPDto): Promise<any> {
    try {
      email = email.toLocaleLowerCase()
      const user = await getUserBy({ email })
      const verificationRecord = await getEmailVerificationBy({ user: user.id, code: verificationCode })
      if (verificationRecord) {
        if (!user.emailVerified) {
          await this.userRepository.update(user.id, { emailVerified: true })
        }
        await this.emailVerificationRepository.delete({ user: user.id })
        /* const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
        const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/user/wallet?apiKey=${apiKey}&email=${user.email}` */
        try {
          const token = await this.generateToken(user.id, user.email, user.currentOperatorId)
          await this.registerOnAppBackend(user.email)

          const externalToken = await this.getOwensAppToken(token)
          const isAdmin = await this.adminService.checkAdmin(user.id)
          return { token, username: user.username, email: user.email, code: 200, externalToken, isAdmin: isAdmin }
        } catch (err) {
          throw new BadRequestException(err.response.data.message)
        }
      }
      throw new BadRequestException('verification code expired!!!')
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getUserDetails(userId: string, operatorId: number): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      if (!user) throw new BadRequestException('user not found..')
      const primaryAddress = await this.smartContractService.getPrimaryAddress(user.username)
      return {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
        username: user.username,
        primaryAddress,
        operatorId,
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getOwensAppToken(token: string) {
    // const appUrl = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/user/webtoken`
    // const body = {
    //   webToken: token,
    // }
    // const { data: result } = await this.http.post(appUrl, body, { headers: { 'Content-Type': 'application/json' } }).toPromise()
    // if (!result) throw new BadRequestException('Owens app login failed')
    // // return result.appToken
    return ''
  }

  async refreshToken(userId: string, operatorId: number): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const token = await this.generateToken(user.id, user.email, operatorId)
      const externalToken = await this.getOwensAppToken(token)
      return { token, username: user.username, email: user.email, code: 200, externalToken }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async sendSignupMail(email: string, id: string, operatorId: number) {
    const operatorDetails = await getOperatorBy({ id: operatorId })
    const verificationCode = Math.floor(100000 + Math.random() * 900000)
    const user = await getUserBy({ email: email.toLocaleLowerCase() })
    const replacements = {
      baseUrl: this.configService.get('IMAGES_BUCKET'),
      baseUrl2: this.configService.get('IMAGES_BUCKET2'),
      verificationCode,
    }
    const templateName = 'emailVerification'
    const emailOptions = {
      to: [email],
      from: operatorDetails.onboardingEmailSender,
      bcc: [''],
      subject: `${operatorDetails.name} | verification code`,
    }
    await this.mailerService.sendMail(emailOptions, templateName, replacements)
    const verificationRecord: Verification = { user: id, code: verificationCode }
    const verificationExist = await getEmailVerificationBy({ user: id })
    if (verificationExist) {
      await this.emailVerificationRepository.update(user.id, { code: verificationCode })
    } else {
      await this.emailVerificationRepository.insert(verificationRecord)
    }
    const isAdmin = await this.adminService.checkAdmin(id)
    return {
      message: 'verification code send successfully',
      isAdmin: isAdmin,
    }
  }

  async sendLoginMail(email: string, id: string, operatorId: number) {
    const operatorDetails = await getOperatorBy({ id: operatorId })
    const verificationCode = Math.floor(100000 + Math.random() * 900000)
    const user = await getUserBy({ email: email.toLocaleLowerCase() })
    const replacements = {
      baseUrl: this.configService.get('IMAGES_BUCKET'),
      baseUrl2: this.configService.get('IMAGES_BUCKET2'),
      verificationCode,
    }
    const templateName = 'emailVerification'
    const emailOptions = {
      to: [email],
      from: operatorDetails.onboardingEmailSender,
      bcc: [''],
      subject: `${operatorDetails.name} | verification code`,
    }
    await this.mailerService.sendMail(emailOptions, templateName, replacements)
    const verificationRecord: Verification = { user: id, code: verificationCode }
    const verificationExist = await getEmailVerificationBy({ user: id })
    if (verificationExist) {
      await this.emailVerificationRepository.update(user.id, { code: verificationCode })
    } else {
      await this.emailVerificationRepository.insert(verificationRecord)
    }
    const isAdmin = await this.adminService.checkAdmin(id)
    return {
      message: 'verification code send successfully',
      isAdmin: isAdmin,
    }
    return {
      message: 'verification code send successfully',
    }
  }

  //INERNAL
  async generateToken(id: string, email: string, operatorId: number): Promise<string> {
    const payload: JwtPayload = { id, email, operatorId }
    const token = await this.jwtService.sign(payload)
    return token
  }

  async getUserList(): Promise<any> {
    const data = await getUserList()
    return data
  }

  async facebookSignIn({ accessToken }: AccessTokenDto, operatorId: number): Promise<any> {
    try {
      this.logger.log('')
      const operatorExist = await getOperatorBy({ id: operatorId })
      if (!operatorExist) throw new BadRequestException('Invalid operator')
      const url = `${this.configService.get('FACEBOOK_URL')}/me?fields=id,name,email&access_token=${accessToken}`
      const { data: fbResponse } = await this.http.get(url).toPromise()
      this.logger.log('fbResponse', fbResponse)
      if (!fbResponse) throw new BadRequestException('Invalid fb token')
      if (!fbResponse.email) throw new BadRequestException('Email not found')
      this.logger.log('fbResponse email', fbResponse.email)
      await this.registerOnAppBackend(fbResponse.email)
      const id = uuid()
      const existingUser = await getUserBy({ email: fbResponse.email })
      this.logger.log('existingUser', JSON.stringify(existingUser))
      if (!existingUser) {
        this.logger.log('user doesnot exist')
        const username = await this.getUsername(fbResponse.email)
        const obj: User = {
          id,
          name: fbResponse.name,
          username,
          fbId: fbResponse.id,
          email: fbResponse.email,
          currentOperatorId: operatorId,
          emailVerified: true,
        }
        this.logger.log('info to save', JSON.stringify(obj))
        await this.userRepository.insert(obj)
      } else if (existingUser.fbId != fbResponse.id) {
        this.logger.log('user exist but fb id not match')
        const updatedInfo = {
          name: fbResponse.name,
          fbId: fbResponse.id,
          email: fbResponse.email,
          currentOperatorId: operatorId,
        }
        this.logger.log('info to update', JSON.stringify(updatedInfo))
        await this.userRepository.update(existingUser.id, updatedInfo)
      } else {
        this.logger.log('everything is same', existingUser.id)
        await this.userRepository.update(existingUser.id, { currentOperatorId: operatorId })
      }
      const user = await getUserBy({ email: fbResponse.email })
      const token = await this.generateToken(user.id, user.email, operatorId)
      const externalToken = await this.getOwensAppToken(token)

      return { token, username: user.username, email: user.email, code: 200, externalToken }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async instaSignIn({ id, username }: InstaSignInDto, operatorId: number): Promise<any> {
    try {
      // const email = username + '@instagram.com'
      const email = id + '@instagram.com'
      const userId = uuid()
      const existingUser = await getUserBy({ instaId: id })
      if (!existingUser) {
        const usernameVal = await this.getUsername(email)
        const obj: User = {
          id: userId,
          name: username,
          username: usernameVal,
          instaId: id,
          email: email,
          currentOperatorId: operatorId,
          emailVerified: true,
        }
        await this.userRepository.insert(obj)
      } else {
        await this.userRepository.update(existingUser.id, { currentOperatorId: operatorId })
      }
      const user = await getUserBy({ instaId: id })
      await this.registerOnAppBackend(user.email)
      const token = await this.generateToken(user.id, user.email, operatorId)
      return { token, username: user.username, code: 200 }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async owensAppSignin({ accessToken }: AccessTokenDto): Promise<any> {
    try {
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/user/userdetail?apiKey=${apiKey}&token=${accessToken}`
      const { data: result } = await this.http.get(url, { headers: {} }).toPromise()
      if (!result) throw new BadRequestException('Invalid access token')
      const id = uuid()
      const existingUser = await getUserBy({ email: result.email })
      const owensOperatorId = 1
      if (!existingUser) {
        const username = await this.getUsername(result.email)
        const obj: User = {
          id,
          name: '',
          username,
          fbId: '',
          email: result.email,
          currentOperatorId: owensOperatorId,
          emailVerified: true,
        }
        await this.userRepository.insert(obj)
      } else {
        await this.userRepository.update(existingUser.id, { currentOperatorId: owensOperatorId })
      }
      const user = await getUserBy({ email: result.email })
      const token = await this.generateToken(user.id, user.email, owensOperatorId)
      const externalToken = await this.getOwensAppToken(token)
      return { token, username: user.username, email: user.email, code: 200, externalToken }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async thirdPartyLogin({ externalToken, clientId, operatorId }: ThirdPartyLoginDto): Promise<any> {
    try {
      let userDetails: any
      if (clientId == ClientsEnum.Metaverse) {
        userDetails = await this.metaverseLogin(externalToken)
      }
      if (clientId == ClientsEnum.OwensApp) {
        userDetails = await this.owensAppLogin(externalToken)
      }

      if (!userDetails) throw new BadRequestException('Invalid token')
      if (!userDetails.email) throw new BadRequestException('email not found')

      const id = uuid()
      const existingUser = await getUserBy({ email: userDetails.email })
      if (!existingUser) {
        const username = await this.getUsername(userDetails.email)
        const obj: User = {
          id,
          name: '',
          username,
          fbId: '',
          email: userDetails.email,
          currentOperatorId: operatorId,
          emailVerified: true,
        }
        await this.userRepository.insert(obj)
      } else {
        await this.userRepository.update(existingUser.id, { currentOperatorId: operatorId })
      }
      const user = await getUserBy({ email: userDetails.email })
      const token = await this.generateToken(user.id, user.email, operatorId)
      return { message: 'Successfully logged in', externalToken, token, username: user.username, email: user.email }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async registerEthereumAddress(userId: string, { signature }: RegisterEthereumAddressDto): Promise<any> {
    try {
      //TODO: have to add this functionality
      // const decodedData = await this.smartContractService.decodeEthereumRegistrationSignature()
      const decodedData = signature
      await this.userRepository.update(userId, { ethereumAddress: decodedData.toLowerCase() })
      return { message: 'Ethereum address registered successfully' }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async metaverseLogin(externalToken: string): Promise<any> {
    try {
      //TODO: have to change once api is created on metaverse end
      // const url = `${this.configService.get('METAVERSE_BASE_URL')}/user/userdetail?token=${externalToken}`
      // const { data: result } = await this.http.get(url, { headers: {} }).toPromise()
      // if (!result) throw new BadRequestException('Invalid metaverse token')
      // return result
      return { email: 'metaverseTest@yopmail.com' }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async owensAppLogin(token: string) {
    const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
    const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/user/userdetail?apiKey=${apiKey}&token=${token}`
    const { data: result } = await this.http.get(url, { headers: {} }).toPromise()
    return result
  }

  async addWaxAccount(userId: string, { account }: WaxAccountDto) {
    const waxAccountExist = await getWaxAccountBy({ userId, account })
    if (waxAccountExist) throw new BadRequestException('Wax account already added')
    const waxAccount: WaxAccountsInterface = {
      id: uuid(),
      userId,
      account,
    }
    await this.waxAccountsRepository.insert(waxAccount)
    return { msessgae: 'Wax Account added successfully!!' }
  }

  async getWaxAccounts(userId: string) {
    try {
      const waxAccounts = await getWaxAccountsBy({ userId })
      return waxAccounts
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async processInstaCode({ accessToken }: AccessTokenDto, operatorId: number) {
    try {
      const operatorExist = await getOperatorBy({ id: operatorId })
      if (!operatorExist) throw new BadRequestException('Invalid operator')
      const resp = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        body: new URLSearchParams({
          client_id: this.configService.get('INSTA_CLIENT_ID'),
          client_secret: this.configService.get('INSTA_CLIENT_SECRET'),
          code: accessToken,
          grant_type: 'authorization_code',
          redirect_uri: this.configService.get('INSTA_REDIRECT_URL'),
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      const resText = await resp.text()
      const data = JSON.parse(resText)
      if (data.access_token && data.user_id) {
        const idAndUsername = await this.getIdAndUsername(data.access_token)
        if (idAndUsername.id && idAndUsername.username) {
          return await this.instaSignIn(idAndUsername, operatorId)
        } else return idAndUsername
      } else {
        return resText
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getTotalUsers(userId: string) {
    try {
      const isAdmin = await this.adminService.checkAdmin(userId)
      if (!isAdmin) throw new BadRequestException('only admin can call')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/user`
      const { data: result } = await this.http.get(url, { headers: {} }).toPromise()
      return {
        messgae: 'Total registered users',
        count: result.length,
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getAppUserDetail() {
    try {
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/user`
      const { data: result } = await this.http.get(url, { headers: {} }).toPromise()
      return {
        messgae: 'Total registered users',
        count: result.length,
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getIdAndUsername(accessToken: string) {
    const resp = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
    })

    const resText = await resp.text()
    const data = JSON.parse(resText)
    return data
  }

  async getUserDetailsGoogle({ accessToken }: AccessTokenDto, operatorId) {
    try {
      const details = await this.googleVerifyToken(accessToken)
      if (details.sub) {
        let email = details.sub + '@google.com'
        if (details.email) email = details.email

        const userId = uuid()
        let existingUser = await getUserBy({ email: email })
        if (!existingUser) existingUser = await getUserBy({ googleId: details.sub })
        if (!existingUser) {
          const usernameVal = await this.getUsername(email)
          const obj: User = {
            id: userId,
            name: details.name,
            username: usernameVal,
            googleId: details.sub,
            email: email,
            currentOperatorId: operatorId,
            emailVerified: true,
          }
          await this.userRepository.insert(obj)
        } else {
          await this.userRepository.update(existingUser.id, { currentOperatorId: operatorId, googleId: details.sub, emailVerified: true })
        }
        const user = await getUserBy({ googleId: details.sub })
        await this.registerOnAppBackend(user.email)
        const token = await this.generateToken(user.id, user.email, operatorId)
        const externalToken = await this.getOwensAppToken(token)
        return { token, username: user.username, code: 200, externalToken }
      }
    } catch (err) {
      this.logger.log(err)
      throw new BadRequestException(err.message)
    }
  }

  async googleVerifyToken(token) {
    try {
      const client = new OAuth2Client(this.configService.get('GOOGLE_AUTH_CLIENT_ID'))
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: this.configService.get('GOOGLE_AUTH_CLIENT_ID'), // Specify the CLIENT_ID of the app that accesses the backend
      })
      const payload = ticket.getPayload()
      this.logger.log('google payload response ', JSON.stringify(payload))
      return payload
    } catch (err) {
      this.logger.log('googleVerifyToken err ', err)
      throw new BadRequestException(err.message)
    }
  }

  async registerOnAppBackend(email: string) {
    try {
      const apiKey = this.configService.get('OWENS_MARKETPLACE_API_KEY')
      const url = `${this.configService.get('OWENS_MARKETPLACE_BASE_API')}/user/wallet?apiKey=${apiKey}&email=${email}`
      await this.http.get(url, { headers: {} }).toPromise()
    } catch (err) {
      throw new BadRequestException(err)
    }
  }
}
