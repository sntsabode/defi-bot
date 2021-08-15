// eslint-disable-next-line
require('dotenv').config()
import Web3 from 'web3'
import { ONEINCH_ABIs, ZRX_ABIs } from './__abis__/abis'
import { Addresses, SupportedToken } from './addresses'
import axios from 'axios'
import BN from 'bn.js'
import { Contract } from 'web3-eth-contract'

if (!process.env.ETH_NODE_URL)
  throw panic(1, 'ETH_NODE_URL undefined')

export const web3 = new Web3(
  new Web3.providers.HttpProvider(process.env.ETH_NODE_URL)
)

if (!process.env.OWNER_ADDRESS)
  throw panic(1, 'OWNER_ADDRESS undefined')

const FLASH_AMOUNT = web3.utils.toWei('100000')
const OWNER_ADDRESS = process.env.OWNER_ADDRESS

///////////////////////////////////////////////////////////////////////////////
// bot //

// eslint-disable-next-line
const ArbContract = new web3.eth.Contract('' as any, '')

// eslint-disable-next-line
export const Bot = {
  checkArb: async (
    zrxOrder: I0xOrderBookDataRecordOrder,
    metadata: I0xOrderBookDataRecordMetadata,
    [fromToken, destToken]: [SupportedToken, SupportedToken]
  ): Promise<void> => {
    // The bot is always going to be the taker
    if (zrxOrder.makerFee !== '0') {
      console.log('Order has maker fee')
      return
    }

    const amountLeft = new BN(metadata.remainingFillableTakerAssetAmount)
    const inputAssetAmount = new BN(zrxOrder.takerAssetAmount)

    if (amountLeft.toString() !== zrxOrder.takerAssetAmount) {
      if (parseFloat(web3.utils.fromWei(
        metadata.remainingFillableTakerAssetAmount
      )) < 0.01) return
    }

    const oneInchData = await getOneInchExpectedReturn(
      fromToken, destToken, zrxOrder.makerAssetAmount
    ).catch(e => { throw e })

    const outputAssetAmount = new BN(oneInchData.returnAmount)

    const profitability = Bot.calcProfitablity(
      zrxOrder,
      inputAssetAmount,
      outputAssetAmount,
      new BN('222'), // estimate gas fees here,
      [fromToken, destToken]
    )

    if (profitability.lt(new BN(0)))
      return

    return Bot.trade(
      [fromToken, destToken],
      zrxOrder,
      oneInchData,
      inputAssetAmount.toString(),
      ArbContract
    )
  },

  trade: async (
    [fromToken, destToken]: [SupportedToken, SupportedToken],
    zrxOrder: I0xOrderBookDataRecordOrder,
    oneInchData: IOneInchExpectedReturn,
    fillAmount: string,
    ArbContract: Contract
  ): Promise<void> => {
    const data = web3.eth.abi.encodeFunctionCall(
      ZRX_ABIs.FillOrderABI, [
        <string><unknown>[
          zrxOrder.makerAddress,
          zrxOrder.takerAddress,
          zrxOrder.feeRecipientAddress ,
          zrxOrder.senderAddress ,
          zrxOrder.makerAssetAmount ,
          zrxOrder.takerAssetAmount ,
          zrxOrder.makerFee ,
          zrxOrder.takerFee ,
          zrxOrder.expirationTimeSeconds ,
          zrxOrder.salt ,
          zrxOrder.makerAssetData ,
          zrxOrder.takerAssetData ,
          zrxOrder.makerFeeAssetData ,
          zrxOrder.takerFeeAssetData
        ],
        fillAmount,
        zrxOrder.signature
      ]
    )

    // Make slippage dynamic, and subtract when calulating
    // profitabitlity '0.995'
    const minReturnWithSlippage = (new BN(oneInchData.returnAmount)
      .mul(new BN('995'))
      .div(new BN('1000'))
    ).toString()

    return ArbContract.methods.flashloan({
      amount: FLASH_AMOUNT,
      flashloanCurrency: tokenSymToAddress(fromToken),
      destCurrency: tokenSymToAddress(destToken),
      OxData: data,
      oneSplitMinReturn: minReturnWithSlippage,
      oneSplitDistribution: oneInchData.distribution,
      flags: 10
    }).send({
      from: OWNER_ADDRESS
    })
  },

  calcProfitablity: (
    zrxOrder: I0xOrderBookDataRecordOrder,
    inputAssetAmount: BN,
    outputAssetAmount: BN,
    estimatedGasFee: BN,
    [fromToken]: [SupportedToken, SupportedToken]
  ): BN => {
    const takerFeeCurrency = '0x'+zrxOrder.takerFeeAssetData.substring(34,74)

    if (takerFeeCurrency === addrs[fromToken])
      // the fee currency is usually the taker asset, i.e. it is the same currency 
      // as the other amounts in the netProfit calculation and can be subtracted 
      // as is, however additional logic is needed to handle cases where the taker
      // fee is in the maker currency, which would require converting the amount
      // to the taker currency amount before subtracting it
      return outputAssetAmount
        .sub(inputAssetAmount)
        .sub(estimatedGasFee)
        .sub(new BN(zrxOrder.takerFee))

    return outputAssetAmount
      .sub(inputAssetAmount)
      .sub(estimatedGasFee)
  },

  callOrderBookAndFindArbs: async (
    [fromToken, destToken]: [SupportedToken, SupportedToken]
  ): Promise<void[]> => fetch0xOrderBook(
    fromToken, destToken
  ).then(orderbook => Promise.all(orderbook.bids.records.map(
    order => Bot.checkArb(
      order.order,
      order.metaData,
      [fromToken, destToken]
    )
  )), e => { throw e })
}

