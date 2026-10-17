---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [hud-target, overview]
version: "2.1.0"
---

# Overview

This plugin is an extension of the [`J-HUD`](../../core/overview.md) plugin, designed for JABS. It generates a window
on the map displaying a given target.

The following data points are currently supported:

- The enemy battler's name.
- The enemy battler's ["text"](notetags/target-frame-text.md).
- An [icon](notetags/target-frame-icon.md).
- The enemy's HP gauge.
- The enemy's MP gauge.
- The enemy's TP gauge.

## Setup

This plugin creates a window, which contains gauges representing the target that is currently set. No images are
needed: the gauges are drawn the same way as the rest of the HUD's gauges, trail and all- when the target loses some of
a gauge, the lost amount turns red and drains away, and when it gains some back, the gained amount shows in green and
the gauge fills in.