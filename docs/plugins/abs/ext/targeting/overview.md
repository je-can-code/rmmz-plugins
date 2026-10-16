---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [abs-targeting, overview]
---

# Overview

This plugin adds a cursor-driven target-selection mode to [JABS](../../core/overview.md).
[Skills flagged for targeting](notetags/targeted.md) pause combat (reusing the same soft-pause the JABS quick menu
already uses) and let the player aim a reticle at allies or enemies, scoped per skill, before the action fires.

Integrates with others of mine plugins:

- `J-Base`; to be honest this is just required for all my plugins.
- `J-ABS`; this is an extension of the core JABS engine.
- `J-ABS-InputManager`; needed so the cursor recognizes d-pad input the same way the standard controller's own menu
  windows do (its custom d-pad symbols aren't visible to the vanilla `Input.dir8` accessor).

## Details

TODO: flesh out once the targeting mode's shape is finalized.