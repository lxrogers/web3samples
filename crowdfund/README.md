# Readme
This is a smart contract that allows project creators to create a fundraising campaign.
A campaign consists of a name, funding goal, and deadline.

### Fundraising rules
- users may contribute at least 0.1 eth to a campaign.
- if a user has donated at least 1 eth, they will get an NFT for their contribution
- a user may only withdraw their donation if the campaign is still active
- a campaign is not active if the creator cancels the fundraise, or if the deadline has passed and the goal has not been met.
- in those cases, the contributors may withdraw their contributions
- only in the case of a successful fundraise may the creator withdraw their funds.