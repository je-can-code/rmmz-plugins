---
type: notetag
title: Bonus Damage per State Stack
description: The tags adding bonus damage per stack of one specific state on the target.
tags: [abs, tag, damage, state, stack]
---

# Bonus Damage per State Stack

## Description

### Bonus Damage per State Stack

Adds PCT% bonus damage per current stack of a specific named state active on the target. Unlike
BONUS DAMAGE PER STATE TYPE, which counts distinct states of a type, this counts the stack depth of one exact state id.

### This Bonus Damage per State Stack

Skill-scoped variant. Only applies while this exact skill is executing, layering on top of the caster-wide
`<bonusDamagePerStateStack>` tag rather than replacing it.

## NOTE ABOUT UNTRACKED STATES

If the target is not currently tracked as afflicted by STATE_ID (state absent, or somehow untracked), this tag
contributes nothing.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States, including passives.
- Enemies
- Skills, for `<thisBonusDamagePerStateStack>`.

## TAG FORMAT

`<bonusDamagePerStateStack:[STATE_ID, PCT]>`
Where STATE_ID is the exact state id to read stacks from.
Where PCT is the integer percent bonus to add per stack.

`<thisBonusDamagePerStateStack:[STATE_ID, PCT]>`

## TAG EXAMPLES

`<bonusDamagePerStateStack:[STATE_BLEED_ID, 8]>`
"Exploit Wounds": +8% damage per stack of Bleed on the target. A target with 3 stacks of Bleed takes +24% bonus damage
from this hit.

`<thisBonusDamagePerStateStack:[STATE_BLEED_ID, 15]>`
A finisher that punishes stacked Bleed harder than the caster's baseline kit does: +15% per stack of Bleed, but only on
this skill.