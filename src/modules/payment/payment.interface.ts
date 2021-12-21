export interface PaymentInterface {
  id: string
  userId: string
  username: string
  amount: number
  currency: string
  stripePaymentDescription: string
  status: PaymentStatusEnum
  paymentFor: PaymentForEnum
  isRefunded?: boolean
  refundedBy?: string
}

export enum PaymentStatusEnum {
  failed = 0,
  successful = 1,
  hold = 2,
  cancel = 3,
  captureFailed = 4,
  cancelFailed = 5,
}

export enum PaymentTypeEnum {
  card = 'card',
  bank_account = 'bank_account',
  all = 'all',
}

export enum PaymentForEnum {
  Bid = 0,
  OwensToken = 1,
  Collection = 2,
  Sale = 3,
}

export interface CustomerInterface {
  firstName: string
  lastName: string
  customerId: string
  userId: string
  KYCVerified: boolean
  totalWithdraw: string
  fundingSource: string
  bankName: string
  accountNumber: string
}

export interface RequestInterface {
  id: string
  userId: string
  balance: number
  currency: string
  transaction: string
  status: string
  lastWithdrawAt: Date
}

export enum WithdarwStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
}
