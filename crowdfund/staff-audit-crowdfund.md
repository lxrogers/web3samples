https://github.com/ShipyardDAO/student.lxrogers/tree/a95c13c4b56ee98d249bd124bf20f65876d6f149/crowdfund

The following is a micro audit by Gab



# Design Exercise

Interesting solution! It's a nice approach to the problem of keeping it all in one contract.

# Issues

**[H-1]** Flawed badge awarding logic

If a user already contributed 3 ETH to this project, and then contributes an extra 1 ETH:

    if (donationsByDonor[msg.sender] - msg.value < 1 ether && donationsByDonor[msg.sender] >= 1 ether) {
        _mint(msg.sender, badgeCount++);
    }

`donationsByDonor` would be 4, and `msg.value` would be 1, the substraction results on 3 and the user does not get the NFT they should get.

Also, if a user donates 3 ETH the first time, they would only get one NFT, they should get 3

**[Q-1]** Unneeded math calculating logic

Solidity provides easy date calculation, you could simplify your logic by, for example, having this variable on creation:

`deadline = block.timestamp + 30 days;`

**[Q-2]** Unneeded require statement

    require(amount <= address(this).balance, "withdrawal amount too high");

If the contract doesn't have enough funds to transfer to the caller, the transaction will revert by itself, no need to check for that condition

**[Q-3]** Remove hardhat's console import on production

# Score

| Reason | Score |
|-|-|
| Late                       | - |
| Unfinished features        | - |
| Extra features             | - |
| Vulnerability              | 3 |
| Unanswered design exercise | - |
| Insufficient tests         | - |
| Technical mistake          | 1 |

Total: 4

Good job!