///////////////////////////////////////////////////////////////////////////////
// 0x //

export interface I0xOrderBookDataRecordOrder {
  signature: string
  senderAddress: string
  makerAddress: string
  takerAddress: string
  makerFee: string
  takerFee: string
  makerAssetAmount: string
  takerAssetAmount: string
  makerAssetData: string
  takerAssetData: string
  salt: string
  exchangeAddress: string
  feeRecipientAddress: string
  expirationTimeSeconds: string
  makerFeeAssetData: string
  chainId: number
  takerFeeAssetData: string
}

export interface I0xOrderBookDataRecordMetadata {
  orderHash: string
  remainingFillableTakerAssetAmount: string
  createdAt: Date | string 
}

export interface I0xOrderBookDataRecord {
  order: I0xOrderBookDataRecordOrder
  metaData: I0xOrderBookDataRecordMetadata
}

export interface I0xOrderBookData {
  total: number
  page: number
  perPage: number
  records: I0xOrderBookDataRecord[]
}

export interface I0xOrderBook {
  bids: I0xOrderBookData
  asks: I0xOrderBookData
}

// The api doesn't seem to like checksummed addresses
// unless there's something I'm doing wrong
const addrs: {
  [sym in SupportedToken]: string
} = {
  USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
  SAI: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359'
}

export const fetch0xOrderBook = (
  baseAssetSymbol: SupportedToken,
  quoteAssetSymbol: SupportedToken,
  limit = 1000
): Promise<I0xOrderBook> => axios.get<I0xOrderBook>(
  `https://api.0x.org/sra/v3/orderbook?baseAssetData=0xf47261b0000000000000000000000000${
    addrs[baseAssetSymbol].substring(2,42)
  }&quoteAssetData=0xf47261b0000000000000000000000000${
    addrs[quoteAssetSymbol].substring(2,42)
  }&perPage=${limit}`
).then(res => res.data, e => { throw e })

///////////////////////////////////////////////////////////////////////////////
// oneinch //

const ONE_SPLIT_PARTS = 10
const ONE_SPLIT_FLAGS = 0

export const OneSplitContractInstance = new web3.eth.Contract(
  ONEINCH_ABIs.IOneSplitMulti, Addresses.ONEINCH.MAINNET.OneSplitAudit
)

export interface IOneInchExpectedReturn {
  returnAmount: string
  distribution: string[]
  '0': string
  '1': string[]
}
/***/
export async function getOneInchExpectedReturn(
  fromToken: SupportedToken,
  destToken: SupportedToken,
  amount: string
): Promise<IOneInchExpectedReturn> {
  return OneSplitContractInstance.methods.getExpectedReturn(
    tokenSymToAddress(fromToken),
    tokenSymToAddress(destToken),
    amount,
    ONE_SPLIT_PARTS,
    ONE_SPLIT_FLAGS
  ).call()
}

///////////////////////////////////////////////////////////////////////////////
// utils //

function panic<E>(exitcode: number, ...e: E[]) {
  e.forEach(err => console.error(err))
  return process.exit(exitcode)
}

export function tokenSymToAddress(sym: SupportedToken): string {
  return Addresses.$[sym].MAINNET
}

///////////////////////////////////////////////////////////////////////////////
