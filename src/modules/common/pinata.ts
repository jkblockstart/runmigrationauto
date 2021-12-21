/* eslint-disable @typescript-eslint/no-var-requires */

import { Logger } from '@nestjs/common'

export async function pinataipfs(data1) {
  const logger: Logger = new Logger()
  try {
    const axios = require('axios')
    const fs = require('fs')
    const FormData = require('form-data')
    const path = require('path')

    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`
    //we gather a local file for this example, but any valid readStream source will work here.
    const data = new FormData()
    data.append('file', fs.createReadStream(path.join('uploads', data1)))
    //You'll need to make sure that the metadata is in the form of a JSON object that's been convered to a string
    //metadata is optional
    const metadata = JSON.stringify({
      name: data1.split('/')[1],
      keyvalues: {
        exampleKey: data1.split('/')[1],
      },
    })
    data.append('pinataMetadata', metadata)
    const res = await axios
      .post(url, data, {
        maxBodyLength: 'Infinity', //this is needed to prevent axios from erroring out with large files
        headers: {
          'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
          PINATA_API_KEY: process.env.PINATA_API_KEY,
          PINATA_SECRET_API_KEY: process.env.PINATA_SECRET_API_KEY,
        },
      })
      .catch(function (error) {
        logger.error('error ', error)
      })
    try {
      await fs.unlinkSync(path.join('uploads', data1))
    } catch (err) {
      logger.error(err)
    }
    return res.data
  } catch (err) {
    logger.error(err)
  }
}
