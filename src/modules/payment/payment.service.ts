import {
  Injectable,
  BadRequestException,
  NotAcceptableException,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
  ConflictException,
  forwardRef,
  Inject,
} from '@nestjs/common'
import { DwollaCustomerDto, PaymentDto, PaymentWithdrawDto, WithPersonaDto } from './payment.dto'
import { BidSourceEnum } from './../admin/admin.interface'
import {
  getPaymentBy,
  getPayments,
  getWithdrawCustomerBy,
  getWithdrawCustomersBy,
  getWithdrawRequestBy,
  getWithdrawRequestsBy,
  PaymentsRepository,
  WithdrawCustomerRepository,
  WithdrawRequestRepository,
} from './payment.repository'
import { uuid } from 'uuidv4'
import { getUserBy, UserRepository } from '../user/user.repository'
import { PaymentForEnum, PaymentInterface, PaymentStatusEnum, PaymentTypeEnum, WithdarwStatus } from './payment.interface'
import { AdminService } from 'modules/admin/admin.service'
import { ConfigService } from 'shared/services/config.service'
import { SmartContractService } from 'modules/smart-contract/smart-contract.service'
import * as dotenv from 'dotenv'
import { OwensMarketplaceService } from 'modules/owens-marketplace/owens-marketplace.service'
import { WithdrawLimitRepository } from 'modules/admin/admin.repository'
import * as fetch from 'node-fetch'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Client = require('dwolla-v2').Client
dotenv.config()
const secretKey = process.env.STRIPE_SECRET_KEY
// eslint-disable-next-line @typescript-eslint/no-var-requires
const stripe = require('stripe')(secretKey)

@Injectable()
export class PaymentService {
  logger: Logger
  constructor(
    public readonly paymentsRepository: PaymentsRepository,
    public readonly userRepository: UserRepository,
    @Inject(forwardRef(() => AdminService))
    public readonly adminService: AdminService,
    public readonly owensMarketplaceService: OwensMarketplaceService,
    public readonly configService: ConfigService,
    public readonly smartContractService: SmartContractService,
    public readonly withdrawCustomerRepository: WithdrawCustomerRepository,
    public readonly withdrawReqRepository: WithdrawRequestRepository,
    public readonly withdrawLimitRepository: WithdrawLimitRepository
  ) {
    this.logger = new Logger()
  }

