// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.6;
pragma experimental ABIEncoderV2;

import "../../libraries/DyDx/Account.sol";
import "../../libraries/DyDx/Actions.sol";

interface ISoloMargin {
  function operate(Account.Info[] calldata accounts, Actions.ActionArgs[] calldata actions) external;
}
