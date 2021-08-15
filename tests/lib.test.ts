/*
mocha -r ts-node/register tests/lib.test.ts --timeout 900000
*/
import * as lib from '../lib/lib'
import { assert, expect } from 'chai'

const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

describe('lib test suite', () => {
  it('Should call the getOneInchExpectedReturn function', async () => {
    const oneInchExpectedReturn = await lib.getOneInchExpectedReturn(
      DAI, USDC, lib.web3.utils.toWei('1')
    )

    expect(oneInchExpectedReturn).to.have.property('returnAmount')
    expect(oneInchExpectedReturn).to.have.property('distribution')

    assert.isArray(oneInchExpectedReturn.distribution)
    assert.isNotEmpty(oneInchExpectedReturn.distribution)

    assert.isNotNaN(parseFloat(oneInchExpectedReturn.returnAmount))
    for (const dist of oneInchExpectedReturn.distribution)
      assert.isNotNaN(parseFloat(dist))
  })
})