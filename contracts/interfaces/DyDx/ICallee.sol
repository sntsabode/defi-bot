// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.6;
pragma experimental ABIEncoderV2;

import "../../libraries/DyDx/Account.sol";

interface ICallee {
  function callFunction(address sender, Account.Info calldata accountInfo, bytes calldata data) external;
}
