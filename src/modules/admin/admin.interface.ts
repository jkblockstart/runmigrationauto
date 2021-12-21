export enum RequestTypeEnum {
  contactUs = 1,
  press = 2,
}

export interface ContactUsInterface {
  id: string
  email: string
  subject: string
  message: string
  requestType: RequestTypeEnum
}

export interface Bid {
  id: string
  username: string
  amount: string
  bidSource: BidSourceEnum
  txnHash: string
  status: TxnEnum
  message: string
}

export enum TxnEnum {
  successful = 1,
  reverted = 2,
}

export interface Txn {
  txnHash: string
  status: TxnEnum
  message: string
}

export enum BidSourceEnum {
  Stripe = 1,
  OpenSea = 2,
}

export interface AdminRegistration {
  id: string
  username: string
  txnHash: string
  status: TxnEnum
  message: string
}

export interface OperatorsInterface {
  name: string
  onboardingEmailSender: string
  email: string
  addedBy: string
}

export interface WithdrawLimitInterface {
  id: string
  nonKYCPerTransLimit: string
  withdrawKYCLimit: string
  weeklyWithdrawLimit: string
  dailyWithdrawLimit: string
  monthlyWithdrawLimit: string
}
