/* eslint-disable */

const { expect } = require('chai')
const { readFileSync } = require('fs')
const { resolve } = require('path')
const DAI_ABI = require('./dai.abi')
const ForceSend = artifacts.require('ForceSend')
const BN = require('bn.js')

const USER_ADDRESS = readFileSync(resolve(process.cwd(), '.daiuseraddress')).toString()
const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f'
const DAIContract = new web3.eth.Contract(DAI_ABI, DAI_ADDRESS)

contract('ArbitrageBot contract tests', accounts => {
  // https://github.com/ryanio/truffle-mint-dai/blob/master/test/dai.js
  it('Should send ether to the user address', async () => {
    const forceSend = await ForceSend.new()
    await forceSend.go(USER_ADDRESS, { value: web3.utils.toWei('1') })

    const ethBalance = await web3.eth.getBalance(USER_ADDRESS)
    expect(new BN(ethBalance)).to.be.bignumber.least(new BN(web3.utils.toWei('1')))
  })
  // https://github.com/ryanio/truffle-mint-dai/blob/master/test/dai.js
  it('Should send DAI to the first generated account', async () => {
    const daiBalance = await DAIContract.methods.balanceOf(USER_ADDRESS).call()
    expect(new BN(daiBalance)).to.be.bignumber.least(new BN(web3.utils.toWei('1')))

    for (const account of accounts.slice(0, 1)) {
      await DAIContract.methods
        .transfer(account, web3.utils.toWei('1'))
        .send({ from: USER_ADDRESS, gasLimit: 800000 })
      const daiBalance = await DAIContract.methods.balanceOf(account).call()
      expect(new BN(daiBalance)).to.be.bignumber.least(new BN(web3.utils.toWei('1')))
    }
  })
})