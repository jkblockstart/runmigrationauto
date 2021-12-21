import { CreatedModified } from '../../helpers'
import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm'
import { Bid, ContactUsInterface, OperatorsInterface, WithdrawLimitInterface } from './admin.interface'

@Entity()
export class ContactUs extends CreatedModified implements ContactUsInterface {
  @PrimaryColumn()
  id: string

  @Column({ nullable: true })
  email: string

  @Column({ nullable: true })
  subject: string

  @Column({ nullable: true })
  message: string

  @Column({ default: 1 })
  requestType: number
}

@Entity()
export class AdminBids extends CreatedModified implements Bid {
  @PrimaryColumn()
  id: string

  @Column({ nullable: true })
  username: string

  @Column({ nullable: true })
  amount: string

  @Column({ nullable: true })
  bidSource: number

  @Column({ nullable: true })
  txnHash: string

  @Column({ nullable: true })
  status: number

  @Column({ nullable: true })
  message: string
}

@Entity()
export class Operators extends CreatedModified implements OperatorsInterface {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: true })
  onboardingEmailSender: string

  @Column({ nullable: true })
  name: string

  @Column({ nullable: true })
  email: string

  @Column({ nullable: true })
  addedBy: string
}

@Entity()
export class WithdrawLimit extends CreatedModified implements WithdrawLimitInterface {
  @PrimaryColumn()
  id: string

  @Column({ default: '350 USD' })
  nonKYCPerTransLimit: string

  @Column({ default: '10000 USD' })
  withdrawKYCLimit: string

  @Column({ nullable: true })
  weeklyWithdrawLimit: string

  @Column({ nullable: true })
  dailyWithdrawLimit: string

  @Column({ nullable: true })
  monthlyWithdrawLimit: string
}
