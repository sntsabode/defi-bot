// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.6;

import "./Types.sol";

library Actions {
  enum ActionType { Deposit, Withdraw, Transfer, Buy, Sell, Trade, Liquidate, Vaporize, Call }

  struct ActionArgs {
    ActionType actionType;
    uint256 accountId;
    Types.AssetAmount amount;
    uint256 primaryMarketId;
    uint256 secondaryMarketId;
    address otherAddress;
    uint256 otherAccountId;
    bytes data;
  }
}
