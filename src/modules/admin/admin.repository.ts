import { getSingleBy } from 'helpers'
import { EntityRepository, Repository, getConnection } from 'typeorm'
import { AdminBids, ContactUs, Operators, WithdrawLimit } from './admin.entity'

export const getOperatorBy = getSingleBy(Operators)

@EntityRepository(ContactUs)
export class ContactUsRepository extends Repository<ContactUs> {}

@EntityRepository(AdminBids)
export class AdminBidsRepository extends Repository<AdminBids> {}

@EntityRepository(Operators)
export class OperatorsRepository extends Repository<Operators> {}

@EntityRepository(WithdrawLimit)
export class WithdrawLimitRepository extends Repository<WithdrawLimit> {}

export async function getContactUsMessages(requestType, limit, skip) {
  const sql = `
      SELECT
          email, subject, message
      FROM 
          "contact_us"
      WHERE
          "requestType"=$1
      ORDER BY "contact_us"."created" DESC 
      LIMIT $2 OFFSET $3`
  const result = await getConnection().query(sql, [requestType, limit, skip])
  return result
}

export async function getData(table: string) {
  const sql = `
          SELECT 
              *
          FROM
              "${table}"
          ORDER BY
            "created" desc`

  const result = await getConnection().query(sql, [])
  return result
}
