import { getManyBy, getSingleBy } from '../../helpers'
import { EntityRepository, getConnection, Repository } from 'typeorm'
import { EmailVerifications, ResetPasswords, Users, WaxAccounts } from './user.entity'

export const getEmailVerificationBy = getSingleBy(EmailVerifications)

export const getResetPasswordBy = getSingleBy(ResetPasswords)

export const getUserBy = getSingleBy(Users)

export const getWaxAccountBy = getSingleBy(WaxAccounts)

export const getWaxAccountsBy = getManyBy(WaxAccounts)

@EntityRepository(Users)
export class UserRepository extends Repository<Users> {}

@EntityRepository(EmailVerifications)
export class EmailVerificationRepository extends Repository<EmailVerifications> {}

@EntityRepository(ResetPasswords)
export class ResetPasswordRepository extends Repository<ResetPasswords> {}

@EntityRepository(WaxAccounts)
export class WaxAccountsRepository extends Repository<WaxAccounts> {}
export async function getUserList() {
  const sql = `
        SELECT
            "email", "created" as registration_date
        FROM 
            "users"
        ORDER BY 
            "users"."created" DESC`
  const result = await getConnection().query(sql, [])
  return result
}
