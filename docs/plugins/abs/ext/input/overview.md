---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [abs-input, overview]
version: "2.4.0"
---

# Overview

This plugin is a mapping of inputs to controls for JABS.

This plugin requires [JABS](../../core/overview.md). This plugin has no additional configuration required.

## Details

This entire plugin provides an implementation of a "controller" that the player leverages to control inputs for JABS.
With it, the player can press keys or buttons to trigger JABS-specific functionality, like execution of a skill, cycling
with other members of the party, or bringing up the quick menu. This plugin also provides a way to
[remap inputs](scenes/jabs-remap.md) to different keys or buttons to suit the player's preferences.

### Note about duplicates

No single input can be mapped to multiple actions. Mapping the same input to a second action will unbind the original.
Be sure all actions you care about are mapped! These cannot be undone mid-run by the player! (but they can there is an
exposed function on `Game_System` that will reset all input mapping back to defaults via script call if necessary).

### Ally commands

With `J-ABS-AllyAI` installed, the controller also gives four orders to the party's allies, one per flick of the right
stick by default, with WASD standing in for the stick on a keyboard:

- **Up** (W), Ally Charge: sends the allies charging in.
- **Down** (S), Ally Pull Back: drops them out of the fight for a few seconds.
- **Left** (A), Stance: Safer: steps the party's stance one rung toward hanging back.
- **Right** (D), Stance: Bolder: steps it one rung toward leading the charge.

Each key feeds the same input as its flick, so rebinding an order moves the key and the flick together. W takes the
place of vanilla's spare page-down key; E carries page-down in JABS, so guarding and paging through menus are
unaffected.

Nothing else reads the right stick, so each of its four directions is a button of its own. A flick has to push the
stick 70% of the way out, firmer than walking with the left stick, so a thumb resting on it gives no orders, and only
the axis pushed harder counts, so a diagonal flick gives one order rather than two.

All four orders are carried out by `J-ABS-AllyAI`. Without it, they are never listened for and do not appear in the
[remap scene](scenes/jabs-remap.md). Like every other action, each can be rebound to any key or button.

## Note about notetags

This plugin has no notetags of its own. Everything here is exposed via plugin parameters (input remapping) and a
`Game_System` script call for resetting mappings to default- there's nothing to tag on database objects.