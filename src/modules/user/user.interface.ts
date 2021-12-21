export interface User {
  id: string
  email: string
  password?: string
  emailVerified?: boolean
  username: string
  customerId?: string
  fbId?: string
  instaId?: string
  name?: string
  currentOperatorId: number
  ethereumAddress?: string
  googleId?: string
}

export interface JwtPayload {
  id: string
  email: string
  operatorId: number
}

export interface Verification {
  user: string
  code: number
}

export interface ResetPassword {
  user: string
  code: number
}

export interface WaxAccountsInterface {
  id: string
  userId: string
  account: string
}
export enum ClientsEnum {
  OwensApp = 1,
  Metaverse = 2,
}
