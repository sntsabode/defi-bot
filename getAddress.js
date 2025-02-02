// https://github.com/ryanio/truffle-mint-dai/blob/master/getAddress.js
/* eslint-disable */

const { writeFileSync } = require('fs')
const { join } = require('path')
const Web3 = require('web3')
require('dotenv').config()

const { ETH_NODE_URL } = process.env

const INFURA_MAX_HISTORY = 120
const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f'

const web3 = new Web3(
  new Web3.providers.HttpProvider(ETH_NODE_URL)
)

const run = async () => {
  const number = await web3.eth.getBlockNumber()
  const fromBlock = number - INFURA_MAX_HISTORY

  // topic: Transfer(address,address,uint256)
  const topics = [
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
  ]

  const logs = await web3.eth.getPastLogs({
    fromBlock,
    address: DAI_ADDRESS,
    topics
  })

  const max = logs.reduce((a, b) =>
    web3.utils.toBN(a.data).gt(web3.utils.toBN(b.data)) ? a : b
  )
  const destination = max.topics[2].slice(-40)
  writeFileSync(join(__dirname, '.daiuseraddress'), `0x${destination}`)
}

run()
