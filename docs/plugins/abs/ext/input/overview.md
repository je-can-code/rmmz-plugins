---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [abs-input, overview]
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

## Note about notetags

This plugin has no notetags of its own. Everything here is exposed via plugin parameters (input remapping) and a
`Game_System` script call for resetting mappings to default- there's nothing to tag on database objects.