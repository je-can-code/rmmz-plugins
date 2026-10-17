---
type: notetag
title: Auto-Apply State
description: The tag applying a real combat state to its bearer on a timer or a combat event.
tags: [passive-conditional, tag, state, trigger, condition]
---

# Auto-Apply State

## Description

Applies a normal JABS state (shield, buff, etc.) — not a passive grant.

### Conditions

PARAM is minimum FRAMES between applies (per source+state+condition):

- `time` — periodic while on the ABS map (interval = PARAM)
- `hpDmg` / `mpDmg` / `tpDmg` — combat loss via `gain* < 0` (not skill MP/TP pay)
- `anyDmg` — when HP, MP, or TP takes combat damage
- `whenCrit` — when THIS battler is critically hit (victim; not
  [`onCritApply`](../../../../crit/core/notetags/on-crit-state-application.md))
- `whenGlanced` — when THIS battler suffers a glancing blow (victim; implicit partial parry-reduced damage, not a
  miss); mutually exclusive with `whenCrit` on any single hit
- `negaStateAdded` — when a [`<type:negative>`](../../../../abs/core/notetags/states/negative.md) (`isNegativeType`)
  state is added
- `posiStateAdded` — when a non-negative state is added
- `anyStateAdded` — when any combat state is added
- `onHealHp`/`Mp`/`Tp` — when this battler's own HP/MP/TP is restored (`onSelfHeal`)
- `onAllyHeal` — when a battler within proximity of THIS battler is healed (any resource)
- `onKill` — when this battler defeats an enemy (`JABS_Engine#handleDefeatedEnemy`)
- `onDamageDealt` — when this battler lands damage on an opposing battler (`JABS_Engine#postExecuteSkillEffects`)
- `onWeaponHit` — narrower `onDamageDealt`: only Mainhand/Offhand-slot hits qualify (basic attack or its combo chain);
  skills fired from any other slot do not trigger this condition
- `move` — PARAM = whole TILES per apply (Pixelistics `updatePixelStepping`; requires `J-Pixelistics`)
- `stand` — PARAM = frames between applies while standing still on the map
- `enemiesNearby` / `alliesNearby` / `enemiesNearbyBelow` / `alliesNearbyBelow` — 4/5-value proximity tuples, same
  shape and semantics as [`autoExecuteSkill`'s proximity form](auto-execute-skill.md).

## NOTE ABOUT PASSIVE GRANTS

Do not also list the same state id in `<passive:[...]>` on the same row.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills

## TAG FORMAT

`<autoApplyState:[STATE_ID, CONDITION, PARAM]>`
Where STATE_ID is the state to apply,
Where CONDITION is one of the conditions above,
Where PARAM meaning depends on CONDITION (see the conditions above).

## TAG EXAMPLES

`<autoApplyState:[50, time, 900]>`
`<autoApplyState:[51, hpDmg, 60]>`
`<autoApplyState:[52, anyDmg, 120]>`
`<autoApplyState:[53, whenCrit, 120]>`
`<autoApplyState:[53, whenGlanced, 120]>`
`<autoApplyState:[54, negaStateAdded, 180]>`
`<autoApplyState:[55, posiStateAdded, 180]>`
`<autoApplyState:[56, anyStateAdded, 60]>`
`<autoApplyState:[57, onKill, 0]>`
`<autoApplyState:[58, onDamageDealt, 0]>`
`<autoApplyState:[59, onAllyHeal, 0]>`
`<autoApplyState:[MOMENTUM_ID, move, 2]>`
`<autoApplyState:[BUFF_ID, stand, 120]>`

`<autoApplyState:[ACCURACY_BUFF_ID, enemiesNearbyBelow, 1, 30, 1]>`
Every 30 frames, apply the accuracy buff while no enemy is within 1 tile (melee range).