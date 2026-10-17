---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [passive-otib, overview]
version: "1.1.1"
---

# Overview

This plugin is an extension of [`J-Passive`](../../core/overview.md) that implements One-Time Item Boosts (OTIB):
consuming a tagged item permanently grants the actor one or more database States whose Traits carry the actual stat
effects.

Those states are fed through `J-Passive`'s pipeline so they appear alongside all other passive contributors and can be
inspected in [`Scene_Passive`](../../core/scenes/passive.md).

## Integrations

Integrates with others of mine plugins:

- `J-Base`; required by all JE plugins.
- `J-Passive`; provides the passive state pipeline and the Passive Viewer.

## Details

Unlike the legacy OTIB implementation, this plugin does NOT patch `param` / `xparam` / `sparam` directly. All stat
effects are expressed through database State Traits, giving designers full control over what each item unlocks.

Unlock records are persisted on each actor as plain JSON-safe data and are rebuilt into the passive pipeline on every
`refreshPassiveStates()` call, so no custom serialization classes are needed.