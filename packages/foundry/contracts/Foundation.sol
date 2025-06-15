// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./CharityToken.sol";
import "./CharityNFT.sol";

contract Foundation {
    string public name;
    uint private numberOfDonations;
    address public owner;
    bool public isDonationEnabled = true;
    uint public totalDonated;
    uint public totalTokenDonated;
    CharityToken public charityToken;
    CharityNFT public charityNFT;

    mapping(address => uint) private donations;
    mapping(address => uint) private tokenDonations;
    mapping(address => bool) private isRequestedRefund;
    mapping(address => bool) private isRequestedTokenRefund;

    event DonationReceived(address indexed donor, uint amount);
    event TokenDonationReceived(address indexed donor, uint amount);
    event RefundProcessed(address indexed donor, uint amount);
    event TokenRefundProcessed(address indexed donor, uint amount);
    event DonationStateChanged(bool isEnabled);
    event NameUpdated(string newName);
    event TokensWithdrawn(address indexed to, uint amount);
    event FundsWithdrawn(address indexed to, uint amount);

    error InvalidAddress();
    error NotAuthorized();
    error NoDonations();
    error RefundAlreadyRequested();
    error NoRequestedRefund();
    error DisabledDonations();
    error InsufficientTokenBalance();
    error InsufficientTokenAllowance();

    constructor(string memory _name, address _owner) {
        name = _name;
        owner = _owner;
        charityToken = new CharityToken();
        charityNFT = new CharityNFT(address(this));
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotAuthorized();
        }
        _;
    }

    modifier withValidAddress(address _toAddress) {
        if (_toAddress == address(0)) {
            revert InvalidAddress();
        }
        _;
    }

    modifier positiveBalance(uint _amount) {
        if (_amount == 0) {
            revert NoDonations();
        }
        _;
    }

    modifier onlyEnabledDonation() {
        if (isDonationEnabled == false) {
            revert DisabledDonations();
        }
        _;
    }

    receive() external payable {
        handleDonation(msg.sender, msg.value);
    }

    fallback() external payable {
        handleDonation(msg.sender, msg.value);
    }

    function updateName(string memory _name) public {
        name = _name;
        emit NameUpdated(_name);
    }

    function changeDonationState(bool state) public onlyOwner {
        isDonationEnabled = state;
        emit DonationStateChanged(state);
    }

    function withdraw(address _toAddress) public onlyOwner withValidAddress(_toAddress) {
        uint balance = address(this).balance;
        if (balance == 0) {
            revert NoDonations();
        }

        payable(_toAddress).transfer(balance);
        emit FundsWithdrawn(_toAddress, balance);
    }

    function claimRefund() public positiveBalance(donations[msg.sender]) {
        if (isRequestedRefund[msg.sender] == true) {
            revert RefundAlreadyRequested();
        }
        isRequestedRefund[msg.sender] = true; // mark refund as requested
    }

    function processRefund(address _donor)
        public
        onlyOwner
        withValidAddress(_donor)
        positiveBalance(donations[_donor])
    {
        if (isRequestedRefund[_donor] == false) {
            revert NoRequestedRefund();
        }
        uint refundAmount = donations[_donor];
        payable(_donor).transfer(refundAmount);
        isRequestedRefund[_donor] = false; // reset refund request
        totalDonated -= refundAmount;
        donations[_donor] = 0;
        numberOfDonations--;
        emit RefundProcessed(_donor, refundAmount);
    }

    function donate() public payable onlyEnabledDonation {
        handleDonation(msg.sender, msg.value);
    }

    function handleDonation(address _donor, uint _amount) internal positiveBalance(_amount) {
        donations[_donor] += _amount;
        totalDonated += _amount;
        numberOfDonations++;
        emit DonationReceived(_donor, _amount);
        
        // Mint NFT for the donor if they haven't received one yet
        bool hasNFT = charityNFT.hasReceivedNFT(_donor);
        if (!hasNFT) {
            charityNFT.mintNFT(_donor);
        }
    }

    function getDonationOf(address _donor) external view returns (uint) {
        return donations[_donor];
    }

    function donateTokens(uint _amount) public onlyEnabledDonation positiveBalance(_amount) {
        if (charityToken.balanceOf(msg.sender) < _amount) {
            revert InsufficientTokenBalance();
        }
        if (charityToken.allowance(msg.sender, address(this)) < _amount) {
            revert InsufficientTokenAllowance();
        }

        require(charityToken.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");
        tokenDonations[msg.sender] += _amount;
        totalTokenDonated += _amount;
        emit TokenDonationReceived(msg.sender, _amount);
        
        // Mint NFT for the token donor if they haven't received one yet
        bool hasNFT = charityNFT.hasReceivedNFT(msg.sender);
        if (!hasNFT) {
            charityNFT.mintNFT(msg.sender);
        }
    }

    function getTokenDonationOf(address _donor) external view returns (uint) {
        return tokenDonations[_donor];
    }

    function claimTokenRefund() public positiveBalance(tokenDonations[msg.sender]) {
        if (isRequestedTokenRefund[msg.sender]) {
            revert RefundAlreadyRequested();
        }
        isRequestedTokenRefund[msg.sender] = true;
    }

    function processTokenRefund(address _donor)
        public
        onlyOwner
        withValidAddress(_donor)
        positiveBalance(tokenDonations[_donor])
    {
        if (!isRequestedTokenRefund[_donor]) {
            revert NoRequestedRefund();
        }
        uint refundAmount = tokenDonations[_donor];

        require(charityToken.transfer(_donor, refundAmount), "Token transfer failed");
        isRequestedTokenRefund[_donor] = false;
        totalTokenDonated -= refundAmount;
        tokenDonations[_donor] = 0;
        emit TokenRefundProcessed(_donor, refundAmount);
    }

    function withdrawTokens(address _toAddress)
        public
        onlyOwner
        withValidAddress(_toAddress)
        positiveBalance(charityToken.balanceOf(address(this)))
    {
        uint tokenBalance = charityToken.balanceOf(address(this));
        require(charityToken.transfer(_toAddress, tokenBalance), "Token transfer failed");
        emit TokensWithdrawn(_toAddress, tokenBalance);
    }
}
