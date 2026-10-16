---
type: notetag
title: Maximum Refinement Count
description: The tag capping how many times an equip can be used as the base of a refinement.
tags: [jafting-refine, tag, weapon, armor, refine, limit]
---

# Maximum Refinement Count

## Description

Placing this tag onto equipment means it can only be used as a base for refinement NUM number of times.

## NOTE ABOUT LIMITS

While the refinement count may be fixed, you can still refine equips beyond their limits by leveraging already-refined
equipment as the material. The system will allow fusing something if there are still refinement counts available, even
if the material has +8 when there is only 1 count left.

## TAG USAGE

- Weapons
- Armor

## TAG FORMAT

`<maxRefineCount:NUM>`
Where NUM is a number that represents how many times this can be refined.

## TAG EXAMPLES

`<maxRefineCount:3>`
An equip with this can only be used as a "base" for refinement 3 times
OR
An equip can only achieve be fused to or beyond +3 once
(whichever comes first)