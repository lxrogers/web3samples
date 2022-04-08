Audited by Samid

## **[H-1]** contribute() function can be a blocker in a very specific case.

On line 82 & 87 , SpaceCoinICO.sol: code is checking for SEED_TOTAL_LIMIT/ GENERAL_TOTAL_LIMIT. If an user wants to contribute $1500 at seed stage and totalContributions at that time is $14K then it will not allow that user or others to contribute further.

Consider: changing the phase automatically if totalContributions >= PHASE_LIMIT, rather than waiting for the appropiate contributor.

## **[H-2]** super._transfer() may receive wrong parameter value.

On line 128 & 129, SpaceCoinICO.sol: amount * 2 / 100 -- > can return unexpected value [0 in this case] as "/" operation has higher precedence over "*".

Consider: writing like this: (amount * 2) / 100, so that "*" operation will be performed first. Same can be applied for _mintICOCoins() function, line number: 121.

## **[H-3]** contribute() function is not changing the stage automatically upon achieving the phase_goal.

SpaceCoinICO.sol: when system is achieving the target for a specific phase it is not changing the phase automatically.

Consider: consider calling advancePhase() function when reaching the target.

## **[M-1]** advancePhase() function should have a returns keyword

On line 52, SpaceCoinICO.sol: is returning a blank value, however the same is not mentioned in function signature.

Consider: adding either the returns keyword in function signature or remove the "return" statement from else block.

## **[M-2]** Individual contribution logic requires attention 

On line 81 & 86, SpaceCoinICO.sol: code is checking only <. It should check for less than and equals to (<=), instead of less than only.

Consider: using <= instead of <.

## **[Q-1]** _trackContribution() function can encounter overflow problem.

On line 2, 3 & 4, SpaceCoinICO.sol: theoritically these addition operation can create overflow problem if the goal amount and contribution is very high.

Consider: using SafeMath library if solidity version is < 0.8.4

SafeMath is not required anymore because all math operations are safe by default.

## Nitpicks

- Emitting an event might be helpful in withdrawFunds() function.
- In _mintICOCoins() function, contributors.length is being calculated in every iteration. It may reduce the processig time if we store the value in another variable before starting the loop. Same is applicable for _checkWhitelist() function too.
