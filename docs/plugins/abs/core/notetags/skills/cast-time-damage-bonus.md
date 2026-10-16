---
type: notetag
title: Cast Time Damage Bonus
description: The tags scaling direct HP/MP damage from skills by their resolved cast time.
tags: [abs, tag, skill, damage, cast]
---

# Cast Time Damage Bonus

## Description

Scales direct HP/MP damage from skills that have a resolved cast time greater than zero.
Read at damage resolution from the cast duration stamped on the shared `Game_Action` when the JABS action volley was
created (same value as `JABS_Action#getCastTime` after cast speed).

Does NOT affect healing/recovery, slip DoT ticks, or state-only skills. DoT amplification belongs in a future DoT
pipeline revamp (see backlog abs-dot-slip-revamp).

Formula:

```text
bonusPct = sum(all N per sec tags) × (castFrames / 60)
finalDamage = round(baseDamage × (1 + bonusPct / 100))
```

No cap. Faster cast speed (`J-ABS-Timing`) reduces wait time and therefore reduces bonus.

### Cast Time Damage Bonus (passive / equipment / state)

Reads from `getAllNotes()` sources. Fires on every qualifying direct-damage skill hit.

### This-Skill Cast Time Damage Bonus (on a specific skill)

Reads from `this.item()` only. Stacks additively with `castTimeDamageBonus` sources.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills; `<thisCastTimeDamageBonus>` goes on a specific skill only.

## TAG FORMAT

`<castTimeDamageBonus:N>`
Where N is integer percent bonus per second of resolved cast time.

`<thisCastTimeDamageBonus:N>`

## TAG EXAMPLES

`<castTimeDamageBonus:12>`
Lamia Focusing Beam mastery passive (+12% per second of cast).

`<castTime:180>`
`<thisCastTimeDamageBonus:20>`
Signature laser (+20% per second on this skill alone).
A 3-second cast → +60% from this tag alone (+36% more if mastery also has 12/sec).