// eslint-disable-next-line
require('dotenv').config()
import Web3 from 'web3'
import { ONEINCH_ABIs } from './__abis__/abis'
import { Addresses } from './addresses'

if (!process.env.ETH_NODE_URL)
  throw panic(1, 'ETH_NODE_URL undefined')

export const web3 = new Web3(
  new Web3.providers.HttpProvider(process.env.ETH_NODE_URL)
)

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
  fromToken: string,
  destToken: string,
  amount: string
): Promise<IOneInchExpectedReturn> {
  return OneSplitContractInstance.methods.getExpectedReturn(
    fromToken, destToken, amount, ONE_SPLIT_PARTS, ONE_SPLIT_FLAGS
  ).call()
}

function panic<E>(exitcode: number, ...e: E[]) {
  e.forEach(err => console.error(err))
  return process.exit(exitcode)
}
