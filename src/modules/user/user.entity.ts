import { CreatedModified } from '../../helpers'
import { Entity, Column, PrimaryColumn } from 'typeorm'
import { ResetPassword, User, Verification, WaxAccountsInterface } from './user.interface'

@Entity()
export class Users extends CreatedModified implements User {
  @PrimaryColumn()
  id: string

  @Column({ nullable: true })
  email: string

  @Column({ default: false })
  deleted: boolean

  @Column({ default: false })
  emailVerified: boolean

  @Column({ nullable: true })
  username: string

  @Column({ nullable: true })
  name: string

  @Column({ nullable: true })
  fbId: string

  @Column({ nullable: true })
  instaId: string

  @Column({ nullable: true })
  customerId: string

  @Column({ default: 1 })
  currentOperatorId: number

  @Column({ nullable: true })
  ethereumAddress: string

  @Column({ nullable: true })
  googleId: string
}

@Entity()
export class EmailVerifications extends CreatedModified implements Verification {
  @PrimaryColumn()
  user: string

  @Column()
  code: number
}

@Entity()
export class ResetPasswords extends CreatedModified implements ResetPassword {
  @PrimaryColumn()
  user: string

  @Column()
  code: number
}

@Entity()
export class WaxAccounts extends CreatedModified implements WaxAccountsInterface {
  @PrimaryColumn()
  id: string

  @Column()
  userId: string

  @Column()
  account: string
}
