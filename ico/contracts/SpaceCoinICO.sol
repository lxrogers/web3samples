//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SpaceCoinICO is ERC20 {
    uint constant public MAX_SUPPLY = 500000;
    uint constant public SEED_TOTAL_LIMIT = 15000 ether;
    uint constant public SEED_INDIVIDUAL_LIMIT = 1500 ether;
    uint constant public GENERAL_INDIVIDUAL_LIMIT = 1000 ether;
    uint constant public GENERAL_TOTAL_LIMIT = 30000 ether;
    uint constant public TAX_RATE_PERCENT = 2;

    address public owner;
    address public treasury;
    mapping (address => bool) public seedWhitelist;
    mapping (address => bool) public hasMinted;
    bool public isPaused;
    bool public taxEnabled;
    
    enum Phase {SEED, GENERAL, OPEN}
    Phase public currentPhase;

    uint public totalContributions;
    uint public currentFunds;

    mapping (address => uint) public contributions;
    address[] public contributors;

    modifier onlyOwner {
        require (msg.sender == owner, "not owner");
        _;
    }

    constructor(address _treasury, address[] memory _seedWhitelist) ERC20 ("Space Coin", "SPC") {
        owner = msg.sender;
        treasury = _treasury;
        currentPhase = Phase.SEED;
        totalContributions = 0;
        for (uint8 i = 0; i < _seedWhitelist.length; ++i) {
            seedWhitelist[_seedWhitelist[i]] = true;
        }
    }

    function advancePhase() external onlyOwner {
        if (currentPhase == Phase.SEED) {
            currentPhase = Phase.GENERAL;
        }
        else if (currentPhase == Phase.GENERAL) {
            currentPhase = Phase.OPEN;
        }
        else {
            return;
        }
    }

    function pause() external onlyOwner {
        isPaused = true;
    }

    function resume() external onlyOwner {
        isPaused = false;
    }

    function setTaxEnabled(bool _taxEnabled) external onlyOwner {
        taxEnabled = _taxEnabled;
    }

    function withdrawFunds(uint256 amount) external onlyOwner() {
        require(amount <= currentFunds, "SPC: not enough funds");
        require(currentPhase == Phase.OPEN, "SPC: not Open Phase");
        currentFunds -= amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "SPC: Transfer failed");
    } 

    function contribute() external payable {
        require(!isPaused, "SPC: fundraising paused");
        if (currentPhase == Phase.SEED) {
            require(_checkWhitelist(msg.sender), "SPC: not in seed whitelist");
            require(contributions[msg.sender] + msg.value <= SEED_INDIVIDUAL_LIMIT, "SPC: reached individual limit");
            require(totalContributions + msg.value <= SEED_TOTAL_LIMIT, "SPC: reached phase limit");
            _trackContribution(msg.sender, msg.value);
        }
        else if (currentPhase == Phase.GENERAL) {
            require(contributions[msg.sender] + msg.value <= GENERAL_INDIVIDUAL_LIMIT, "SPC: reached individual limit");
            require(totalContributions + msg.value <= GENERAL_TOTAL_LIMIT, "SPC: reached phase limit");
            _trackContribution(msg.sender, msg.value);

        }
        else if (currentPhase == Phase.OPEN) {
            require((totalContributions * 5 / 1e18) + (msg.value * 5 / 1e18) <= MAX_SUPPLY, "SPC: max supply reached");
            _trackContribution(msg.sender, msg.value);
            _mint(msg.sender, msg.value * 5 / 1e18);
        }
    }

    function _trackContribution(address sender, uint amount) private {
        if (contributions[sender] == 0) {
                contributors.push(sender);
        }
        contributions[sender] += amount;
        totalContributions += amount;
        currentFunds += amount;
    }

    function mintICOCoins() external {
        require (currentPhase == Phase.OPEN, "SPC: Wrong Phase");
        require (hasMinted[msg.sender] == false, "SPC: Previously Minted");
        hasMinted[msg.sender] = true;
        _mint(msg.sender, contributions[msg.sender] * 5 / 1e18);
    }

    function _checkWhitelist(address toCheck) internal view returns (bool) {
        return seedWhitelist[toCheck];
    }

    function _transfer( address from, address to, uint256 amount) internal override {
        if (taxEnabled) {
            require(balanceOf(from) >= amount, "SPC: transfer amount exceeds balance");
            super._transfer(from, treasury, amount * 2 / 100);
            super._transfer(from, to, amount * 98 / 100);
        }
        else {
            super._transfer(from, to, amount);
        }
    }

    function changeWhitelist(address _address, bool _inWhitelist) external onlyOwner {
        seedWhitelist[_address] = _inWhitelist;
    }
    
}
