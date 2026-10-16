---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [popups-resources, overview]
---

# Overview

This plugin adds visual popup feedback for the HP, MP, and TP costs and gains introduced by
[`J-Resources`](../../../resources/core/overview.md).

Have you ever wanted to see a popup fly off your character when a skill drains their HP, or when a hit-based gain
restores their MP mid-combat? Well now you can! Any time a `J-Resources` cost is paid or a gain is applied, a text popup
will appear over that battler's character on the map.

## Integrations

Integrates with others of mine plugins:

- [`J-Resources-ABS`](../../../resources/ext/abs/overview.md); on-attack and when-hit gains are covered automatically.

## Details

- HP cost popups appear in red tones.
- MP cost popups appear in blue tones.
- TP cost popups appear in yellow/green tones.
- Gain popups use the corresponding healing color tones.

NOTE: If `J-Resources-ABS` is also loaded, the on-attack and when-hit gains from that plugin go through the same
`Game_Battler` hooks and get popups for free.

## Note about notetags

This plugin has no notetags of its own.