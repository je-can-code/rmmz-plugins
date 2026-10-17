---
type: notetag
title: Per-Debuff Bonus
description: The tag adding bonus damage for every negative state active on the target.
tags: [abs, tag, damage, state, debuff]
---

# Per-Debuff Bonus

## Description

### State Damage Multipliers

These tags apply damage bonuses based on the current states of the target at the moment the action resolves. All tags
are read from `getAllNotes()` on the caster (passives, equips, states, class, actor, etc.).

Bonuses are applied BEFORE guard reduction so that a target's heavily-guarded stance cannot fully negate the caster's
state-exploitation advantage. Guard still reduces the amplified value — it is simply less effective at canceling the
bonus outright than it would be if the bonus were applied afterward.

Combined formula:

```text
totalPct = perDebuffBonusPct + specificStateBonusPct + typePresenceBonusPct + typeCountBonusPct
finalDamage = round(baseDamage * (1 + totalPct / 100))
```

### Per-Debuff Bonus

Adds N% bonus damage for every negative state (`<type:negative>` tagged) currently active on the target. Multiple
`<perDebuffBuff:N>` tags have their N values summed, then the total is multiplied by the debuff count.

## NOTE ABOUT NEGATIVE STATES

Only states tagged with `<type:negative>` in their note box are counted. Buffs, temp power-ups, and untagged states do
not increment the count.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States, including passives.
- Enemies

## TAG FORMAT

`<perDebuffBuff:N>`
Where N is a signed decimal percent-per-debuff (5 = +5% per debuff).
Negative N acts as a damage penalty against debuffed targets.

## TAG EXAMPLES

`<perDebuffBuff:5>`
Puppet mastery — +5% damage per debuff on the target.

With three debuffs active (e.g. Paralyzed + Rooted + Poisoned):

```text
totalPct from this tag = 5 * 3 = 15%
```