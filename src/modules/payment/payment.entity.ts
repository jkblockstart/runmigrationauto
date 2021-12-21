import { CreatedModified } from '../../helpers'
import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm'
import { CustomerInterface, PaymentForEnum, PaymentInterface, PaymentStatusEnum, RequestInterface } from './payment.interface'

@Entity()
export class Payments extends CreatedModified implements PaymentInterface {
  @PrimaryColumn()
  id: string

  @Column({ nullable: false })
  userId: string

  @Column({ nullable: true })
  username: string

  @Column({ default: 0 })
  amount: number

  @Column({ nullable: false })
  currency: string

  @Column({ nullable: true })
  stripePaymentDescription: string

  @Column({ nullable: true })
  status: PaymentStatusEnum

  @Column({ nullable: true })
  paymentFor: PaymentForEnum

  @Column({ default: false })
  isRefunded: boolean

  @Column({ nullable: true })
  refundedBy: string
}

@Entity()
export class WithdrawCustomer extends CreatedModified implements CustomerInterface {
  @PrimaryColumn()
  id: string

  @Column()
  userId: string

  @Column()
  customerId: string

  @Column({ nullable: true })
  fundingSource: string

  @Column()
  firstName: string

  @Column()
  lastName: string

  @Column({ default: false })
  KYCVerified: boolean

  @Column({ nullable: true })
  totalWithdraw: string

  @Column()
  bankName: string

  @Column()
  accountNumber: string
}

@Entity()
export class WithdrawRequest extends CreatedModified implements RequestInterface {
  @PrimaryColumn()
  id: string

  @Column()
  userId: string

  @Column('decimal', { precision: 5, scale: 2 })
  balance: number

  @Column()
  currency: string

  @Column({ default: 'pending' })
  status: string

  @Column()
  transaction: string

  @Column({ type: 'timestamptz' })
  lastWithdrawAt: Date
}
