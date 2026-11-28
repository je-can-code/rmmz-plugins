---
type: notetag
title: Pierce Damage Rate If State Type
description: The tag letting a battler's hits ignore a target's PDR and MDR resistance while it carries any active state of a given type.
tags: [abs, tag, damage, state, type, pierce]
---

# Pierce Damage Rate If State Type

## Description

While the target already carries at least one active state with the given type classifier (see the `<type:CLASSIFIER>`
notetag on states), this battler's physical and magical hits ignore the target's damage-rate resistance. Its PDR (for a
physical hit) or MDR (for a magical one) counts as no lower than 100%, so a target that would have taken 60% takes all
of it, and one that would have taken nothing takes all of it too.

A rate already at or above 100% is a vulnerability, and it stands: a softened target at 125% still takes 125%. A certain
hit never meets either rate, so this changes nothing for it, and heals are never pierced. The pierce reaches every path
a hit's damage takes, J-ABS-Formula's packets included, but not `<noDamage>`, which makes a battler immune to damage
outright rather than giving it a damage rate. So an invulnerability window built from 0% rates opens to a pierced hit,
while one built from `<noDamage>` stays shut.

A hit's damage is rolled before its effects land, so the hit that inflicts the state isn't pierced by it; every hit
after it is. A J-ABS-Formula on-hit packet riding that same hit is pierced, when the state comes from an Add State
effect, since those packets fire after the hit's effects.

Several tags naming different types pierce on any one of them. One matching state is enough; more add nothing.

## TAG USAGE

- Actors
- Classes
- Skills, while known (on every hit)
- Weapons
- Armor
- States, including passives.
- Enemies

## TAG FORMAT

`<pierceDamageRateIfStateType:TYPE>`
Where TYPE is the classifier string to check for (matched case-insensitively).

## TAG EXAMPLES

`<pierceDamageRateIfStateType:cc>`
Locked down on purpose: against any target held by a `cc`-typed state, this battler's hits land as though the target
had no physical or magical resistance at all.