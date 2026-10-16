---
type: notetag
title: Bonus Damage for My State Count
description: The tags adding bonus damage for every distinct state the caster has applied to the target.
tags: [abs, tag, damage, state, author]
---

# Bonus Damage for My State Count

## Description

### Bonus Damage for My State Count

Adds PCT% bonus damage for every distinct state on the target that this exact caster is the one who applied. This lives
entirely on the caster's own notes (actor/class/weapon/armor/state), not on the skill — it's a passive that's always
live regardless of which skill is executing.

### This Bonus Damage for My State Count

Skill-scoped variant. Reads only from the executing skill's own note, stacking on top of the caster-wide tag above
rather than replacing it.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States, including passives.
- Enemies
- Skills, for `<thisBonusDamageForMyStateCount>`.

## TAG FORMAT

`<bonusDamageForMyStateCount:PCT>`
Where PCT is the integer percent bonus per distinct caster-authored state.

`<thisBonusDamageForMyStateCount:PCT>`

## TAG EXAMPLES

`<bonusDamageForMyStateCount:5>`
Adds a 5 percent bonus per distinct caster-authored state.

`<thisBonusDamageForMyStateCount:15>`
A debuffer whose finisher scales off their own handiwork. If this caster personally applied 3 different states
currently active on the target (regardless of who else also has states on it), this skill gains +45% bonus damage
(15 * 3).