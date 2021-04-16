// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// TulipGarden is the coolest garden in town. You come in with some Tulips, and
// leave with more! The longer you stay, the more Tulips you get.
// This contract handles swapping to and from xTulip, TulipSwap's staking token.
contract TulipGarden is ERC20("TulipGarden", "xTULIP"){
    using SafeMath for uint256;
    IERC20 public tulip;

    // Define the Tulip token contract
    constructor(IERC20 _tulip) public {
        tulip = _tulip;
    }

    // Enter the garden. Pay some TULIPs. Earn some shares.
    // Locks Tulip and mints xTulip
    function enter(uint256 _amount) public {
        // Gets the amount of Tulip locked in the contract
        uint256 totalTulip = tulip.balanceOf(address(this));
        // Gets the amount of xTulip in existence
        uint256 totalShares = totalSupply();
        // If no xTulip exists, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalTulip == 0) {
            _mint(msg.sender, _amount);
        } 
        // Calculate and mint the amount of xTulip the Tulip is worth.
        // The ratio will change overtime, as xTulip is burned/minted and
        // Tulip deposited + gained from fees / withdrawn.
        else {
            uint256 what = _amount.mul(totalShares).div(totalTulip);
            _mint(msg.sender, what);
        }
        // Lock the Tulip in the contract
        tulip.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the garden. Claim back your TULIPs.
    // Unclocks the staked + gained Tulip and burns xTulip
    function leave(uint256 _share) public {
        // Gets the amount of xTulip in existence
        uint256 totalShares = totalSupply();
        // Calculates the amount of Tulip the xTulip is worth
        uint256 what = _share.mul(tulip.balanceOf(address(this))).div(totalShares);
        _burn(msg.sender, _share);
        tulip.transfer(msg.sender, what);
    }
}