---
type: notetag
title: Reward Multipliers
description: The tag multiplying one kind of reward an enemy yields on defeat, set on the enemy or on its states.
tags: [passive-affix, tag, state, enemy, reward, multiplier]
---

# Reward Multipliers

## Description

Have you ever wanted affixed enemies to yield better rewards for the extra challenge they pose? Well now you can! By
applying the following tag to states and/or enemy notes, you too can multiplicatively scale any reward type when the
enemy is defeated.

## NOTE ABOUT MULTIPLE TAGS

Multiple tags per note are supported (one per reward type).

## NOTE ABOUT STACKING

When an enemy has multipliers from both its note and its states, they stack multiplicatively (e.g. 1.5x from note * 2.0x
from prefix state = 3.0x total).

## NOTE ABOUT THE DROPS TYPE

The "`drops`" type multiplies the drop chance percentage, not the number of items.

## TAG USAGE

- States, affix states or any other state on the enemy.
- Enemies

## TAG FORMAT

`<rewardMultiplier:[TYPE, VALUE]>`
Where TYPE is one of: `exp`, `gold`, `sdp`, `ap`, `drops`
Where VALUE is a decimal multiplier (e.g. 2.0 = double).

## TAG EXAMPLES

`<rewardMultiplier:[exp, 2.0]>`
Enemies defeated with this tag yield double experience.

`<rewardMultiplier:[gold, 1.5]>`
`<rewardMultiplier:[drops, 1.25]>`
These two tags on the same state would grant 1.5x gold and 1.25x drop chance when the enemy is defeated.