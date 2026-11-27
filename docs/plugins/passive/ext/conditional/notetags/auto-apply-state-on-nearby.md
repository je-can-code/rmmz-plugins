---
type: notetag
title: Auto-Apply State On Nearby
description: The tag applying a real combat state, aura-style, to every enemy or ally in proximity of its bearer.
tags: [passive-conditional, tag, state, aura, proximity]
---

# Auto-Apply State On Nearby

## Description

Aura-style sibling of [`autoApplyState`](auto-apply-state.md): instead of applying STATE_ID to the rule bearer, it
redirects onto every battler currently in proximity- enemies or allies depending on KIND. Good fit for "afflicts nearby
enemies" or "buffs nearby allies" passive auras.

### Kinds

Only four KIND values do anything here (every other `autoApplyState` CONDITION has no proximity set to iterate and
simply won't fire):

- `enemiesNearby` — targets nearby enemy JABS battlers
- `alliesNearby` — targets nearby allied JABS battlers, excluding the bearer itself
- `enemiesNearbyBelow` — same target set as `enemiesNearby`, gate inverted (see below)
- `alliesNearbyBelow` — same target set as `alliesNearby`, gate inverted (see below)

## NOTE ABOUT THE APPLICATION ROLL

Each pulse rolls for STATE_ID on every battler in range at a full 100% chance, through the same
[application roll](../../../../abs/core/notetags/states/state-application-immunity-resistance.md) as any other state
that lands by chance, with the bearer as the roller:

- the chance is scaled by each target's State Rate traits and `<stateTypeResist>`, and, when STATE_ID is
  `<type:negative>`, by the luck between the bearer and that target;
- the bearer's
  [lucky and cursed rolls](../../../../abs/core/notetags/skills/on-chance-roll-manipulation-lucky-cursed-rolls.md) go
  into every roll, and a target's curse weighs on it by STATE_ID's own polarity: a `<type:negative>` state is harm, so
  each curse is one more chance for it to land, and any other state is help, so each curse is one more hurdle for it to
  clear;
- the bearer's [Accumulate Mode](../../../../abs/core/notetags/skills/accumulate-mode.md) and
  [Encore Repeats](../../../../abs/core/notetags/skills/encore-repeats-bonus-proc-executions.md) can land it on a target
  more than once in a single pulse.

A target that cannot take STATE_ID at all, through an immunity or because it holds STATE_ID as a passive, is never
rolled for, and every landing checks the target's immunities on its own.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills

## TAG FORMAT

`<autoApplyStateOnNearby:[STATE_ID, KIND, MIN_COUNT, COOLDOWN_FRAMES, TRIGGER_TILES?]>`
Where STATE_ID is the state rolled for on every battler currently in proximity,
Where KIND is one of the four kinds above,
Where MIN_COUNT is the count threshold that gates the pulse. For `enemiesNearby`/`alliesNearby` the pulse fires at
MIN_COUNT or more in range; for the Below variants it fires strictly UNDER MIN_COUNT. Either way the pulse then hits
everyone CURRENTLY in range, not just MIN_COUNT of them- so a Below rule with MIN_COUNT 1 (the "nothing nearby" case)
can gate-pass while resolving zero targets, rolling for nobody that tick. MIN_COUNT 2+ reaches whatever stragglers
remain under the threshold,
Where COOLDOWN_FRAMES is tracked on the bearer, so the pulse cadence is consistent regardless of how many targets are
currently in range. It starts over on every pulse that rolls for at least one target, whether or not STATE_ID landed;
a pulse that finds nobody able to take STATE_ID leaves it where it was,
Where the optional fifth TRIGGER_TILES overrides the plugin's
[default proximity radius](../parameters/default-proximity-tiles.md) for this rule's gate only.

## TAG EXAMPLES

`<autoApplyStateOnNearby:[60, enemiesNearby, 1, 120]>`
Every 120 frames, if at least 1 enemy is within the default proximity radius, apply state 60 to every nearby enemy.

`<autoApplyStateOnNearby:[61, alliesNearby, 2, 300, 8]>`
Every 300 frames, if at least 2 allies (excluding the bearer) are within 8 tiles, apply state 61 to every nearby ally.

`<autoApplyStateOnNearby:[62, enemiesNearbyBelow, 3, 120]>`
Every 120 frames, if fewer than 3 enemies are within range, apply state 62 to whichever enemies (0-2 of them) are still
around.