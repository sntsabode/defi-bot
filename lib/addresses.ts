const $: {
  [sym in SupportedToken]: { MAINNET: string }
} = {
  USDC: {
    MAINNET: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  },

  WETH: {
    MAINNET: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  },

  DAI: {
    MAINNET: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  },

  SAI: {
    MAINNET: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359'
  }
}

export const Addresses = {
  DYDX: {
    MAINNET: {
      ISoloMargin: '0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e',
    },
  },

  ONEINCH: {
    MAINNET: {
      OneSplitAudit: '0xC586BeF4a0992C495Cf22e1aeEE4E446CECDee0E',
    }
  },

  ZRX: {
    MAINNET: {
      ZRXExchangeAddress: '0x61935CbDd02287B511119DDb11Aeb42F1593b7Ef',
      ZRXERC20ProxyAddress: '0x95E6F48254609A6ee006F7D493c8e5fB97094ceF',
      ZRXStakingProxy: '0xa26e80e7Dea86279c6d778D702Cc413E6CFfA777' // Fee collector
    }
  },

  $
}

export type SupportedToken =
  | 'USDC'
  | 'WETH'
  | 'DAI'
  | 'SAI'