import { Injectable } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import * as AWS from 'aws-sdk'
import { ConfigService } from 'shared/services/config.service'
import * as handlebars from 'handlebars'
import { promises as fs } from 'fs'
import { EmailOptions } from './mailer.interface'
@Injectable()
export class MailerService {
  private transporter
  constructor(public readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      SES: new AWS.SES({
        accessKeyId: this.configService.get('ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('SECRET_ACCESS_KEY'),
        region: this.configService.get('REGION'),
      }),
    })
  }

  getTransporter() {
    return this.transporter
  }

  async sendMail(emailOptions: EmailOptions, templateName: string, templateReplacement) {
    const html = await (await fs.readFile(__dirname + `/../../../templates/${templateName}.html`)).toString()
    const template = handlebars.compile(html)
    const htmlToSend = template(templateReplacement)
    await this.transporter.sendMail({
      to: emailOptions.to,
      from: emailOptions.from,
      bcc: emailOptions.bcc,
      subject: emailOptions.subject,
      html: htmlToSend,
    })
  }
}
