// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract CharityNFT is ERC721 {
    uint256 private _tokenIdCounter = 1;
    address public charityFoundation;

    mapping(address => bool) public hasReceivedNFT;
    mapping(address => uint256) public NFTOwners;
    
    event NFTMinted(address indexed to, uint256 indexed tokenId);

    constructor(address _charityFoundation)
        ERC721("CharityNFT", "CNFT")
    {
        charityFoundation = _charityFoundation;
    }

    modifier onlyCharityFoundation() {
        require(msg.sender == charityFoundation, "Only charity foundation can mint");
        _;
    }
    
    function mintNFT(address to) external onlyCharityFoundation returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(!hasReceivedNFT[to], "Donor already received an NFT");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        NFTOwners[to] = tokenId;
        hasReceivedNFT[to] = true;
        
        emit NFTMinted(to, tokenId);
        
        return tokenId;
    }
} 