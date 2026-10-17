---
type: notetag
title: Maximum Traits per Equip
description: The tag capping how many combined traits an equip can hold through refinement.
tags: [jafting-refine, tag, weapon, armor, refine, limit, trait]
---

# Maximum Traits per Equip

## Description

Placing this tag onto equipment means it can only be used as a base as long as the number of combined trait slots (see
the screen while refining) is lesser than or equal to NUM. This most commonly would be used to prevent the player from
adding an unreasonable number of traits onto an equip.

## NOTE ABOUT LIMITS

Attempting to fuse beyond the max will not be allowed, even if there are additional refinement counts available.
However, traits will intelligently stack if they are the same, and powering up existing traits will still be allowed.

## TAG USAGE

- Weapons
- Armor

## TAG FORMAT

`<maxRefinedTraits:NUM>`
Where NUM is a number that represents how many combined traits it can have.

## TAG EXAMPLES

`<maxRefinedTraits:3>`
An equip with this can only have a total of 3 unique traits.