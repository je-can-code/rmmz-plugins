---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [motion-passive, overview]
version: "1.0.0"
---

# Overview

[`J-Motion-ABS`](../abs/overview.md) lets an APPLIED state declare a motion. This lets a PASSIVE one do the same. It
adds no tag and no parameter of its own- the whole plugin is one more place the
[`<motion:...>`](../../core/notetags/motion.md) tag is honoured.

## Integrations

Integrates with others of mine plugins:

- [`J-Base`](../../../_base/core/overview.md); to be honest this is just required for all my plugins.
- [`J-ABS`](../../../abs/core/overview.md); a battler needs a presence on the map before it can be animated.
- [`J-Motion`](../../core/overview.md); this extension is meaningless without motion.
- [`J-Motion-ABS`](../abs/overview.md); the bridge between a battler and its character lives there.
- [`J-Passive`](../../../passive/core/overview.md); this extension is meaningless without passive states.

## Details

### Why this is a separate plugin

An applied state announces its own arrival and departure, so `J-Motion-ABS` animates one by listening. A passive
announces neither. Passives are granted by rebuilding the whole set from every source a battler owns- its own row, its
states, its skills, its equipment, the event that spawned it- and they are refused by the ordinary state-adding path
outright, so there is no arrival to hear.

This plugin therefore reconciles instead of listening: whenever that set is rebuilt, it asks what the battler is
carrying now and settles the difference. That is a genuinely different mechanism, which is why it is a genuinely
different plugin rather than a few more lines in `J-Motion-ABS`.

### What that buys you

Because it reconciles, it never goes stale:

- An affix rolled onto an enemy at spawn animates from its first frame.
- A passive granted by a weapon starts and stops with the equipping.
- A passive that [`J-Passive-Conditional`](../../../passive/ext/conditional/overview.md) gates on and off mid-fight
  starts and stops the motion with the gate, without either plugin knowing about the other.
- Party cycling moves the leader's passive motions to whoever is leading now, rather than stranding them on the
  character the player drives.

### Stacks

A passive applied several times over animates once. Three stacks of the same state are still one thing the sprite is
doing, and animating it three times would move the sprite three times as far as the tag asked for.

## Which motion wins

Most of the time, nothing wins- motions compose. Two things scaling a sprite multiply together, two things nudging it
add up, and motions driving different channels never meet at all.

Contests only happen where a motion CLAIMS a channel, which combat reactions do so that a hit reads exactly as tuned
instead of compounding with whatever ambient wobble the character had. Among claimants the ranking decides it, weakest
to strongest: [event page](../../core/notetags/motion.md), passive,
[applied state](../abs/overview.md#motions-on-states), [plugin command](../../core/commands/apply-motion.md), combat
reaction.

A held size is not a wobble, so it is not suppressed. An enemy at 150% that gets hit squishes AROUND its own size rather
than snapping to normal for the length of the hit- the reaction still reads as tuned, and the creature stays the size it
is.