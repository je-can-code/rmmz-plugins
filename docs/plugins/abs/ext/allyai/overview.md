---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [abs-allyai, overview]
version: "3.2.0"
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

## Stances

The party picks one stance for its allies. A stance decides where an ally keeps itself around the leader while there is
nothing to fight, and whether it goes into a fight before the leader does. How it fights once it is in one is still its
preset's business.

| Stance | Where the ally keeps itself | Goes in first |
|---|---|---|
| `safe-support` (default) | 1-3 tiles behind the leader | no |
| `bloody-wanker` | at the leader's side, on whichever side it is already nearer | yes |
| `meat-shield` | 1-3 tiles ahead of the leader | yes |

Each stance is a zone rather than a single tile, so an ally anywhere inside it stays put. One that strays walks back to
the nearest edge, and sprints if it has strayed far, which is what lets an ally kept ahead of the leader get back in
front after a turn. The zone turns with the leader, but only once they have held a new facing for half a second, so a
glance at a sign does not send anyone running laps.

Several allies share a stance by taking lanes: the first keeps the middle, and the rest spread out to either side of it.

### Every stance answers the leader

Whatever its stance, an ally joins the fight when the leader lands a hit on something that fights back, and when the
leader is struck. Either one rallies the ally toward that foe, and it engages once something is in sight. An ally that
is struck itself fights back too. Smashing a crate rallies nobody.

## Ally commands

Four orders reach every ally at once, from the buttons J-ABS-InputManager binds to the right stick's flicks, and to
WASD on a keyboard:

- **Charge** (up, or W) sends each ally after whatever the leader is fighting, or failing that the nearest foe in sight,
  whatever its stance would have it wait for.
- **Pull back** (down, or S) drops each ally out of its fight and keeps it out of every fight for three seconds, during
  which it can be neither rallied nor alerted.
- **Stance: Safer** (left, or A) and **Stance: Bolder** (right, or D) step the party's stance one rung along the ladder
  the menu lists them in, from Safe Support to Meat Shield. The ladder does not wrap: a step past either end plays
  the buzzer and changes nothing. A step that lands plays a cursor sound and, with J-Log installed, writes the new
  stance to the map's action log.

## Caveats to note

- When party-cycling, all allies will be pulled to the player and all aggro will be removed (so they don't just try to
  resume fighting).
- When an ally is defeated, party-cycling will skip over them and they will follow the player like a normal
  non-battler follower.