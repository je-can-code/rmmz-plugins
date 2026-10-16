---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [drops-passive, overview]
---

# Overview

[`J-DropsControl`](../../core/overview.md) reads the `<drops:[...]>` tag off the enemy being defeated and nothing else.
This extension widens that search to include states: the ones riding the defeated enemy, and the ones riding the party
that killed it.

## Integrations

Integrates with others of mine plugins:

- `J-Base`; to be honest this is just required for all my plugins.
- `J-DropsControl`; this is an extension of that plugin's drop sources.
- `J-Passive`; passive skill states are the intended vehicle for this.

## Details

A state is a convenient place to hang a drop because it can arrive from a dozen directions- a passive skill, a piece of
equipment, a buff someone cast, a story flag applied at a cutscene- and every one of those ends up asking the same
question of the same tag. Rather than teach each of those systems to publish drops, this teaches drops to read states.

### Why this is an extension and not the default

"Everything the party is currently buffed by can change what an enemy drops" is a strong flavor. It makes loot tables
depend on party composition, which is either the entire point of your build system or an unpleasant surprise that makes
your drop rates impossible to reason about. Loading this plugin is how you opt into the first reading.