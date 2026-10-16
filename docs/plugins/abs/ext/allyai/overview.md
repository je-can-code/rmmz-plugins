---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [abs-allyai, overview]
---

# Overview

This plugin grants party followers AI to fight alongside the player. Ally behavior is governed by three orthogonal axes
and a do-nothing toggle.

This plugin requires `J-ABS`. This plugin requires followers be enabled to do anything.

## Details

All party members represented by followers on the field are granted AI for action decision-making and movement
positioning while in combat.

Each ally's behavior is shaped by three independent axes:

### Risk (careful / balanced / reckless)

Controls how aggressively the ally selects offensive skills. Careful allies lean on battle memories; reckless allies
always press the strongest available skill.

### Support (offense / balanced / support)

Controls how much the ally weighs healing and buffing against offense. Support allies prioritize cleansing > healing >
buffing before attacking. Balanced allies conditionally support when allies are in danger.

### Spacing (frontline / midline / backline)

Controls how close the ally positions itself relative to its target. Frontline allies close to melee range; backline
allies hold at max skill range and maintain a shorter leash from the leader.

### Presets

The ten named presets snap all three axes to a coherent archetype:

| Preset | Risk | Support | Spacing |
|---|---|---|---|
| `berserker` | reckless | offense | frontline |
| `guardian` | careful | offense | frontline |
| `vanguard` | balanced | balanced | frontline |
| `war-priest` | balanced | support | frontline |
| `skirmisher` | balanced | offense | midline |
| `generalist` (default) | balanced | balanced | midline |
| `cleric` | careful | support | midline |
| `artillery` | careful | offense | backline |
| `wizard` | balanced | offense | backline |
| `medic` | careful | support | backline |

### Do-nothing toggle

A separate DO-NOTHING toggle overrides all axis behavior: the ally takes no actions and backs away from all targets,
staying near the leader.

## Battle memories

Allies accumulate battle memories as they fight. A memory records which skills proved effective against a given enemy.
Careful and balanced allies use these memories to inform skill selection; reckless allies use them only as a secondary
signal when picking the strongest skill.

## Aggro/passive toggle

A party-wide toggle controls engagement behavior. When Passive, allies only fight when the leader attacks or when struck
directly. When Aggressive, allies engage any enemy that enters their sight range.

## Caveats to note

- When party-cycling, all allies will be pulled to the player and all aggro will be removed (so they don't just try to
  resume fighting).
- When an ally is defeated, party-cycling will skip over them and they will follow the player like a normal
  non-battler follower.