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
Where STATE_ID is the state applied to every battler currently in proximity,
Where KIND is one of the four kinds above,
Where MIN_COUNT is the count threshold that gates the pulse. For `enemiesNearby`/`alliesNearby` the pulse fires at
MIN_COUNT or more in range; for the Below variants it fires strictly UNDER MIN_COUNT. Either way the pulse then hits
everyone CURRENTLY in range, not just MIN_COUNT of them- so a Below rule with MIN_COUNT 1 (the "nothing nearby" case)
can gate-pass while resolving zero targets, applying to nobody that tick. MIN_COUNT 2+ still lands on whatever
stragglers remain under the threshold,
Where COOLDOWN_FRAMES is tracked on the bearer, so the pulse cadence is consistent regardless of how many targets are
currently in range,
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