---
type: notetag
title: SDP Bonus Formula
description: The tag scaling the SDP points an actor gains by a formula, applied after the sdpMultiplier step.
tags: [sdp, tag, modifier, formula]
---

# SDP Bonus Formula

## Description

Need to scale the SDP points an actor gains from a JS formula rather than a flat percentage? Apply the `sdpBonusFormula`
tag to any valid notetag source. The formula is evaluated after the `sdpMultiplier` (SDR) step and its result is treated
as a bonus fraction — so a result of 0.20 means +20% more points. Multiple tags across different sources sum their bonus
fractions together before the final multiply, consistent with how other formula tags work here.

### Formula context

- `a` = the actor gaining SDP points
- `b` = 0 (unused; present for formula consistency)
- `v` = `$gameVariables._data`

### Useful formula helpers

- `a.getMasteryCount()` — number of subgroups the actor has currently mastered
- `a.level` — actor level
- `a.getTotalSdpRanks()` — sum of all ranked panel investments

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- States

## TAG FORMAT

`<sdpBonusFormula:[FORMULA]>`

## TAG EXAMPLES

`<sdpBonusFormula:[a.getMasteryCount() * 0.01]>`
An actor with 20 mastered subgroups gains an extra 20% SDP points on top of whatever the `sdpMultiplier` (SDR) already
provided.

`<sdpBonusFormula:[a.level * 0.005]>`
An actor at level 50 gains an extra 25% SDP points from this source.