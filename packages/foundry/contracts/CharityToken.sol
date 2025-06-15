// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CharityToken is ERC20 {
    address public owner;

    error NotAuthorized();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }

    constructor() ERC20("Charity Token", "CHRT") {
        owner = msg.sender;
        // Mint initial supply to the owner
        _mint(owner, 10 ether);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
