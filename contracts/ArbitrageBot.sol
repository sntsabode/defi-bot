// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.6;
pragma experimental ABIEncoderV2;

import "./interfaces/@OpenZeppelin/IERC20.sol";
  
import "./interfaces/DyDx/ISoloMargin.sol";
import "./interfaces/DyDx/ICallee.sol";

import "./libraries/DyDx/Actions.sol";
import "./libraries/DyDx/Account.sol";

import "./interfaces/OneInch/IOneSplit.sol";
      
contract ArbitrageBot is ICallee {
  mapping(address => uint) public DyDxCurrencyMarketIDs;

  address immutable SoloAddress;

  address immutable OneInchAddress;

  address immutable ZRXExchangeAddress;
  address immutable ZRXERC20ProxyAddress;
  address immutable ZRXStakingProxyAddress;

  address immutable USDC;
  address immutable WETH;
  address immutable DAI;
  address immutable SAI;

  address immutable Owner;

  constructor(
    address _ISoloMarginAddress,
    address _OneInchAddress,
    address _ZRXExchangeAddress,
    address _ZRXERC20ProxyAddress,
    address _ZRXStakingProxyAddress,
    address _USDC,
    address _WETH,
    address _DAI,
    address _SAI
  ) {
    Owner = msg.sender;

    IERC20(_USDC).approve(_ISoloMarginAddress, type(uint256).max);
    IERC20(_WETH).approve(_ISoloMarginAddress, type(uint256).max); // Use WETH contract
    IERC20(_DAI).approve(_ISoloMarginAddress, type(uint256).max);
    IERC20(_SAI).approve(_ISoloMarginAddress, type(uint256).max);
    
    SoloAddress = _ISoloMarginAddress;
    OneInchAddress = _OneInchAddress;

    ZRXExchangeAddress = _ZRXExchangeAddress;
    ZRXERC20ProxyAddress = _ZRXERC20ProxyAddress;
    ZRXStakingProxyAddress = _ZRXStakingProxyAddress;

    DyDxCurrencyMarketIDs[_WETH] = 0;
    DyDxCurrencyMarketIDs[_SAI] = 1;
    DyDxCurrencyMarketIDs[_USDC] = 2;
    DyDxCurrencyMarketIDs[_DAI] = 3;

    USDC = _USDC;
    WETH = _WETH;
    DAI = _DAI;
    SAI = _SAI;
  }

  modifier OnlyOwner() {
    require(msg.sender == Owner, "Function locked to OnlyOwner");
    _;
  }
  
  // Add desired parameters here
  struct CallFuncParam {
    uint256 amount;
    address flashloanCurrency;
    address destCurrency;
    bytes OxData;
    uint256 oneSplitMinReturn;
    uint256[] oneSplitDistribution;
    uint256 flags;
  }

  /**
   * `callFunction` is the entry point for your custom logic.
   * This is the function that will be called by the `flashloan` function.
   */
  function callFunction(
    address,
    Account.Info calldata,
    bytes calldata _data
  ) external override {
    // Parameters encoded in 'flashloan'
    CallFuncParam memory data = abi.decode(_data, (CallFuncParam));

    this.arbitrage(
      IERC20(data.flashloanCurrency),
      IERC20(data.destCurrency),
      data.amount,
      data.OxData,
      data.oneSplitMinReturn,
      data.oneSplitDistribution,
      data.flags
    );
  }

  function arbitrage(
    IERC20 fromToken,
    IERC20 destToken,
    uint256 amount,
    bytes calldata OxData,
    uint256 oneSplitMinReturn,
    uint256[] memory oneSplitDistribution,
    uint256 flags
  ) external {
    uint256 startBalance;
    uint256 endBalance;
    
    startBalance = fromToken.balanceOf(address(this));

    this.trade(
      fromToken,
      destToken,
      amount,
      OxData,
      oneSplitMinReturn, 
      oneSplitDistribution,
      flags
    );

    endBalance = fromToken.balanceOf(address(this));

    // Require that the arbitrage is profitable
    require(
      endBalance > startBalance,
      "Arbitrage was not profitable (sorry for your gas)"
    );
  }

  /*
   */
  function trade(
    IERC20 fromToken,
    IERC20 destToken,
    uint256 amount,
    bytes calldata OxData,
    uint256 oneSplitMinReturn,
    uint256[] memory oneSplitDistribution,
    uint256 flags
  ) external OnlyOwner {
    // Swap on 0x: give fromToken, receive destToken
    this.swapOnZRX(fromToken, amount, OxData);

    // Assumes a destToken balance of 0 before the 0x trade
    uint256 destTokensReceived = destToken.balanceOf(address(this));

    this.swapOnOneInch(
      destToken,
      fromToken,
      destTokensReceived,
      oneSplitMinReturn,
      oneSplitDistribution,
      flags
    );
  }

  /**
   * Swaps tokens on 0x
   */
  function swapOnZRX(
    IERC20 fromToken,
    uint256 amount,
    bytes calldata calldatabytes
  ) external payable OnlyOwner {
    fromToken.approve(ZRXExchangeAddress, amount);

    address(ZRXExchangeAddress).call{value: msg.value}(calldatabytes);

    fromToken.approve(ZRXExchangeAddress, 0);
  }

  /**
   * Swaps tokens on OneInch
   */
  function swapOnOneInch(
    IERC20 fromToken,
    IERC20 destToken,
    uint256 amount,
    uint256 minReturn,
    uint256[] memory distribution,
    uint256 flags
  ) external OnlyOwner {
    fromToken.approve(OneInchAddress, amount);

    IOneSplit(OneInchAddress).swap(
      fromToken,
      destToken,
      amount,
      minReturn,
      distribution,
      flags
    );

    fromToken.approve(OneInchAddress, amount);
  }
  
  // Function meant to be called by the bot
  function flashloan(
    CallFuncParam calldata param
  ) external {
    Actions.ActionArgs[] memory operations = new Actions.ActionArgs[](3);

    operations[0] = Actions.ActionArgs({
      actionType: Actions.ActionType.Withdraw,
      accountId: 0,
      amount: Types.AssetAmount({
        sign: false,
        denomination: Types.AssetDenomination.Wei,
        ref: Types.AssetReference.Delta,
        value: param.amount
      }),
      primaryMarketId: DyDxCurrencyMarketIDs[param.flashloanCurrency],
      secondaryMarketId: 0,
      otherAddress: address(this),
      otherAccountId: 0,
      data: ""
    });
      
    operations[1] = Actions.ActionArgs({
      actionType: Actions.ActionType.Call,
      accountId: 0,
      amount: Types.AssetAmount({
        sign: false,
        denomination: Types.AssetDenomination.Wei,
        ref: Types.AssetReference.Delta,
        value: 0
      }),
      primaryMarketId: 0,
      secondaryMarketId: 0,
      otherAddress: address(this),
      otherAccountId: 0,
      // add variables that have to available to the receiver function here
      data: abi.encode(param)
    });
      
    operations[2] = Actions.ActionArgs({
      actionType: Actions.ActionType.Deposit,
      accountId: 0,
      amount: Types.AssetAmount({
        sign: true,
        denomination: Types.AssetDenomination.Wei,
        ref: Types.AssetReference.Delta,
        value: param.amount + 2
      }),
      primaryMarketId: DyDxCurrencyMarketIDs[param.flashloanCurrency],
      secondaryMarketId: 0,
      otherAddress: address(this),
      otherAccountId: 0,
      data: ""
    });
      
    Account.Info[] memory accountInfos = new Account.Info[](1);
    accountInfos[0] = Account.Info({ owner: address(this), number: 1 });

    this.checkBalances(param.flashloanCurrency, param.destCurrency);

    this.SoloFac().operate(accountInfos, operations);
  }
  
  function checkBalances(address fromToken, address destToken) external {
    uint256 fromTokenBalance;
    uint256 destTokenBalance;

    fromTokenBalance = IERC20(fromToken).balanceOf(address(this));
    destTokenBalance = IERC20(destToken).balanceOf(address(this));


    if (fromTokenBalance > 0)
      IERC20(fromToken).transfer(Owner, fromTokenBalance);
    
    if (destTokenBalance > 0)
      IERC20(destToken).transfer(Owner, destTokenBalance);
  }

  function SoloFac() external view returns(ISoloMargin solo) {
    return ISoloMargin(SoloAddress);
  }
}