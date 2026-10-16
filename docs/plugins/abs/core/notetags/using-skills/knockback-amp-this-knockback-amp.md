---
type: notetag
title: Knockback Amp / This Knockback Amp
description: The tags amplifying a battler's outgoing knockback unconditionally, battler-wide or for a single skill.
tags: [abs, tag, knockback, skill]
---

# Knockback Amp / This Knockback Amp

## Description

Unconditional outgoing knockback amplifier- no proximity requirement, unlike [Proximity
Knockback](proximity-knockback.md). `knockbackAmp` reads from any of the caster's note sources (actor, class, equips,
states) and applies to every knockback this battler deals. `thisKnockbackAmp` is the skill-scoped sibling, read from the
executing skill's own note only. Both sum additively with each other AND with `proximityKnockback` into one combined
percent, applied as a single multiplier to outgoing knockback.

## TAG USAGE

- Actors, for `knockbackAmp`.
- Classes, for `knockbackAmp`.
- Weapons, for `knockbackAmp`.
- Armor, for `knockbackAmp`.
- States, for `knockbackAmp`.
- Skills, for `thisKnockbackAmp`, on the executing skill.

## TAG FORMAT

`<knockbackAmp:PCT>`
`<thisKnockbackAmp:PCT>`
Where PCT is the percent bonus (or penalty, if negative) to apply.

## TAG EXAMPLES

`<knockbackAmp:50>`
`<thisKnockbackAmp:20>`    (placed on the signature skill itself)
A battler who always knocks back 50% farther, plus a signature skill that adds another +20% on top when it specifically
lands.