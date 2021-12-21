import { getManyBy, getSingleBy } from 'helpers'
import { EntityRepository, Repository, getConnection } from 'typeorm'
import { Payments, WithdrawCustomer, WithdrawRequest } from './payment.entity'

export const getPaymentBy = getSingleBy(Payments)

@EntityRepository(Payments)
export class PaymentsRepository extends Repository<Payments> {}

@EntityRepository(WithdrawCustomer)
export class WithdrawCustomerRepository extends Repository<WithdrawCustomer> {}

@EntityRepository(WithdrawRequest)
export class WithdrawRequestRepository extends Repository<WithdrawRequest> {}

export const getWithdrawRequestBy = getSingleBy(WithdrawRequest)

export const getWithdrawRequestsBy = getManyBy(WithdrawRequest)

export const getWithdrawCustomersBy = getManyBy(WithdrawCustomer)

export const getWithdrawCustomerBy = getSingleBy(WithdrawCustomer)

export async function getPayments() {
  const sql = `
        SELECT 
            "p".*,
            "users"."email"
        FROM
            "payments" as "p"
        JOIN
            "users"
        ON
            "p"."userId" = "users"."id"
        ORDER BY 
            "p"."created" desc`

  const result = await getConnection().query(sql, [])
  return result
}
