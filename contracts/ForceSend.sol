// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.6;

// For test suite
contract ForceSend {
  function go(address payable victim) external payable {
    selfdestruct(victim);
  }
}
