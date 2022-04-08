//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Crowdfunder {
    Project[] public projects;

    event ProjectCreated();

    function createProject(string memory _name, uint _goal) external {
        Project project = new Project(msg.sender, _name, _goal);
        projects.push(project);
        emit ProjectCreated();
    }
}

contract Project is ERC721 {
    address private creator;
    string public projectName;
    uint public goal;
    uint public createdAt;
    bool public cancelled;
    uint internal totalDonations;
    uint internal badgeCount;

    mapping (address => uint) public donationsByDonor;

    enum Status{CANCELLED, FAILED, FUNDED, ACTIVE}

    constructor (address _creator, string memory _projectName, uint _goal) ERC721 (string(abi.encodePacked(_projectName, " Badge")), "BDGE") {
        creator = _creator;
        projectName = _projectName;
        goal = _goal;
        createdAt = block.timestamp;
        cancelled = false;
        badgeCount = 0;
    }

    modifier creatorOnly {
        require (msg.sender == creator, "not creator");
        _;
    }

    function cancel() external creatorOnly {
        require (getStatus() == Status.ACTIVE, "not active");
        cancelled = true;
    }

    function donate() external payable {
        require (msg.value >= 0.01 ether, "Donation less than 0.01 ether");
        require (getStatus() == Status.ACTIVE, "not active");
        donationsByDonor[msg.sender] += msg.value;
        totalDonations += msg.value;
        
        //only give them the NFT once, at the time when their donation total crosses 1 ether
        if (donationsByDonor[msg.sender] - msg.value < 1 ether && donationsByDonor[msg.sender] >= 1 ether) {
            _mint(msg.sender, badgeCount++);
        }
    }

    function withdrawDonation() external {
        require(getStatus() == Status.FAILED || getStatus() == Status.CANCELLED, "not failed or cancelled");
        uint amount = donationsByDonor[msg.sender];
        donationsByDonor[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }

    function withdrawFunds(uint amount) external creatorOnly {
        require(getStatus() == Status.FUNDED, "not funded");
        msg.sender.call{value: amount}("");
    }

    function getStatus() public view returns (Status status) {
        if (cancelled) {
            return Status.CANCELLED;
        } 
        else if (totalDonations >= goal) {
            return Status.FUNDED;
        }
        else if (block.timestamp - createdAt >= 30 days) {
            return Status.FAILED;
        }
        else {
            return Status.ACTIVE;
        }
    }
}