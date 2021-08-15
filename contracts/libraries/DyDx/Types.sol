
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.6;

library Types {
  enum AssetDenomination { Wei, Par }
  enum AssetReference { Delta, Target }

  struct AssetAmount {
    bool sign;
    AssetDenomination denomination;
    AssetReference ref;
    uint256 value;
  }
}
