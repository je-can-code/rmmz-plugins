---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [passive-affix, overview]
version: "1.3.0"
---

# Overview

This plugin is an extension of [`J-Passive`](../../core/index.md) for [`J-ABS`](../../../abs/core/overview.md).

It adds a passive "affix" system to JABS map enemies so they can spawn with a random tier prefix and/or suffix (both
weighted), and it decorates the name presentation on the map and in the target HUD.

## Details

This plugin is intentionally layered behind a simple policy: If an event explicitly defines passive state ids via
`<passive:[...]>`, then those ids win and no random affix rolling occurs for that spawn.

Otherwise, prefix/suffix affixes are rolled from state-defined pools and applied as passive states to the spawned enemy
battler.

## Passive affix RNG (map enemies)

Have you ever wanted "Wicked Slime" or "Slime of Frost" to be a thing, but still want full control when you need it?
Well now you can! By applying the appropriate tags to your states and enemies (and optionally event comments), you too
can have JABS enemies spawn with weighted passive affixes.

### Tag usage

- States (prefix/suffix pool membership + weights)
- Enemies (block RNG and/or override chances)
- Events (Comment commands on the pfage that spawns the enemy)

### Policy / precedence

- (0) If the "[Random Affix Switch](parameters/rng-enabled-switch.md)" parameter names a switch and that switch is OFF,
  no random affix rolling occurs at all. Explicit affixes below are unaffected by it.
- (1) If the event has an explicit `<passive:[...]>` list that contains any affix ids, then that list is applied and no
  random affix rolling occurs.
- (2) Otherwise, prefix and suffix are rolled independently by chance + pool.
- (3) Event comment overrides beat enemy note overrides, which beat the plugin defaults.

## Gating random affixes behind a switch

Have you ever wanted affixes to not exist yet? Perhaps the world is supposed to be ordinary until the story says
otherwise, and an early rat wearing a suffix would give the whole thing away. Well now you can hold them back! Pick a
switch in the "[Random Affix Switch](parameters/rng-enabled-switch.md)" plugin parameter, and no random affix rolls
until that switch is ON.

### Notes

- Leaving the parameter at 0 means no gate at all, which is how this plugin behaved before the parameter existed. An
  unset switch changes nothing.
- The gate covers ONLY the random pools. An affix written onto an event or an enemy is a statement about that specific
  encounter, and those are applied whether the switch is on or off.
- The switch is read when a battler spawns. Enemies already standing on the map when the switch flips keep whatever they
  rolled, so put the story event somewhere the player leaves the map afterward.

## Plugin parameters

Have you ever wanted to tune the default prefix/suffix roll chances without tagging every enemy? Well now you can! By
configuring the parameters below, you too can set the global defaults used when no overrides are present.

- [Default Prefix Affix Chance](parameters/default-prefix-chance.md)
- [Default Suffix Affix Chance](parameters/default-suffix-chance.md)
- [Random Affix Switch](parameters/rng-enabled-switch.md)