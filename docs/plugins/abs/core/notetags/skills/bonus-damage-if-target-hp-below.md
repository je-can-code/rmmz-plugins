---
type: notetag
title: Bonus Damage If Target HP Below
description: The tags adding an execute-style bonus that grows as the target's hp drops under a threshold.
tags: [abs, tag, damage, hp, execute]
---

# Bonus Damage If Target HP Below

## Description

Execute-style bonus that SCALES CONTINUOUSLY as the target's hp keeps dropping- not a flat one-time bonus. The gate
opens once the target's current hp% is at or under THRESHOLD_PCT; once open, the bonus grows by PCT_PER_POINT for every
percentage point the target is under that threshold. `bonusDamageIfTargetHpBelow` reads from the caster's notes
(actor, class, equips, states)- good fit for a "the lower they are, the harder you hit" passive.
`thisBonusDamageIfTargetHpBelow` is the skill-scoped sibling, useful for a dedicated execute/finisher skill. Multiple
tags of either kind, on any number of sources (including multiple thresholds on the same source), stack additively.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States, including passives.
- Enemies
- Skills, for `<thisBonusDamageIfTargetHpBelow>`.

## TAG FORMAT

`<bonusDamageIfTargetHpBelow:[THRESHOLD_PCT, PCT_PER_POINT]>`
`<thisBonusDamageIfTargetHpBelow:[THRESHOLD_PCT, PCT_PER_POINT]>`
Where THRESHOLD_PCT is the hp% ceiling that opens the gate.
Where PCT_PER_POINT is the percent bonus added per percentage point the target is currently under THRESHOLD_PCT.

## TAG EXAMPLES

`<bonusDamageIfTargetHpBelow:[50, 2]>`
"the big red button": meaningful at 70%, ugly at 30% or lower. At 51% hp: +0% (gate not open).
At 50%: +0% (just crossed). At 30%: +40% (20 points under 50, times 2). At 10%: +80% (40 points under 50).