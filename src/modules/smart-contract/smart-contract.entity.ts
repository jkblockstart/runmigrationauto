import { CreatedModified } from '../../helpers'
import { Entity, Column, PrimaryColumn } from 'typeorm'
import { Bid } from './../admin/admin.interface'

@Entity()
export class AdminRegistration extends CreatedModified implements Bid {
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
