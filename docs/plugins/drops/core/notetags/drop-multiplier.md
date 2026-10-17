---
type: notetag
title: Drop Multiplier
description: The tag raising the party's chance to find enemy drops, multiplying each drop's own percent chance.
tags: [drops, tag, party, loot, multiplier]
---

# Drop Multiplier

## Description

Additionally, you can apply tags to increase [this percentage chance](../overview.md#percentage-drops)
multiplicatively! See the [tag examples](#tag-examples) down below for additional details on how the multiplication
works and the caveats to consider when adding the tag to things in the database.

## NOTE ABOUT THE PARTY DROP ITEM RATE

The bonuses from all members in the battle party will be considered by adding them all together to produce a "party drop
item rate".

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- States

## TAG FORMAT

`<dropMultiplier:NUM>`
Where NUM is the a positive amount to increase drop item rate.

## TAG EXAMPLES

`<dropMultiplier:50>`
This actor now has +50% drop chance.

- If a drop item on an enemy has a 40% chance to drop, with this drop multiplier bonus it would be increased from 40% >>
  60% (50% of 40 is 20)
- If a drop item on an enemy has a 4% chance to drop, with this drop multiplier bonus, it would be increased from 4% >>
  6% (50% of 4 is 2)

`<dropMultiplier:10>`
`<dropMultiplier:40>`
`<dropMultiplier:200>`
This actor now has +250% drop chance.

- If a drop item on an enemy has a 40% chance to drop, with this drop multiplier bonus, it would be increased from
  40% >> 140% (250% of 40 is 100)
- If a drop item on an enemy has a 4% chance to drop, with this drop multiplier bonus, it would be increased from 4% >>
  14% (250% of 4 is 10)