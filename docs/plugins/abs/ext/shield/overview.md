---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [abs-shield, overview]
---

# Overview

This plugin provides the ability to create state-based HP shields that can be used to protect actors from damage.

## Integrations

Integrates with others of mine plugins:

- `J-Base`; to be honest this is just required for all my plugins.
- [`J-ABS`](../../core/overview.md); this plugin is an extension to JABS.
- `J-Elementalistics`; considers all elements for shield typing/bypassing.
- `J-HUD-Party`; the shield gauge will be rendered above the hp gauge.
- `J-Popups` (+ `J-Popups-ABS`); shield damage popups will be generated.

## Details

Provides the standard in HP shield mechanics for JABS. States own the shield and can be used to protect actors from
damage in varying ways. The shields always will have a maximum amount that it can absorb
([cap](notetags/shield-caps.md)).

### Shield/state expiration

When a shield breaks (as in, reduced to zero), the state will be removed. This means one should probably make shield
states unique from other effects unless it is desired that the effects of the state are lost when the shield breaks.
Inversely, when a state owning a shield expires, the shield is removed with the state.

### Stacking

[Stacking](../../core/notetags/states/stack-type.md) works about like one might envision: a shield with stacks will be
multiple instances of the same shield. When damage is dealt to a battler with a shield state applied having a stack
greater than 1, the damage will iterate through each stack until damage is fully absorbed, or until the state's stacks
are depleted. The exception to the "stack iteration" is when a state also has the
[`shieldProtect`](notetags/shield-protect.md) tag, in which case only one stack can ever be removed per application of
damage (because any overflow will be negated by the protect functionality instead of carried to the next stack). This
means you could potentially apply a shield state with something like 10 stacks of 1 shield point, and it will
effectively mitigate 10 hits- assuming each hit deals at least 1 damage.

### Slip damage

Currently, [slip damage](../../core/notetags/states/slip-damage.md) (aka damage over time) is not mitigated by shields.
It will apply directly to the battler, leaving shields intact. This may change in a future update.

## Plugin parameters and commands

There are no plugin parameters/commands for this plugin. They are mostly just states, so work with them as you would
any other state.