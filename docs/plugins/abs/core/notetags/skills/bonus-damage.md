---
type: notetag
title: Bonus Damage
description: The tags adding an unconditional percent damage bonus, caster-wide or to a single skill.
tags: [abs, tag, damage, bonus]
---

# Bonus Damage

## Description

Unconditional flat percent damage bonus- no target state requirement at all. `bonusDamage` reads from the caster's
notes (actor, class, equips, states), so it applies to EVERY action the caster performs- good fit for a passive state
that just says "you deal X% more damage" while it's active. `thisBonusDamage` is the skill-scoped sibling: fires only
when THIS skill is the action being resolved, useful for prof extend rows that boost one specific skill without
touching its formula or leaking the bonus to the rest of the caster's kit. Multiple tags of either kind, on any number
of sources, stack additively.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States, including passives.
- Enemies
- Skills, for `<thisBonusDamage>`.

## TAG FORMAT

`<bonusDamage:PCT>`
`<thisBonusDamage:PCT>`
Where PCT is the integer (or decimal) percent bonus to add unconditionally.

## TAG EXAMPLES

`<bonusDamage:15>`
A "Berserk" state that grants +15% damage on everything while active.

`<thisBonusDamage:20>`
Blade of the Mouse row 6 — +20% damage on mainchain skills: placed on the extend skill targeting [11,12,13].