  async addStripePayment(userId: string, paymentObj: PaymentDto) {
    try {
      const bidAmount = paymentObj.amount
      const user = await getUserBy({ id: userId })
      if (!user) throw new BadRequestException('User not found..')
      if (!user.emailVerified) throw new BadRequestException('Verify your email first')
      if (!user.customerId) throw new BadRequestException('customerId not found')

      const auctionStarted = await this.smartContractService.auctionStarted()
      const auctionOver = await this.smartContractService.auctionOver()
      if (!auctionStarted || auctionOver) throw new BadRequestException('No auction ongoing')

      const userExistingBid = await this.smartContractService.getUserBid(user.username)
      const minimumBid = await this.smartContractService.getMinimumBid()
      if (userExistingBid < minimumBid && parseFloat(paymentObj.amount) < minimumBid)
        throw new BadRequestException('First bid cannot be less than minimum bid')
      const paymentDetails = await this.pay(paymentObj, userId, PaymentForEnum.Bid)
      if (paymentDetails.status == PaymentStatusEnum.successful) {
        await this.adminService.placeBidInternal({
          username: user.username,
          amount: bidAmount,
          bidSource: BidSourceEnum.Stripe,
        })
      }
      return {
        message: paymentDetails.status ? 'Successful' : 'Failed',
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async pay(paymentObj: PaymentDto, userId: string, paymentFor: PaymentForEnum): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      const amount = Math.ceil((parseFloat(paymentObj.amount) * (100 + parseFloat(this.configService.get('STRIPE_FEE')))) / 100).toString()
      const finalPayment = await this.paymentOption(paymentObj, amount, user)
      this.logger.log(`FP: ${finalPayment}`)
      let stripePaymentDescription = ''
      let status = PaymentStatusEnum.failed
      if (finalPayment.status == 'succeeded') {
        stripePaymentDescription = JSON.stringify({
          stripePaymentId: finalPayment.id,
          object: finalPayment.object,
          amount: finalPayment.amount,
          amountCapturable: finalPayment.amount_capturable,
          amountReceived: finalPayment.amount_received,
          currency: finalPayment.currency,
          paymentMethod: finalPayment.payment_method,
          status: finalPayment.status,
        })
        status = PaymentStatusEnum.successful
      }
      const id = uuid()
      const payment: PaymentInterface = {
        id,
        userId,
        username: user.username,
        amount: parseFloat(amount),
        currency: paymentObj.currency,
        stripePaymentDescription,
        status,
        paymentFor,
      }
      await this.paymentsRepository.insert(payment)
      return { status, id, finalPayment, stripePaymentId: finalPayment.id }
    } catch (err) {
      this.logger.error(`HP: ${err.message}`)
      throw new BadRequestException(err.message)
    }
  }

  async holdPay(paymentObj: PaymentDto, userId: string, paymentFor: PaymentForEnum, chargeFee: number): Promise<any> {
    try {
      const user = await getUserBy({ id: userId })
      console.log('charge', chargeFee, 'ddddd', 100 + chargeFee)
      this.logger.log('my amount0', paymentObj.amount)
      const amount = Math.ceil((parseFloat(paymentObj.amount) * (100 + chargeFee)) / 100).toString()
      this.logger.log('my amount', amount)
      this.logger.log('my amount2', chargeFee.toString())
      const finalPayment = await this.holdPaymentOption(paymentObj, amount, user)
      this.logger.log(`FP: ${finalPayment}`)
      let stripePaymentDescription = ''
      let status = PaymentStatusEnum.failed
      if (finalPayment.status == 'requires_capture') {
        stripePaymentDescription = JSON.stringify({
          stripePaymentId: finalPayment.id,
          object: finalPayment.object,
          amount: finalPayment.amount,
          amountCapturable: finalPayment.amount_capturable,
          amountReceived: finalPayment.amount_received,
          currency: finalPayment.currency,
          paymentMethod: finalPayment.payment_method,
          status: finalPayment.status,
        })
        status = PaymentStatusEnum.hold
      }
      const id = uuid()
      const payment: PaymentInterface = {
        id,
        userId,
        username: user.username,
        amount: parseFloat(amount),
        currency: paymentObj.currency,
        stripePaymentDescription,
        status,
        paymentFor,
      }
      await this.paymentsRepository.insert(payment)
      return { status, id, finalPayment }
    } catch (err) {
      this.logger.error(`HP: ${err.message}`)
      throw new BadRequestException(err.message)
    }
  }

  async holdPaymentOption(paymentObj: PaymentDto, amount, user) {
    try {
      let paymentMethod = paymentObj.card
      let customer = user.customerId
      if (!paymentObj.saveCard) {
        const addAndRetriveCardDetail = await this.addAndRetriveCardDetails(user.id, paymentObj.card)
        paymentMethod = addAndRetriveCardDetail.id //'card_1IxpPCSEvciaqypxDkqGBWa4',
        customer = user.customerId ? user.customerId : addAndRetriveCardDetail.customer
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: paymentObj.currency,
        payment_method_types: [PaymentTypeEnum.card], //['card'],
        confirm: true,
        capture_method: 'manual',
        payment_method: paymentMethod, //paymentObj.card, //'card_1IxpPCSEvciaqypxDkqGBWa4',
        customer: customer, //user.customerId,
        description: paymentObj.description,
      })
      return paymentIntent
    } catch (err) {
      this.logger.error('payment option error', err)
      return err.message
    }
  }

