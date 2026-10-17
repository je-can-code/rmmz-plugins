---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [hud-input, overview]
version: "1.3.0"
---

# Overview

This plugin is an extension of the [`J-HUD`](../../core/overview.md) system.

This is the Input Frame, which displays the various action keys and their corresponding cooldown and cost data points
for the leader of the party.

This plugin requires JABS. This plugin requires the [base HUD](../../core/overview.md). See
[plugin parameters](parameters/cooldown-overlay-icon-index.md) for configuration options.

## Details

This includes the following data points for the currently selected leader:

- mainhand, offhand, tool, and dodge/sprint action keys.
- while holding the skill trigger, skill keys show instead.
- ability costs for all keys, or item count remaining for tool.

## Note about notetags

This plugin has no notetags of its own- it purely reads live JABS skill slot/cooldown/cost data for display.