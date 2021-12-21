import { EntityRepository, Repository } from 'typeorm'
import { AdminRegistration } from './smart-contract.entity'

@EntityRepository(AdminRegistration)
export class AdminRegistrationRepository extends Repository<AdminRegistration> {}