  async addAndRetriveCardDetails(userId: string, customerSource: string) {
    try {
      const user = await getUserBy({ id: userId })
      if (!user) throw new BadRequestException('User not found..')
      if (!user.customerId) {
        const stripeRes = await this.createCustomer(userId, customerSource)
        return { id: stripeRes.default_source, customer: stripeRes.id }
      }
      const tok = await stripe.tokens.retrieve(`${customerSource}`)
      const cardFingerprint = tok.card.fingerprint
      const cardsDetail = await this.retrieveCardList(PaymentTypeEnum.all, user)
      const matchFingerPrint = cardsDetail.data.filter((res) => res.fingerprint == cardFingerprint)
      if (matchFingerPrint.length > 0) return matchFingerPrint[0]
      const customer = await stripe.customers.createSource(`${user.customerId}`, { source: customerSource })
      return customer
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async captureHoldpayment(stripePayment, customerId, saveCard) {
    try {
      const finalPayment = await stripe.paymentIntents.capture(stripePayment.finalPayment.id)
      let stripePaymentDescription = ''
      let status = PaymentStatusEnum.captureFailed
      if (finalPayment.status == 'succeeded') {
        stripePaymentDescription = JSON.stringify({
          stripePaymentId: finalPayment.id,
          object: finalPayment.object,
          amount: finalPayment.amount,
          amountCapturable: finalPayment.amount_capturable,
          amountReceived: finalPayment.amount_received,
          currency: finalPayment.currency,
          paymentMethod: finalPayment.payment_method,
          status: finalPayment.status,
        })
        status = PaymentStatusEnum.successful
      }
      const update = { status: status, stripePaymentDescription: stripePaymentDescription }
      // if (stripePaymentDescription) {
      //   update['stripePaymentDescription'] = { status: status }
      // }
      await this.paymentsRepository.update(stripePayment.id, update)
      if (!saveCard) await this.deleteCard(customerId, stripePayment.finalPayment.payment_method)
      return finalPayment
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async cancelHoldPayment(stripePayment, userId, saveCard) {
    try {
      const user = await getUserBy({ id: userId })
      const finalPayment = await stripe.paymentIntents.cancel(stripePayment.finalPayment.id)
      let stripePaymentDescription = ''
      let status = PaymentStatusEnum.cancelFailed
      if (finalPayment.status == 'canceled') {
        stripePaymentDescription = JSON.stringify({
          stripePaymentId: finalPayment.id,
          object: finalPayment.object,
          amount: finalPayment.amount,
          amountCapturable: finalPayment.amount_capturable,
          amountReceived: finalPayment.amount_received,
          currency: finalPayment.currency,
          paymentMethod: finalPayment.payment_method,
          status: finalPayment.status,
        })
        status = PaymentStatusEnum.cancel
      }
      const update = { status: status, stripePaymentDescription: stripePaymentDescription }
      // if (stripePaymentDescription) {
      //   update['stripePaymentDescription'] = { status: status }
      // }
      await this.paymentsRepository.update(stripePayment.id, update)
      if (!saveCard) await this.deleteCard(user.customerId, stripePayment.finalPayment.payment_method)
      return finalPayment
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async deleteCard(customer, card) {
    try {
      return await stripe.customers.deleteSource(customer, card)
    } catch (err) {
      this.logger.error('payment option error delete source', err)
      return err.message
    }
  }

  async paymentOption(paymentObj: PaymentDto, amount, user) {
    try {
      if (paymentObj.saveCard) {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: paymentObj.currency,
          payment_method: paymentObj.card,
          description: paymentObj.description,
          customer: user.customerId,
        })
        return await stripe.paymentIntents.confirm(paymentIntent.id, { payment_method: paymentObj.card })
      } else {
        const paymentMethod = await stripe.paymentMethods.create({
          type: 'card',
          card: {
            token: paymentObj.card, //'tok_1J2X98SEvciaqypxwrVHgZ3l',
          },
        })
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: paymentObj.currency,
          payment_method: paymentMethod.id,
          description: paymentObj.description,
        })
        return await stripe.paymentIntents.confirm(paymentIntent.id, { payment_method: paymentMethod.id })
      }
    } catch (err) {
      this.logger.error('payment option error old process', err)
      return err.message
    }
  }

  async getPaymentDetails(): Promise<any[]> {
    try {
      const paymentDetails = await getPayments()
      return paymentDetails
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async createCustomer(userId: string, customerSource: string) {
    try {
      const user = await getUserBy({ id: userId })
      if (!user) throw new BadRequestException('User not found..')
      if (user.customerId) throw new BadRequestException('customer already created..')
      const customer = await stripe.customers.create({
        email: user.email,
        source: customerSource,
      })
      await this.userRepository.update(user.id, { customerId: customer.id })
      return customer
    } catch (err) {
      throw new NotAcceptableException(err)
    }
  }

  async addCards(userId: string, customerSource: string) {
    try {
      const user = await getUserBy({ id: userId })
      if (!user) throw new BadRequestException('User not found..')
      // if (!user.customerId) return await this.createCustomer(userId, customerSource)
      if (!user.customerId) {
        const stripeRes = await this.createCustomer(userId, customerSource)
        return { id: stripeRes.default_source, customer: stripeRes.id }
      }
      const tok = await stripe.tokens.retrieve(`${customerSource}`)
      const cardFingerprint = tok.card.fingerprint
      const cardsDetail = await this.retrieveCardList(PaymentTypeEnum.all, user)
      const matchFingerPrint = cardsDetail.data.filter((res) => res.fingerprint == cardFingerprint)
      if (matchFingerPrint.length > 0) throw new BadRequestException('Card already exists on your account.')
      const customer = await stripe.customers.createSource(`${user.customerId}`, { source: customerSource })
      return customer
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async retrieveCardListValue(type: PaymentTypeEnum, userId: string) {
    try {
      const user = await getUserBy({ id: userId })
      if (!user) throw new BadRequestException('User not found..')
      if (!user.customerId) throw new BadRequestException('Customer does not exist!!!!')
      const cardsDetail = await this.retrieveCardList(type, user)
      return cardsDetail
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async retrieveCardList(type: PaymentTypeEnum, userPayment) {
    try {
      const cards = await stripe.customers.listSources(`${userPayment.customerId}`)
      if (type != PaymentTypeEnum.all) {
        cards.data = cards.data.filter((obj) => obj.object == type)
      }
      return cards
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  // async createTokenTest() {
  //   const token1 = await stripe.tokens.create({
  //     card: {
  //       number: '4242424242424242',
  //       exp_month: 3,
  //       exp_year: 2025,
  //       cvc: '395',
  //     },
  //   })
  //   return token1
  // }

  async getClientDwolla() {
    const client = new Client({
      key: this.configService.get('DWOLLA_API_KEY'),
      secret: this.configService.get('DWOLLA_API_SECRET'),
      environment: this.configService.get('DWOLLA_ENV'),
    })
    return client
  }

  async createDwollaCustomer(userId: string, dwollaCustomerDto: DwollaCustomerDto, ipAddress: string) {
    const user = await getUserBy({ id: userId })
    if (!user) throw new BadRequestException('User not found..')
    try {
      const customers = await getWithdrawCustomersBy({ userId: userId })
      if (customers.length) {
        return {
          customerId: customers[0].customerId,
          fundingSourceId: customers[0].fundingSource,
          accountNumber: customers[0].accountNumber,
          bankName: customers[0].bankName,
        }
      }
      let customerUrl: string
      try {
        const appToken = await this.getClientDwolla()
        const requestBody = {
          firstName: dwollaCustomerDto.firstName,
          lastName: dwollaCustomerDto.lastName,
          email: user.email,
          type: dwollaCustomerDto.type,
          ipAddress: ipAddress,
          businessName: dwollaCustomerDto.businessName ? dwollaCustomerDto.businessName : '',
        }

        const response = await appToken.post('customers', requestBody)
        if (!response.headers.get('location')) {
          throw new InternalServerErrorException('Error in creating customer on dwolla')
        }
        customerUrl = response.headers.get('location')
      } catch (error) {
        this.logger.error(error)
        if (error.toString().includes('A customer with the specified email already exists.')) {
          customerUrl = JSON.parse(error.message.toString())._embedded.errors[0]._links['about'].href
        } else {
          throw new InternalServerErrorException(error.message)
        }
      }

      const customerId = customerUrl.split('customers/')[1]

      if (customerUrl) {
        const requestBody = {
          routingNumber: dwollaCustomerDto.routingNumber,
          accountNumber: dwollaCustomerDto.accountNumber,
          bankAccountType: dwollaCustomerDto.bankAccountType,
          name: dwollaCustomerDto.bankName,
        }
        const appToken = await this.getClientDwolla()

        const response = await appToken.post(`${customerUrl}/funding-sources`, requestBody)
        const fundingSourceId = await response.headers.get('location').split('funding-sources/')[1]

        await this.withdrawCustomerRepository.insert({
          id: uuid(),
          firstName: dwollaCustomerDto.firstName,
          lastName: dwollaCustomerDto.lastName,
          customerId: customerId,
          userId: userId,
          totalWithdraw: '0.0000 USD',
          fundingSource: fundingSourceId,
          accountNumber: dwollaCustomerDto.accountNumber,
          bankName: dwollaCustomerDto.bankName,
        })

        return {
          customerId: customerId,
          fundingSourceId: fundingSourceId,
          accountNumber: dwollaCustomerDto.accountNumber,
          bankName: dwollaCustomerDto.bankName,
        }
      }
    } catch (err) {
      this.logger.error(err)
      throw new InternalServerErrorException(err.message)
    }
  }

  async paymentWithdraw(userId: string, paymentWithdrawDto: PaymentWithdrawDto) {
    try {
      const user = await getUserBy({ id: userId })
      if (!user) throw new BadRequestException('User not found..')
      if (user.username != paymentWithdrawDto.vaccount) {
        throw new NotAcceptableException('you can not withdraw for another vaccount!')
      }
      const customer = await getWithdrawCustomerBy({
        userId: userId,
        customerId: paymentWithdrawDto.customerId,
        fundingSource: paymentWithdrawDto.fundingSourceId,
      })

      if (!customer) {
        throw new NotFoundException('No customer or bank account found for this user')
      }

      const accountBalance = await this.owensMarketplaceService.getWalletBalance(userId)
      if (!accountBalance.length || parseFloat(accountBalance.balance) < parseFloat(paymentWithdrawDto.balance)) {
        throw new NotImplementedException('Insufficient amount in user wallet!')
      }

      /* KYC things to withdraw limit */

      // let withdrawkey = await this.configService.get('WITHDRAW_ADMIN_KEY')
      // const withdrawlimit = await this.withdrawLimitRepository.findOne({ id: withdrawkey })
      // if (customer.KYCVerified) {
      //   if (parseFloat(withdrawlimit.withdrawKYCLimit) <= parseFloat(customer.totalWithdraw)) {
      //     throw new NotImplementedException(
      //       'Exceed withdraw limit for KYC verified user! Maxium withdraw ' + withdrawlimit.withdrawKYCLimit
      //     )
      //   }
      // } else {
      //   if (parseFloat(paymentWithdrawDto.balance) >= parseFloat(withdrawlimit.nonKYCPerTransLimit)) {
      //     throw new NotImplementedException(
      //       'Exceed withdraw limit for non-KYC verified user! Withdraw only ' + withdrawlimit.nonKYCPerTransLimit + ' for per transaction!'
      //     )
      //   }
      // }
      /* ending checking */
      const getreq = await getWithdrawRequestBy({ userId: userId, status: WithdarwStatus.PENDING })
      if (getreq) {
        throw new ConflictException('Withdraw request already in progress!')
      }

      const result = await this.smartContractService.eosTransaction(
        'wdrwamount',
        this.configService.get('CONTRACT_NAME'),
        { owner: paymentWithdrawDto.vaccount, balance: `${parseFloat(paymentWithdrawDto.balance).toFixed(4)} OWENS` },
        this.configService.get('CONTRACT_NAME')
      )

      if (result && result.transaction_id) {
        const data = {
          quantity: `${parseFloat(paymentWithdrawDto.balance).toFixed(4)} OWENS`,
          memo: `${user.username} withdrawn`,
        }
        const trans = await this.smartContractService.eosTransaction(
          'retire',
          this.configService.get('TOKEN_CONTRACT'),
          data,
          this.configService.get('TOKEN_CONTRACT')
        )
        this.logger.log(trans)
        if (trans) {
          const token = await this.dwollaTransfer(
            this.configService.get('DWOLLA_ADMIN_SOURCE'),
            `${this.configService.get('DWOLLA_ENDPOINT')}/funding-sources/${customer.fundingSource}`,
            `${parseFloat(paymentWithdrawDto.balance).toFixed(4)}`,
            'USD'
          )

          // let totalbal = `${(parseFloat(customer.totalWithdraw) + parseFloat(paymentWithdrawDto.balance)).toFixed(4)} ${
          //   paymentWithdrawDto.balance.split(' ')[1]
          // }`
          // await this.withdrawCustomerRepository.update(
          //   { id: customer.id },
          //   {
          //     totalWithdraw: totalbal,
          //   }
          // )
          const id = uuid()
          await this.withdrawReqRepository.insert({
            id: id,
            userId: userId,
            transaction: token,
            status: 'pending',
            balance: parseFloat(paymentWithdrawDto.balance),
            currency: paymentWithdrawDto.balance.split(' ')[1],
            lastWithdrawAt: new Date(),
          })
          await this.owensMarketplaceService.reloadWallet(userId)
          await this.owensMarketplaceService.addWithdrawHistory(userId, token.split('transfers/')[1], 'pending', paymentWithdrawDto.balance)
          return { requestUrl: token, message: 'Withdraw request has been posted to admin', status: 'pending' }
        }
      }
    } catch (err) {
      this.logger.error(err)
      throw new InternalServerErrorException(err.message)
    }
  }

  async dwollaTransfer(from: string, to: string, amount: string, currency: string) {
    try {
      const transferRequest = {
        _links: {
          source: {
            href: from,
          },
          destination: {
            href: to,
          },
        },
        amount: {
          currency: currency,
          value: amount,
        },
      }
      const appToken = await this.getClientDwolla()

      const response = await appToken.post('transfers', transferRequest)
      const token = await response.headers.get('location')
      return token
    } catch (err) {
      throw new NotFoundException(err.message)
    }
  }

  async getWithdrawRequest(userId: string) {
    try {
      const user = await getUserBy({ id: userId })
      if (!user) throw new BadRequestException('User not found..')
      const requests = await getWithdrawRequestsBy({ userId })
      if (!requests.length) {
        return []
      }
      const tasks = []
      for (const transreq of requests) {
        tasks.push(this.getRequestStatus(transreq.id))
      }
      return await Promise.all(tasks)
    } catch (e) {
      throw new InternalServerErrorException(e.message)
    }
  }

  async getRequestStatus(reqId: string) {
    const transreq = await getWithdrawRequestBy({ id: reqId })
    try {
      const transferUrl = transreq.transaction
      const appToken = await this.getClientDwolla()
      const response = await appToken.get(transferUrl)

      if (response) {
        await this.withdrawReqRepository.update(
          { id: reqId },
          {
            status: response.body.status,
            lastWithdrawAt: new Date(),
          }
        )
        if (response.body.status == 'processed') {
          const customer = await getWithdrawCustomerBy({ userId: transreq.userId })
          if (customer) {
            const parsebal = customer.totalWithdraw ? customer.totalWithdraw : '0.0000 USD'
            const totalbal = `${parseFloat(parsebal[0]) + parseFloat(transreq.balance.toString())} ${parsebal[1]}`
            await this.withdrawCustomerRepository.update(
              { userId: transreq.userId },
              {
                totalWithdraw: totalbal,
              }
            )
          }
        }
        return await getWithdrawRequestBy({ id: reqId })
      } else {
        return transreq
      }
    } catch (err) {
      throw new NotFoundException(err.message)
    }
  }

  async getCustomers(userId: string) {
    const customers = await this.withdrawCustomerRepository.find({
      where: { userId: userId },
      order: { created: -1 },
    })
    this.logger.log(customers)
    if (customers.length) {
      return customers.map((customer) => {
        return {
          customerId: customer.customerId,
          fundingSourceId: customer.fundingSource,
          accountNumber: customer.accountNumber,
          bankName: customer.bankName,
          verifiedKYC: customer.KYCVerified,
        }
      })
    }
    return [
      {
        customerId: '',
        fundingSourceId: '',
        accountNumber: '',
        bankName: '',
        verifiedKYC: false,
      },
    ]
  }

  async statusWithdrawWebhook(req: any) {
    if (req) {
      if (req.topic == 'transfer_completed' || req.topic == 'transfer_cancelled') {
        const withdrawRequest = await getWithdrawRequestBy({ transaction: req._links.resource.href })
        if (withdrawRequest) {
          await this.getRequestStatus(withdrawRequest.id)
        }
        const updatedRequest = await getWithdrawRequestBy({ transaction: req._links.resource.href })
        this.logger.log('Webhook listen and updated!', req.topic)
        await this.owensMarketplaceService.addWithdrawHistory(
          updatedRequest.userId,
          updatedRequest.transaction.split('transfers/')[1],
          updatedRequest.status,
          `${updatedRequest.balance} ${updatedRequest.currency}`
        )
        return 'successfully updated'
      }
    }
  }

  /* withPersona KYC Part */

  async addWithPersonaKYC(userId: string, withPersonaDto: WithPersonaDto) {
    const user = await getUserBy({ id: userId })
    if (!user) throw new BadRequestException('User not found..')
    const personaApiEndpoint = this.configService.get('PERSONA_API_ENDPOINT')
    const endpoint = `${personaApiEndpoint}/${withPersonaDto.inquiryId}` //for get inquiry
    const apiKey = this.configService.get('PERSONA_API_KEY')
    const resp = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + apiKey,
        'Persona-Version': '2021-05-14',
      },
    })
    if (resp) {
      const resText = await resp.text()
      const data = JSON.parse(resText)
      this.logger.log(data)
      const status = data.data.attributes.status
      if (status == WithdarwStatus.APPROVED) {
        const customer = await getWithdrawCustomerBy({ userId: userId })
        if (customer) {
          await this.withdrawCustomerRepository.update(
            { userId: userId },
            {
              KYCVerified: true,
            }
          )
        }
      }
      return { status }
    }
  }
  // async addWebhookUrl() {
  //   let url =
  //   let secret =
  //   const requestBody = {
  //     url: ,
  //     secret: ,
  //   }
  //   const appToken = await this.getClientDwolla()
  //   const response = await appToken.post('webhook-subscriptions', requestBody)
  //   const subs = await response.headers.get('location')
  //   return subs;
  // }

  async refundUserSalePayment(paymentId: string, userId: string) {
    const result = await getPaymentBy({ id: paymentId })
    const parseResult = JSON.parse(result.stripePaymentDescription)
    if (result.isRefunded) {
      throw new BadRequestException('Payment already refunded')
    }

    await stripe.refunds.create({
      payment_intent: parseResult.stripePaymentId,
    })
    return await this.paymentsRepository.update(paymentId, { isRefunded: true, refundedBy: userId })
  }

  // async testCard() {
  //   try {
  //     const id = '42'
  //     let user = await getUserBy({ id: id })
  //     const paymentObj: PaymentDto = {
  //       amount: '101',
  //       currency: 'INR',
  //       card: 'tok_1K6FQLSEvciaqypxfOuLFX6r',
  //       description: 'this is test',
  //       saveCard: false,
  //     }
  //     console.log('ithar errr o aya beforeeeeeeeeeeee ')
  //     const finalPayment = await this.holdPaymentOption(paymentObj, paymentObj.amount, user)
  //     console.log('ithar errr o aya ---------- ')
  //     user = await getUserBy({ id: id })
  //     console.log('finalPaymentfinalPaymentfinalPaymentfinalPayment ', JSON.stringify(finalPayment))
  //     return await this.captureHoldpayment({ finalPayment: finalPayment, id: id }, user.customerId, paymentObj.saveCard)
  //     return finalPayment
  //   } catch (err) {
  //     console.log(err)
  //     console.log(err.message)
  //   }
  // }

  // async completepayment() {
  //   try {
  //     const intent = await stripe.paymentIntents.capture('pi_3K1X5xSEvciaqypx1EVO6lyz')
  //     return intent
  //   } catch (err) {
  //     throw new BadRequestException(err.message)
  //   }
  // }

  // async cancelPayment() {
  //   try {
  //     const intent = await stripe.paymentIntents.cancel('pi_3K6C8ESEvciaqypx0SoTLJ8l')
  //     return intent
  //   } catch (err) {
  //     throw new BadRequestException(err.message)
  //   }
  // }
}
