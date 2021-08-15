/* eslint-disable */
const ArbitrageBot = artifacts.require('ArbitrageBot')

const [
  SoloMarginAddress,
  OneInchAddress,
  ZRXEchangeAddress,
  USDCAddress,
  WETHAddress,
  DAIAddress,
  SAIAddress
] = [
  '0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e',
  '0xC586BeF4a0992C495Cf22e1aeEE4E446CECDee0E',
  '0x61935CbDd02287B511119DDb11Aeb42F1593b7Ef',
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359'
]

module.exports = deployer => deployer.deploy(
  ArbitrageBot,
  SoloMarginAddress,
  OneInchAddress,
  ZRXEchangeAddress,
  USDCAddress,
  WETHAddress,
  DAIAddress,
  SAIAddress
)
