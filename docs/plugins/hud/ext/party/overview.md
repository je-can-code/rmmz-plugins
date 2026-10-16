---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [hud-party, overview]
---

# Overview

This plugin is an extension of the [`J-HUD`](../../core/overview.md) system.

This is the Party Frame, which displays the leader and allied members that the player currently has in their party.

This plugin requires JABS. This plugin requires the [base HUD](../../core/overview.md). This plugin has no additional
configuration required.

## Details

This includes the following data points for all actors:

- face portrait
- hp gauge
- mp gauge
- tp gauge

And the additional following data points for the currently selected leader:

- current level
- experience gauge
- positive/negative state tracking
- in combat indicator
- shield gauge (if using `J-ABS-Shield`)

## Note about notetags

This plugin has no notetags of its own- it purely reads live battler data for display.