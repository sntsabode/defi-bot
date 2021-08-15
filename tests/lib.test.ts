/*
yarn run mocha -r ts-node/register tests/lib.test.ts --timeout 900000
*/
import * as lib from '../lib/lib'
import { assert, expect } from 'chai'
import BN from 'bn.js'

describe('lib test suite', () => {
  it('Should call the getOneInchExpectedReturn function', async () => {
    const oneInchExpectedReturn = await lib.OneInch.getExpectedReturn(
      'DAI', 'USDC', lib.web3.utils.toWei('1')
    )

    expect(oneInchExpectedReturn).to.have.property('returnAmount')
    expect(oneInchExpectedReturn).to.have.property('distribution')

    assert.isArray(oneInchExpectedReturn.distribution)
    assert.isNotEmpty(oneInchExpectedReturn.distribution)

    assert.isNotNaN(parseFloat(oneInchExpectedReturn.returnAmount))
    for (const dist of oneInchExpectedReturn.distribution)
      assert.isNotNaN(parseFloat(dist))
  })

  it('Should call the fetch0xOrderBook function', async () => {
    const OxOrderBook = await lib.Ox.fetch0xOrderBook('DAI', 'USDC')

    expect(OxOrderBook).to.have.property('bids')
    expect(OxOrderBook).to.have.property('asks')

    function dataAssertions(data: lib.Ox.I0xOrderBookData) {
      expect(data).to.have.property('page')
      assert.isNumber(data.page)
      expect(data).to.have.property('perPage')
      assert.isNumber(data.perPage)
      expect(data).to.have.property('total')
      assert.isNumber(data.total)
      expect(data).to.have.property('records')
      assert.isArray(data.records)
      assert.isNotEmpty(data.records)

      for (const record of data.records) {
        expect(record).to.have.property('metaData')
        expect(record).to.have.property('order')

        expect(record.metaData).to.have.property('orderHash')
        expect(record.metaData).to.have.property('remainingFillableTakerAssetAmount')
        expect(record.metaData).to.have.property('createdAt')

        expect(record.order).to.have.property('signature')
        expect(record.order).to.have.property('senderAddress')
        expect(record.order).to.have.property('makerAddress')
        expect(record.order).to.have.property('takerAddress')
        expect(record.order).to.have.property('makerFee')
        expect(record.order).to.have.property('takerFee')
        expect(record.order).to.have.property('makerAssetAmount')
        expect(record.order).to.have.property('takerAssetAmount')
        expect(record.order).to.have.property('makerAssetData')
        expect(record.order).to.have.property('takerAssetData')
        expect(record.order).to.have.property('salt')
        expect(record.order).to.have.property('exchangeAddress')
        expect(record.order).to.have.property('feeRecipientAddress')
        expect(record.order).to.have.property('expirationTimeSeconds')
        expect(record.order).to.have.property('makerFeeAssetData')
        expect(record.order).to.have.property('chainId')
        expect(record.order).to.have.property('takerFeeAssetData')
      }
    }

    dataAssertions(OxOrderBook.asks)
    dataAssertions(OxOrderBook.bids)
  })

  it('Should call the Bot.calcProfitablity function', done => {
    const profitabitlity_ = lib.Bot.calcProfitablity(
      {
        takerFeeAssetData: '0xf47261b00000000000000000000000006b175474e89094c44da98b954eedeac495271d0f',
        takerFee: ''
      } as unknown as lib.Ox.I0xOrderBookDataRecordOrder,
      new BN('799520287800000000000000'),
      new BN('799520297800000000000000'),
      new BN('1700000'),
      ['DAI', 'WETH']
    )

    const profitabitlity = parseFloat(lib.web3.utils.fromWei(
      profitabitlity_.toString()
    ))

    const shouldbe = parseFloat('0.0099999999983')

    assert.strictEqual(profitabitlity, shouldbe)

    done()
  })

  it('Should call the Bot.callOrderBookAndFindArbs function', async () => {
    // Promise should resolve.
    // May or may not call the trade function, depends on if
    // profitable arbitrage ops are found or not
    await lib.Bot.callOrderBookAndFindArbs(['DAI', 'WETH'])
  })
})