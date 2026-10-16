---
type: notetag
title: Auto-Modify Cooldowns
description: The tag shortening or lengthening its bearer's own active skill-slot cooldowns on a combat event.
tags: [passive-conditional, tag, cooldown, skill, trigger]
---

# Auto-Modify Cooldowns

## Description

Directly modifies one or more of the bearer's own active skill-slot cooldowns- no skill or state is executed/applied,
this tag mutates cooldown timers in place.

### Unit

UNIT (required):

- `percent` — AMOUNT is a percentage of each targeted cooldown's own full/total duration (not however much of it
  happens to remain), so a kill always refunds a consistent, predictable chunk regardless of timing.
- `flat` — AMOUNT is a literal frame count, applied directly regardless of that skill's length.

### Range

RANGE (optional, defaults to "all"):

- `single` — exactly one named slot; requires TARGET_KEY.
- `combat` — the four combat-skill slots only.
- `all` — mainhand, offhand, tool, dodge (mobility skills equip here), and all four combat skills. Deliberately
  excludes GCD/usable-item slots.

### Target key

TARGET_KEY (required only when RANGE is "single"): an author-facing slot name — `mainhand`, `offhand`, `tool`,
`dodge`, or `skill1`-`skill4` (`combatskill1`-`4` also accepted); raw `JABS_Button` keys pass through unchanged.

## NOTE ABOUT ACTIVE COOLDOWNS

Only slots that are both equipped and currently mid-cooldown (frames > 0) are touched- a slot that's already ready has
nothing to modify.

## NOTE ABOUT WIRED CONDITIONS

Built on the same condition framework as the rest of this family, but only a subset of pumps are currently wired for
this tag (see `AutoModifyCooldownManager`): `onKill`, and `negaStateInflicted`/`posiStateInflicted`/`anyStateInflicted`
(this battler inflicts a state onto someone else- the effect lands back on the inflictor, not the afflicted target).
Other conditions parse correctly but will not yet fire until their pump call sites are wired.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills

## TAG FORMAT

`<autoModifyCooldowns:[AMOUNT, CONDITION, THROTTLE_FRAMES, UNIT, RANGE?, TARGET_KEY?]>`
Where AMOUNT, unlike its siblings, is a signed modification amount, not a database id: negative reduces a cooldown,
positive increases it,
Where CONDITION is the condition the rule fires on (see the wired conditions above),
Where THROTTLE_FRAMES is the same per-rule minimum-frames-between-dispatches gate every other tag in this family uses,
Where UNIT is one of the units above,
Where RANGE is one of the ranges above,
Where TARGET_KEY is the slot name above.

## TAG EXAMPLES

`<autoModifyCooldowns:[-10, onKill, 0, percent, all]>`
On every kill, no throttle: -10% of full duration off every active mainhand/offhand/tool/dodge/combat-skill cooldown.

`<autoModifyCooldowns:[-60, onKill, 0, flat, all]>`
Same trigger/range, but a flat 60-frame (1 second) refund regardless of each skill's own total duration.

`<autoModifyCooldowns:[-15, onKill, 0, percent, combat]>`
Restricted to the four combat-skill slots only.

`<autoModifyCooldowns:[-25, onKill, 0, percent, single, mainhand]>`
Restricted to the mainhand slot only.

`<autoModifyCooldowns:[-10, onKill, 0, percent]>`
RANGE omitted- defaults to "all".

`<autoModifyCooldowns:[-60, negaStateInflicted, 0, flat, all]>`
Every time this battler inflicts a negative-tagged state on an opponent, no throttle: refund a flat 60 frames (1
second) off every active cooldown.