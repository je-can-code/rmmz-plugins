---
type: notetag
title: Stack Cost and Item Cost
description: The tags making a skill cost state stacks or inventory items to cast, refused like insufficient MP.
tags: [resources, tag, skill, cost, state, item]
---

# Stack Cost and Item Cost

## Description

Have you ever wanted a skill that costs something other than hp/mp/tp- like charges banked up from an earlier proc, or
literal ammo out of the party's inventory? Well now you can! These feed directly into `canPaySkillCost`/`paySkillCost`,
so an unaffordable skill is refused to fire exactly like insufficient MP already is- no separate UI wiring needed.

## NOTE ABOUT SKILL-ONLY COSTS

Both tags live on the skill only (not on states/equips/etc.)- costs are inherent to the skill. If more than one of the
same tag is authored on one note, only the last one found wins (same convention as flat/percent costs).

## TAG USAGE

- Skills

## TAG FORMAT

`<stackCost:[STATE_ID,COUNT]>`
Requires [`J-ABS`](../../../abs/core/overview.md). The caster must hold at least COUNT stacks of STATE_ID to cast;
COUNT stacks are consumed via `decrementStateStacks` on pay. Leave the state's own
[`<stackMax:VAL>`](../../../abs/core/notetags/states/stack-config-overrides.md) high/unset for an uncapped pool.

`<itemCost:[ITEM_ID,COUNT]>`
ITEM_ID resolves against `$dataItems` only (not weapons/armors). The party must hold at least COUNT of the item to cast;
COUNT are removed from the party's inventory via `$gameParty.loseItem` on pay.

## TAG EXAMPLES

`<stackCost:[7,3]>`
Costs 3 stacks of state 7 to cast; refuses to fire below that.

`<itemCost:[12,2]>`
Costs 2 of item 12 to cast; refuses to fire without them in stock.