---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [abs-dps, overview]
version: "1.0.0"
---

# Overview

`J-ABS-Dps` measures damage output. It watches the same moment [`J-ABS`](../../core/overview.md) already announces- a
skill effect landing on a target- and files each landed hit against the fight it happened in.

Nothing in this plugin changes gameplay. It only observes. It also draws nothing;
[`J-HUD-Dps`](../../../hud/ext/dps/overview.md) is the readout built on top of these numbers.

## Details

### The clock only runs in combat

A rate measured against wall time is mostly measuring the walk between fights. The clock here advances only while the
party is engaged, so out of combat every figure freezes and holds its last reading rather than decaying toward zero on
the way to the next encounter.

### Two rates, and the gap between them is the point

The rolling rate covers the last few seconds and answers "how hard is this hitting right now". The encounter rate covers
a whole fight, dodging and repositioning and cooldown idling included. A slow heavy weapon and a fast light one can tie
on one and be nowhere near each other on the other.

### An encounter ends at its last hit, not when combat is declared over

JABS keeps its in-combat countdown alive for between two and ten seconds after the fighting stops. That countdown
falling is the signal that a fight finished, but the fight is measured only as far as the last hit that landed- on a six
second encounter, letting the tail into the span would roughly halve every number it produced.

### Every member shares one clock

Damage is recorded per battler, but all of them are measured against the same encounter span. An ally who spent the
fight dead, stuck on terrain, or idling somewhere divides their small damage by the whole fight and reads low, which is
the entire signal. Giving each battler their own active-time denominator would make everyone look fine over whatever
slice of the fight they bothered to show up for.

## What counts

A hit is recorded when all of the following hold.

- The caster is an actor. This measures what the party puts out, and with teams in play an enemy striking another enemy
  would otherwise land here.
- The target is an enemy, and is not
  [inanimate](../../core/notetags/enemy-events/circumstantial-config-options.md#inanimate). Inanimate forces the neutral
  team, and JABS only declares combat between opposed teams, so nothing struck this way ever raises the in-combat flag.
  The clock would never start and the encounter would never close.

## Building a training dummy

Do NOT tag a dummy as [inanimate](../../core/notetags/enemy-events/circumstantial-config-options.md#inanimate). It reads
like the right tag- a dummy should not wander off- but inanimate puts the target on the neutral team, and a neutral
target is never opposed to the party, so hitting it is never combat. The clock stays frozen, every hit lands on the same
frame, and no rate can be measured at all.

Build it as an ordinary enemy instead:

- Fixed autonomous movement on the event, which is what actually keeps it still. Inanimate was never the thing stopping
  it from moving.
- [Sight](../../core/notetags/enemy-events/sight-radius.md) and
  [pursuit](../../core/notetags/enemy-events/pursuit-radius.md) of zero, so it never chases. As a bonus this lets JABS
  compress its own combat tail to two seconds, so the encounter closes promptly once the swinging stops.
- A large hp pool rather than the
  [invincible](../../core/notetags/enemy-events/circumstantial-config-options.md#invincible) flag. Invincible makes a
  battler untargetable outright, so nothing would ever connect with it.
- The action did not come from the tool or usable item slot. A thrown bomb is a statement about the bomb, not about the
  weapon being measured.
- The attack was not evaded.
- The hit dealt more than zero hp damage. A pure state application deals nothing, and a heal arrives as negative damage
  that would walk the figure backwards.