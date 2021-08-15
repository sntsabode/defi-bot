// eslint-disable-next-line
require('dotenv').config()
import Web3 from 'web3'
import { ONEINCH_ABIs } from './__abis__/abis'
import { Addresses, SupportedToken } from './addresses'
import axios from 'axios'

if (!process.env.ETH_NODE_URL)
  throw panic(1, 'ETH_NODE_URL undefined')

export const web3 = new Web3(
  new Web3.providers.HttpProvider(process.env.ETH_NODE_URL)
)

///////////////////////////////////////////////////////////////////////////////
// 0x //

export interface I0xOrderBookDataRecord {
  order: {
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

  metaData: {
    orderHash: string
    remainingFillableTakerAssetAmount: string
    createdAt: Date | string 
  }
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

export const fetch0xOrderBook = (() => {
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

  return (
    baseAssetSymbol: SupportedToken,
    quoteAssetSymbol: SupportedToken,
    limit = 1000
  ) => axios.get<I0xOrderBook>(
    `https://api.0x.org/sra/v3/orderbook?baseAssetData=0xf47261b0000000000000000000000000${
      addrs[baseAssetSymbol].substring(2,42)
    }&quoteAssetData=0xf47261b0000000000000000000000000${
      addrs[quoteAssetSymbol].substring(2,42)
    }&perPage=${limit}`
  ).then(res => res.data, e => { throw e })
})()

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
