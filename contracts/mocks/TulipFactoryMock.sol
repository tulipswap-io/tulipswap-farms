// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@tulipswap/tulip-swap-core/contracts/TulipFactory.sol";

contract TulipFactoryMock is TulipFactory {
    constructor(address _feeToSetter) public TulipFactory(_feeToSetter) {}
}