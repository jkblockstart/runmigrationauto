import { BadRequestException, HttpService, Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { ConfigService } from 'shared/services/config.service'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3 = require('web3')
import * as abi from './abi.json'
import { Transaction as TX } from 'ethereumjs-tx'
import { AdminRegistration, Txn, TxnEnum } from 'modules/admin/admin.interface'
import { AddressDto } from './smart-contract.dto'
import { getUserBy } from 'modules/user/user.repository'
import { uuid } from 'uuidv4'
import { AdminRegistrationRepository } from './smart-contract.repository'
import { Api, JsonRpc } from 'eosjs'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig'
import { BuyTemplateConfiguration, SaleConfiguration, SaleEndConfiguration, SaleQueueConfiguration } from 'modules/sale/sale.interface'
import * as fetch from 'node-fetch'
import {
  EnableTemplateConfiguration,
  NewCollectionConfiguration,
  NewSchemaConfiguration,
  NewTemplateConfiguration,
} from 'modules/owens-marketplace/owens-marketplace.interface'
import { ReadValueConfiguration } from './smart-contract.interface'
import { ChallengeParticipationConfiguration, CreateChallengeConfiguration } from 'modules/challenge/challenge.interface'
import { Constants } from 'helpers'
@Injectable()
export class SmartContractService {
  logger: Logger
  constructor(
    public readonly configService: ConfigService,
    public readonly adminRegistrationRepository: AdminRegistrationRepository,
    private readonly http: HttpService
  ) {
    this.logger = new Logger()
  }

  async placeBid(username: string, amount: string): Promise<any> {
    try {
      const contract = this.getContract(abi.auction, this.configService.get('AUCTION_CONTRACT'))
      const data = await contract.methods.placeBidAdmin(amount, username).encodeABI()
      const txnDetails: Txn = await this.transact(data, 0, this.configService.get('AUCTION_CONTRACT'))
      return txnDetails
    } catch (err) {
      return {
        txnHash: '',
        status: TxnEnum.reverted,
        message: err,
      }
    }
  }

  async registerAddressInternal(userId: string, { address }: AddressDto): Promise<any> {
    try {
      const id = uuid()
      const user = await getUserBy({ id: userId })
      const userExistingBid = await this.getUserBid(user.username)
      const minimumBid = await this.getMinimumBid()
      if (userExistingBid < minimumBid) throw new BadRequestException('Cannot register without bidding')
      const usersCurrentPrimaryAddress = await this.getPrimaryAddress(user.username)
      if (usersCurrentPrimaryAddress != '') throw new BadRequestException('Already registered')
      const contract = this.getContract(abi.auction, this.configService.get('AUCTION_CONTRACT'))
      const data = await contract.methods.setPrimaryAddress(user.username, address).encodeABI()
      const txnDetails: Txn = await this.transact(data, 0, this.configService.get('AUCTION_CONTRACT'))
      const adminRegistration: AdminRegistration = {
        id,
        username: user.username,
        txnHash: txnDetails.txnHash,
        status: txnDetails.status,
        message: txnDetails.message,
      }
      await this.adminRegistrationRepository.insert(adminRegistration)
      return txnDetails
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  getContract(contractAbi: any, contractAddress: string) {
    const web3 = this.getweb3Initiated()
    return new web3.eth.Contract(contractAbi, contractAddress)
  }

  getweb3Initiated() {
    return new Web3(new Web3.providers.HttpProvider(this.configService.get('NODE_URL')))
  }

  async transact(data: string, value: number, assetCon: string): Promise<Txn> {
    try {
      const privateKey = Buffer.from(this.configService.get('ETHEREUM_ADMIN_PRIVATE_KEY'), 'hex')
      const web3 = this.getweb3Initiated()
      const count = await web3.eth.getTransactionCount(this.configService.get('ETHEREUM_ADMIN_PUBLIC_KEY'))
      const gasPrice = await this.getGasPrice()
      const txData = {
        nonce: web3.utils.toHex(count),
        gasLimit: parseInt(this.configService.get('GAS_LIMIT')),
        gasPrice: gasPrice,
        to: assetCon,
        from: this.configService.get('ETHEREUM_ADMIN_PUBLIC_KEY'),
        data: data,
        value: value,
      }
      const transaction = new TX(txData, { chain: this.configService.get('CHAIN'), hardfork: 'petersburg' })
      transaction.sign(privateKey)
      const serialisedTransaction = transaction.serialize().toString('hex')
      const transactionDetail = await web3.eth.sendSignedTransaction('0x' + serialisedTransaction)
      return {
        txnHash: transactionDetail.blockHash,
        status: TxnEnum.successful,
        message: 'Successful',
      }
    } catch (error) {
      if (error.receipt.blockHash) {
        return {
          txnHash: error.receipt.blockHash,
          status: TxnEnum.reverted,
          message: error,
        }
      } else {
        throw new Error(error)
      }
    }
  }

  async getTopBidders(): Promise<any[]> {
    try {
      const contract = this.getContract(abi.auction, this.configService.get('AUCTION_CONTRACT'))
      const data = await contract.methods.getTopBidders().call()
      const precision = await contract.methods.PRECISION().call()
      const structuredData = []
      for (const user of data) {
        if (user.userName != undefined && user.bid > 0) {
          const userDetails = await getUserBy({ username: user.userName })
          const primaryAddress = await this.getPrimaryAddress(user.userName)
          const bidAmount = BigInt(user.bid) / BigInt(precision)
          structuredData.push({
            username: user.userName,
            bid: bidAmount.toString(),
            email: userDetails.email || '',
            primaryAddress,
          })
        }
      }
      return structuredData
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getUserBid(username: string): Promise<number> {
    try {
      const contract = this.getContract(abi.auction, this.configService.get('AUCTION_CONTRACT'))
      const userBid = await contract.methods.deposits(username).call()
      const precision = await contract.methods.PRECISION().call()
      return userBid / precision
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getGasPrice(): Promise<number> {
    try {
      const web3 = this.getweb3Initiated()
      const onChainGasPrice = parseInt(await web3.eth.getGasPrice())
      const maxGasPrice = parseInt(this.configService.get('GAS_PRICE'))
      if (onChainGasPrice > maxGasPrice) {
        return maxGasPrice
      } else {
        return onChainGasPrice
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getMinimumBid(): Promise<number> {
    try {
      const contract = this.getContract(abi.auction, this.configService.get('AUCTION_CONTRACT'))
      const minimumBid = await contract.methods.minimumBid().call()
      const precision = await contract.methods.PRECISION().call()
      return minimumBid / precision
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getAuctionEndTime(): Promise<string> {
    try {
      const contract = this.getContract(abi.auction, this.configService.get('AUCTION_CONTRACT'))
      const data = await contract.methods.endTime().call()
      return new Date(data * 1000).toString()
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async auctionStarted(): Promise<boolean> {
    try {
      const currentDateTime = new Date()
      const contract = this.getContract(abi.auction, this.configService.get('AUCTION_CONTRACT'))
      let contractStartTime = await contract.methods.startTime().call()
      contractStartTime = new Date(contractStartTime * 1000)
      return currentDateTime > contractStartTime
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async auctionOver(): Promise<boolean> {
    try {
      const currentDateTime = new Date()
      const contract = this.getContract(abi.auction, this.configService.get('AUCTION_CONTRACT'))
      let contractEndTime = await contract.methods.endTime().call()
      contractEndTime = new Date(contractEndTime * 1000)
      return currentDateTime > contractEndTime
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getPrimaryAddress(username: string): Promise<string> {
    try {
      let primaryAddress = ''
      const auctionContract = this.configService.get('AUCTION_CONTRACT')
      if (auctionContract == '' || auctionContract == undefined) {
        return primaryAddress
      }
      const contract = this.getContract(abi.auction, auctionContract)
      if (username && username != '') {
        primaryAddress = await contract.methods.primaryAddress(username).call()
      }
      if (primaryAddress == Constants.ZeroAddress) {
        primaryAddress = ''
      }
      return primaryAddress
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  // async configureEthereumSale(assetCon: string, saleId: number, totalNFT: number, mintOnBuy: boolean): Promise<any> {
  //   try {
  //     const contract = this.getContract(abi.nft, assetCon)
  //     const data = await contract.methods.addNewSale(saleId, totalNFT, mintOnBuy).encodeABI()
  //     const txnDetails: Txn = await this.transact(data, 0, assetCon)
  //     return {
  //       txnId: txnDetails.txnHash,
  //       txnStatus: true,
  //       txnMessage: txnDetails.message,
  //     }
  //   } catch (err) {
  //     return {
  //       txnId: '',
  //       txnStatus: false,
  //       txnMessage: err,
  //     }
  //   }
  // }

  async mintEthereumAsset(assetCon: string, assetId: number): Promise<any> {
    try {
      const contract = this.getContract(abi.nft, assetCon)
      const data = await contract.methods.mint(assetId, this.configService.get('ETHEREUM_ADMIN_PUBLIC_KEY')).encodeABI()
      const txnDetails: Txn = await this.transact(data, 0, assetCon)
      return {
        txnId: txnDetails.txnHash,
        txnStatus: true,
        txnMessage: txnDetails.message,
      }
    } catch (err) {
      return {
        txnId: '',
        txnStatus: false,
        txnMessage: err,
      }
    }
  }

  // async getSaleEthereumOnChainData(saleId: number, assetCon: string): Promise<any> {
  //   try {
  //     const contract = this.getContract(abi.nft, assetCon)
  //     const saleConfiguration = await contract.methods.saleConfigurations(saleId).call()
  //     return saleConfiguration
  //   } catch (err) {
  //     throw new BadRequestException(err.message)
  //   }
  // }

  async checkEthereumAsset(assetCon: string, assetId: number): Promise<any> {
    try {
      const contract = this.getContract(abi.nft, assetCon)
      const owner = await contract.methods.ownerOf(assetId).call()
      if (owner == Constants.ZeroAddress) return false
      else return true
    } catch (err) {
      return false
    }
  }

  async registerNewSale(saleConfiguration: SaleConfiguration): Promise<any> {
    try {
      const action = 'newsale'
      const waxContract = this.configService.get('WAX_SALE_CONTRACT')
      const result = await this.waxTransact(action, saleConfiguration, waxContract)
      return {
        txnStatus: true,
        txnMessage: `successfully configured on blockchain with status ${result.processed.receipt.status}`,
        txnId: result.transaction_id,
      }
    } catch (err) {
      return {
        txnStatus: false,
        txnMessage: err.message,
        txnId: '',
      }
    }
  }

  async updateSaleEndTime(saleEndConfiguration: SaleEndConfiguration): Promise<any> {
    try {
      const action = 'updatesale'
      const waxContract = this.configService.get('WAX_SALE_CONTRACT')
      const result = await this.waxTransact(action, saleEndConfiguration, waxContract)
      return {
        txnStatus: true,
        txnMessage: `successfully updated end time on blockchain with status ${result.processed.receipt.status}`,
        txnId: result.transaction_id,
      }
    } catch (err) {
      return {
        txnStatus: false,
        txnMessage: err.message,
        txnId: '',
      }
    }
  }

  async createChallenge(createChallengeConfiguration: CreateChallengeConfiguration): Promise<any> {
    try {
      const action = 'require'
      const waxContract = this.configService.get('WAX_CHALLENGE_CONTRACT')
      const result = await this.waxTransact(action, createChallengeConfiguration, waxContract)
      return {
        txnStatus: true,
        txnMessage: `successfully created challenge with status ${result.processed.receipt.status}`,
        txnId: result.transaction_id,
      }
    } catch (err) {
      return {
        txnStatus: false,
        txnMessage: err.message,
        txnId: '',
      }
    }
  }

  async challengeParticipation(challengeParticipationConfiguration: ChallengeParticipationConfiguration): Promise<any> {
    try {
      const action = 'proxyclaim'
      const waxContract = this.configService.get('WAX_CHALLENGE_CONTRACT')
      const result = await this.waxTransact(action, challengeParticipationConfiguration, waxContract)
      return {
        txnStatus: true,
        txnMessage: `successfully participated with status ${result.processed.receipt.status}`,
        txnId: result.transaction_id,
      }
    } catch (err) {
      return {
        txnStatus: false,
        txnMessage: err.message,
        txnId: '',
      }
    }
  }

  async enableTemplate(enableTemplateConfiguration: EnableTemplateConfiguration): Promise<any> {
    try {
      const action = 'enableunpack'
      const waxContract = 'unbox.owens'
      const result = await this.waxTransact(action, enableTemplateConfiguration, waxContract)
      return {
        txnStatus: true,
        txnMessage: `successfully enabled`,
        txnId: result.transaction_id,
      }
    } catch (err) {
      return {
        txnStatus: false,
        txnMessage: err.message,
        txnId: '',
      }
    }
  }

  async configureSaleQueue(saleQueueConfiguration: SaleQueueConfiguration): Promise<any> {
    try {
      const action = 'addqueue'
      const waxContract = this.configService.get('WAX_SALE_CONTRACT')
      const result = await this.waxTransact(action, saleQueueConfiguration, waxContract)
      return {
        txnStatus: true,
        txnMessage: `successfully configured on blockchain with status ${result.processed.receipt.status}`,
        txnId: result.transaction_id,
      }
    } catch (err) {
      return {
        txnStatus: false,
        txnMessage: err.message,
        txnId: '',
      }
    }
  }

  async buyTemplate(buyTemplateConfiguration: BuyTemplateConfiguration): Promise<any> {
    try {
      const action = 'proxypay'
      const waxContract = this.configService.get('WAX_SALE_CONTRACT')
      const result = await this.waxTransact(action, buyTemplateConfiguration, waxContract)
      return {
        txnStatus: true,
        txnMessage: `successfully configured on blockchain with status ${result.processed.receipt.status}`,
        txnId: result.transaction_id,
      }
    } catch (err) {
      return {
        txnStatus: false,
        txnMessage: err.message,
        txnId: '',
      }
    }
  }

  async addNewCollection(newCollectionConfiguration: NewCollectionConfiguration): Promise<any> {
    try {
      const action = 'createcol'
      const waxContract = 'atomicassets'
      const result = await this.waxTransact(action, newCollectionConfiguration, waxContract)
      return {
        txnStatus: true,
        txnMessage: `successfully configured on blockchain with status ${result.processed.receipt.status}`,
        txnId: result.transaction_id,
      }
    } catch (err) {
      return {
        txnStatus: false,
        txnMessage: err.message,
        txnId: '',
      }
    }
  }

  async addNewSchema(newSchemaConfiguration: NewSchemaConfiguration): Promise<any> {
    try {
      const action = 'createschema'
      const waxContract = 'atomicassets'
      const result = await this.waxTransact(action, newSchemaConfiguration, waxContract)
      return {
        txnStatus: true,
        txnMessage: `successfully configured on blockchain with status ${result.processed.receipt.status}`,
        txnId: result.transaction_id,
      }
    } catch (err) {
      return {
        txnStatus: false,
        txnMessage: err.message,
        txnId: '',
      }
    }
  }

  async addNewTemplate(newTemplateConfiguration: NewTemplateConfiguration): Promise<any> {
    try {
      const action = 'createtempl'
      const waxContract = 'atomicassets'
      const result = await this.waxTransact(action, newTemplateConfiguration, waxContract)
      return {
        txnStatus: true,
        txnMessage: `successfully configured on blockchain with status ${result.processed.receipt.status}`,
        txnId: result.transaction_id,
      }
    } catch (err) {
      return {
        txnStatus: false,
        txnMessage: err.message,
        txnId: '',
      }
    }
  }

  async getAssetTemplateDetails(assetId: number): Promise<any> {
    try {
      const configuration: ReadValueConfiguration = {
        json: true,
        code: 'atomicassets',
        scope: 'add.owens',
        table: 'assets',
        upper_bound: assetId.toString(),
        lower_bound: assetId.toString(),
        limit: 1,
      }
      const result = await this.readValues(configuration)
      this.logger.log('assetTemplaceSmart', JSON.stringify(result))
      return result.rows
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getTemplateId(collection: string): Promise<any> {
    try {
      const configuration: ReadValueConfiguration = {
        json: true,
        code: 'atomicassets',
        scope: collection,
        table: 'templates',
        limit: 1,
        reverse: true,
      }
      const result = await this.readValues(configuration)
      this.logger.log('result', JSON.stringify(result))
      this.logger.log('result', JSON.stringify(result.rows))
      return result.rows
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getAssetAvailiabilityDetails(packScope: string): Promise<any> {
    try {
      const configuration: ReadValueConfiguration = {
        json: true,
        code: 'unbox.owens',
        scope: 'unbox.owens',
        table: 'stats',
        upper_bound: packScope,
        lower_bound: packScope,
        limit: 1,
      }
      const result = await this.readValues(configuration)
      return result.rows
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getAssetDetails(templateId: string): Promise<any> {
    try {
      const configuration: ReadValueConfiguration = {
        json: true,
        code: 'unbox.owens',
        scope: 'unbox.owens',
        table: 'rules',
        upper_bound: templateId,
        lower_bound: templateId,
        limit: 1,
      }
      const result = await this.readValues(configuration)
      return result.rows
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }
  async getPendingAssets(): Promise<any> {
    try {
      const configuration: ReadValueConfiguration = {
        json: true,
        code: 'add.owens',
        scope: 'add.owens',
        table: 'deposits2',
        index_position: 5,
        key_type: 'i64',
        upper_bound: '0',
        limit: 100,
        reverse: false,
      }

      const result = await this.readValues(configuration)
      return { data: result.rows, message: 'minted asset Ids  fetched' }
    } catch (err) {
      return { result: {}, message: err.message }
    }
  }

  async getMintedAssetId(assetId: number): Promise<any> {
    try {
      const configuration: ReadValueConfiguration = {
        code: 'unbox.owens',
        scope: 'unbox.owens',
        table: 'usercard',
        lower_bound: assetId.toString(),
        upper_bound: assetId.toString(),
        json: true,
        limit: 1,
      }

      const result = await this.readValues(configuration)
      return { data: result.rows, message: 'minted asset Ids  fetched' }
    } catch (err) {
      return { result: {}, message: err.message }
    }
  }
  /****WAX RELATED FUNCTION****/
  async waxTransact(action: string, actionData: any, contract: string): Promise<any> {
    try {
      const waxEndPoint = this.configService.get('WAX_ENDPOINT')
      const adminPrivateKey = this.configService.get('WAX_ADMIN_PRIVATE_KEY')
      const actor = this.configService.get('WAX_ADMIN_ACCOUNT')
      const api = new Api({
        rpc: new JsonRpc(waxEndPoint, { fetch }),
        signatureProvider: new JsSignatureProvider([adminPrivateKey]),
        textDecoder: new TextDecoder(),
        textEncoder: new TextEncoder(),
      })
      return await api.transact(
        {
          actions: [
            {
              account: contract,
              name: action,
              authorization: [
                {
                  actor: actor,
                  permission: 'active',
                },
              ],
              data: actionData,
            },
          ],
        },
        {
          blocksBehind: 3,
          expireSeconds: 50,
        }
      )
    } catch (error) {
      throw new Error(error)
    }
  }

  async readValues(configuration: ReadValueConfiguration): Promise<any> {
    try {
      const waxEndPoint = this.configService.get('WAX_ENDPOINT')
      const adminPrivateKey = this.configService.get('WAX_ADMIN_PRIVATE_KEY')
      const api = new Api({
        rpc: new JsonRpc(waxEndPoint, { fetch }),
        signatureProvider: new JsSignatureProvider([adminPrivateKey]),
        textDecoder: new TextDecoder(),
        textEncoder: new TextEncoder(),
      })
      const data = await api.rpc.get_table_rows(configuration)
      return data
    } catch (error) {
      throw new Error(error)
    }
  }

  async transferToken(): Promise<any> {
    try {
      const action = 'transfer'
      const contract = 'eosio.token'
      const actionData = {
        from: 'shubham12345',
        to: 'shubham54321',
        quantity: '1.00000000 WAX',
        memo: 'test',
      }
      const data = await this.waxTransact(action, actionData, contract)
      return data
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  async getEthereumAssets(address: string): Promise<any> {
    try {
      address = address.toLowerCase()
      const baseURL = this.configService.get('ETHERSCAN_BASE_API')
      const apiKey = this.configService.get('ETHERSCAN_API_KEY')
      const url = `${baseURL}/api?module=account&action=tokennfttx&address=${address}&page=1&offset=1000&sort=asc&apikey=${apiKey}`
      this.logger.log('url', url)

      const { data: transfers } = await this.http.get(url, { headers: {} }).toPromise()
      const transferTransactions = transfers.result
      const assetCons = {}
      const allAssets = []
      for (const txn of transferTransactions) {
        if (txn.to.toLowerCase() === address) {
          if (txn.contractAddress in assetCons) {
            if (assetCons[txn.contractAddress].indexOf(txn.tokenID) < 0) {
              assetCons[txn.contractAddress].push(txn.tokenID)
            }
          } else {
            assetCons[txn.contractAddress] = [txn.tokenID]
          }
          allAssets.push({
            assetCon: txn.contractAddress,
            assetId: txn.tokenID,
          })
        }
      }

      const assetOwnerCalls = []
      for (const asset of allAssets) {
        assetOwnerCalls.push(this.checkAssetOwner(asset.assetCon, asset.assetId, address))
      }
      const allAssetsWithOwnership = await Promise.all(assetOwnerCalls)

      const metadataCalls = []
      for (const asset of allAssetsWithOwnership) {
        if (asset.isOwner) {
          metadataCalls.push(this.getMetadata(asset.assetCon, asset.assetId))
        }
      }
      const userAssets = await Promise.all(metadataCalls)

      return userAssets
    } catch (err) {
      throw new BadRequestException(err)
    }
  }

  async getUsersNFT(userId: string, assetCon: string): Promise<any> {
    try {
      assetCon = assetCon.toLowerCase()
      const userDetails = await getUserBy({ id: userId })
      if (!userDetails.ethereumAddress) throw new BadRequestException('No ethereum address linked with this address')
      const baseURL = this.configService.get('ETHERSCAN_BASE_API')
      const apiKey = this.configService.get('ETHERSCAN_API_KEY')
      const url = `${baseURL}/api?module=account&action=tokennfttx&address=${userDetails.ethereumAddress}&contractaddress=${assetCon}&page=1&offset=1000&sort=asc&apikey=${apiKey}`
      this.logger.log('url', url)

      const { data: transfers } = await this.http.get(url, { headers: {} }).toPromise()
      const transferTransactions = transfers.result
      const assetCons = {}
      const allAssets = []
      for (const txn of transferTransactions) {
        if (txn.to.toLowerCase() === userDetails.ethereumAddress) {
          if (txn.contractAddress in assetCons) {
            if (assetCons[txn.contractAddress].indexOf(txn.tokenID) < 0) {
              assetCons[txn.contractAddress].push(txn.tokenID)
              allAssets.push({
                assetCon: txn.contractAddress,
                assetId: txn.tokenID,
              })
            }
          } else {
            assetCons[txn.contractAddress] = [txn.tokenID]
            allAssets.push({
              assetCon: txn.contractAddress,
              assetId: txn.tokenID,
            })
          }
        }
      }
      this.logger.log('assetCons', JSON.stringify(allAssets))
      const assetOwnerCalls = []
      for (const asset of allAssets) {
        assetOwnerCalls.push(this.checkAssetOwner(asset.assetCon, asset.assetId, userDetails.ethereumAddress))
      }
      const allAssetsWithOwnership = await Promise.all(assetOwnerCalls)
      // this.logger.log('assetCons', JSON.stringify(allAssetsWithOwnership))
      const metadataCalls = []
      for (const asset of allAssetsWithOwnership) {
        if (asset.isOwner) {
          metadataCalls.push(this.getEthereumNFTURI(asset.assetCon, asset.assetId))
        }
      }
      const userAssets = await Promise.all(metadataCalls)

      return {
        message: 'Data fetched succesfully',
        userAddress: userDetails.ethereumAddress,
        nfts: userAssets,
      }
    } catch (err) {
      throw new BadRequestException(err)
    }
  }

  async getEthereumTokens(address: string): Promise<any> {
    try {
      address = address.toLowerCase()
      const baseURL = this.configService.get('ETHERSCAN_BASE_API')
      const apiKey = this.configService.get('ETHERSCAN_API_KEY')
      const url = `${baseURL}/api?module=account&action=tokentx&address=${address}&page=1&offset=1000&sort=asc&apikey=${apiKey}`
      this.logger.log('url', url)

      const { data: transfers } = await this.http.get(url, { headers: {} }).toPromise()
      const transferTransactions = transfers.result
      const assetCons = []
      for (const txn of transferTransactions) {
        if (txn.to.toLowerCase() === address) {
          if (assetCons.indexOf(txn.contractAddress) < 0) {
            assetCons.push(txn.contractAddress.toLowerCase())
          }
        }
      }
      const tokenBalanceCalls = []
      for (const assetCon of assetCons) {
        tokenBalanceCalls.push(this.getTokenBalance(assetCon, address))
      }
      const allTokensDetails = await Promise.all(tokenBalanceCalls)

      const filteredTokens = []
      for (const token of allTokensDetails) {
        if (token.balance > 0) {
          filteredTokens.push(token)
        }
      }
      return filteredTokens
    } catch (err) {
      throw new BadRequestException(err)
    }
  }

  async decodeEthereumRegistrationSignature(signature: string, message: string): Promise<any> {
    try {
      const web3 = this.getweb3Initiated()
      const messageHash = web3.utils.sha3(message)
      const userAddress = await web3.eth.accounts.recover(messageHash, signature, true)
      return userAddress
    } catch (err) {
      throw new BadRequestException(err)
    }
  }

  async checkAssetOwner(assetCon: string, assetId: number, address: string): Promise<any> {
    try {
      const contract = this.getContract(abi.nft, assetCon)
      const owner = await contract.methods.ownerOf(assetId).call()
      if (owner.toLowerCase() == address)
        return {
          assetCon,
          assetId,
          isOwner: true,
        }
      return {
        assetCon,
        assetId,
        isOwner: false,
      }
    } catch (err) {
      this.logger.error('owner of error', err)
      return {
        assetCon,
        assetId,
        isOwner: false,
      }
    }
  }

  async getTokenBalance(assetCon: string, address: string): Promise<any> {
    try {
      const contract = this.getContract(abi.token, assetCon)
      const tokenCalls = []
      tokenCalls.push(contract.methods.balanceOf(address).call())
      tokenCalls.push(contract.methods.name().call())
      tokenCalls.push(contract.methods.symbol().call())
      tokenCalls.push(contract.methods.decimals().call())
      const callResult = await Promise.all(tokenCalls)
      return {
        assetCon,
        balance: callResult[0],
        name: callResult[1],
        symbol: callResult[2],
        decimals: callResult[3],
      }
    } catch (err) {
      this.logger.error('owner of error', err)
      return {
        assetCon,
        balance: 0,
        name: '',
        symbol: '',
        decimals: '',
      }
    }
  }

  async getMetadata(assetCon: string, assetId: number): Promise<any> {
    try {
      const contract = this.getContract(abi.nft, assetCon)
      const tokenURI = await contract.methods.tokenURI(assetId).call()
      const { data: metadata } = await this.http.get(tokenURI, { headers: {} }).toPromise()
      return {
        assetCon,
        assetId,
        name: metadata.name,
        image: metadata.image,
      }
    } catch (err) {
      return {
        assetCon,
        assetId,
        name: '',
        image: '',
      }
    }
  }

  async getEthereumNFTURI(assetCon: string, assetId: number): Promise<any> {
    try {
      const contract = this.getContract(abi.nft, assetCon)
      const tokenURI = await contract.methods.tokenURI(assetId).call()
      return {
        assetId,
        tokenURI,
      }
    } catch (err) {
      return {
        assetId,
        tokenURI: '',
      }
    }
  }

  /****EOS RELATED FUNCTION****/

  async eosTransaction(action: string, actor: string, actionData: any, contract: string): Promise<any> {
    const api = new Api({
      rpc: new JsonRpc(this.configService.get('BASE_URI'), { fetch }),
      signatureProvider: new JsSignatureProvider([this.configService.get('PRIVATE_KEY')]),
      textDecoder: new TextDecoder(),
      textEncoder: new TextEncoder(),
    })
    const serializedTrx: any = await api.transact(
      {
        actions: [
          {
            account: contract,
            name: action,
            authorization: [
              {
                actor,
                permission: 'active',
              },
            ],
            data: actionData,
          },
        ],
      },
      {
        blocksBehind: 3, // in-block
        expireSeconds: 50, // in-block
        broadcast: false,
      }
    )

    let resp: any
    let triesCounter = 1
    while (triesCounter > 0) {
      try {
        resp = await api.pushSignedTransaction(serializedTrx)
      } catch (e) {
        this.logger.log('response', e)
        if (e.toString().includes('duplicate transaction')) {
          return resp
        } else {
          throw new InternalServerErrorException(e)
        }
      }
      triesCounter += 1
    }
  }

  // async getOpenseaNFTs(address: string): Promise<any> {
  //   try {
  //     const url = `${this.configService.get('OPENSEA_BASE_URL')}/api/v1/assets?order_direction=asc&offset=0&limit=5&owner=${address}`
  //     this.logger.log('url', url)
  //     try {
  //       const { data: wallet } = await this.http.get(url, { headers: {} }).toPromise()
  //       this.logger.log(wallet)
  //       return wallet
  //     } catch (err) {
  //       throw new BadRequestException(err)
  //     }
  //   } catch (err) {
  //     throw new BadRequestException(err)
  //   }
  // }

  async getMintCount(saleId: number): Promise<any> {
    try {
      /* const saleInfoConfiguration = {
        json: true,
        code: 'sale.owens',
        scope: 'sale.owens',
        table: 'saleinfo',
        upper_bound: saleId.toString(),
        lower_bound: saleId.toString(),
        limit: 1,
      }
      const saleInfoResult = await this.readValues(saleInfoConfiguration) */

      const saleStatConfiguration = {
        json: true,
        code: 'sale.owens',
        scope: 'sale.owens',
        table: 'salestat',
        upper_bound: saleId.toString(),
        lower_bound: saleId.toString(),
        limit: 1,
      }
      const saleStatResult = await this.readValues(saleStatConfiguration)
      return saleStatResult != undefined && saleStatResult.rows && saleStatResult.rows.length ? saleStatResult.rows[0].purchased_assets : 0
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }
}
