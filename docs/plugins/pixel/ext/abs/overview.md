---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [pixel-abs, overview]
---

# Overview

This plugin is `J-ABS-Pixelistics`: the JABS integration layer for [`J-Pixelistics`](../../core/overview.md).

It adapts JABS-specific behavior (ally AI formation movement, JABS battler hitbox queries, action/projectile pixel
distance scaling, and the dodge step-count multiplier) to work with the fractional-coordinate system provided by
`J-Pixelistics`.

## Requirements

- [`J-Base`](../../../_base/core/overview.md) (any recent version)
- [`J-ABS`](../../../abs/core/overview.md) (v4.11.0+)
- [`J-Pixelistics`](../../core/overview.md) (v1.0.0+)

Load order in RPG Maker plugin manager:

`J-Base` → `J-ABS` → `J-Pixelistics` → `J-ABS-Pixelistics`