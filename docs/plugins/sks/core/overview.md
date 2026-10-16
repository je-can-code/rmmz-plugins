---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [sks, overview]
---

# Overview

This plugin enables actors to equip skills into dedicated skill slots using a point-budget system. Each actor has a
number of slots and a pool of slot points; skills occupy a slot and cost points to equip, and only skills of the
configured equippable types appear in the equip scene.

## Integrations

Integrates with others of mine plugins:

- `J-Base`; required by all my plugins.
- [`J-Passive`](../../passive/core/overview.md); equipping a passive skill activates its perpetual state effect.

## Details

Each actor has both a maximum number of slots (`maxSlots`) and a maximum number of slot points (`maxSlotPoints`). These
are two independent capacities: slots limit how many skills can be equipped at once regardless of cost, and points limit
how much those equipped skills can collectively cost. Skills that belong to the configured equippable skill types can be
placed into slots, each consuming a number of slot points equal to their slot cost. The player manages equipped skills
through the [SKS equip scene](scenes/skill-equip.md), accessible from the menu when the configured menu switch is ON.

Skills tagged as "unslotted" are perpetually active and never appear in the equip scene. Skills whose type is not in the
equippable list are also treated as implicitly unslotted, meaning they remain freely available to whatever other system
manages them (such as JABS combat slot equipping).

## Exclusive Mode

By default, equipping a skill is gated by both slot count AND slot points together (tandem mode) - a skill must fit
within both the remaining slot count and the remaining point budget to be equipped. If you'd rather only one of those
two capacities matter, turn on [Exclusive Mode](parameters/enable-exclusive-mode.md) and choose which one governs
equipping via the [Slots Only](parameters/slots-only.md) config.

When Exclusive Mode is ON and Slots Only is ON, only slot count matters - slot points are never checked, so an actor can
equip anything as long as a slot is physically available (a la Digital Devil Saga's skill system).

When Exclusive Mode is ON and Slots Only is OFF, only slot points matter - slot count is never checked, so an actor can
equip anything as long as the point budget allows it, regardless of how many slots that occupies (a la Final Fantasy
IX's passive ability system).

When Exclusive Mode is OFF, Slots Only has no effect; tandem mode applies.