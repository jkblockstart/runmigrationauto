/* eslint-disable @typescript-eslint/ban-types */
import { ObjectType, EntitySchema, getRepository, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import * as https from 'https'
import { ConfigService } from './shared/services/config.service'
import { Logger } from '@nestjs/common'
import { TelegramErrorTypeEnum } from './shared/shared.interface'
import { createCipheriv, createDecipheriv } from 'crypto'
import { config } from 'process'

const configService = new ConfigService()
const logger = new Logger()

export function getSingleBy<T = any>(table: ObjectType<T> | EntitySchema<T>): (filter: Partial<T>) => Promise<T> {
  return async (filter) => {
    const record = await getRepository(table).findOne({ where: filter })
    return record
  }
}

export function getManyBy<T = any>(table: ObjectType<T> | EntitySchema<T>): (filter: Partial<T>) => Promise<T[]> {
  return async (filter) => {
    const result = await getRepository(table).find({ where: filter })
    return result
  }
}

export function capitalizeFirstLetter(str: string) {
  const words = str.split(' ')
  for (let i = 0; i < words.length; i++) {
    const j = words[i].toLocaleLowerCase().charAt(0).toUpperCase()
    words[i] = j + words[i].substr(1)
  }
  return words.join(' ')
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function decoratorBundle(validators: any[]) {
  return function () {
    return function (object: object, propertyName: string) {
      for (const validator of validators) new validator(object, propertyName)
    }
  }
}

export abstract class CreatedModified {
  @CreateDateColumn()
  created!: Date

  @UpdateDateColumn()
  modified!: Date
}

export function sendMessageToTelegram(errorType: TelegramErrorTypeEnum, message: object) {
  const TELEGRAM_TOKEN = configService.get('TELEGRAM_TOKEN')
  const TELEGRAM_API = configService.get('TELEGRAM_API')
  const formatMessage = makeMessageString(message)
  const messageToSend = `Error Type: ${errorType}\nMessage:\n${formatMessage}`

  const postData = JSON.stringify({
    chat_id: configService.get('TELEGRAM_CHAT_ID'),
    text: messageToSend,
  })

  const options = {
    method: 'POST',
    port: 443,
    hostname: `${TELEGRAM_API}`,
    path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
    headers: {
      'Content-Length': postData.length,
      'Content-Type': 'application/json',
    },
  }

  const req = https.request(options, (res) => {
    res.on('data', (d) => {
      logger.log(d)
    })
  })

  req.on('error', (e) => {
    logger.log(`Error: ${e}`)
  })

  req.write(postData)
  req.end()
}

function makeMessageString(obj: object) {
  let formattedMessage = ''
  Object.keys(obj).map((item) => {
    formattedMessage += `${item}: ${obj[item]}\n`
  })
  return formattedMessage
}

function encryptString(message: string) {
  const algorithm = configService.get('ALGORITHM')
  const initVector = configService.get('INIT_VECTOR')
  const bufferKey = Buffer.from(configService.get('ENC_DEC_KEY'), 'hex')

  const cipher = createCipheriv(algorithm, bufferKey, initVector)

  let encryptedData = cipher.update(message, 'utf-8', 'hex')
  encryptedData += cipher.final('hex')

  return encryptedData
}

function decryptString(encmessage: string) {
  const algorithm = configService.get('ALGORITHM')
  const initVector = configService.get('INIT_VECTOR')
  const bufferKey = Buffer.from(configService.get('ENC_DEC_KEY'), 'hex')

  const decipher = createDecipheriv(algorithm, bufferKey, initVector)

  let decryptedData = decipher.update(encmessage, 'hex', 'utf-8')
  decryptedData += decipher.final('utf8')

  return decryptedData
}

export enum Constants {
  ZeroAddress = '0x0000000000000000000000000000000000000000',
}
