---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [abs-loadout, overview]
---

# Overview

This plugin adds [a single scene](scenes/jabs-loadout.md) showing every party member's assignable combat slots at once,
and lets the player change any of them.

## Integrations

Integrates with others of mine plugins:

- `J-Base`; to be honest this is just required for all my plugins.
- [`J-ABS`](../../core/overview.md); the skill slots being managed belong to JABS.
- [`J-ABS-InputManager`](../input/overview.md); when present, slots are labelled with the inputs currently bound to
  them rather than with fixed button names.

## Details

This replaces the five separate assignment flows that previously lived on the JABS quick menu- offhand, combat skills,
dodge, tools, and usable items. Each of those opened a pair of on-map windows, and every one of them operated on the
party leader alone, meaning an ally's loadout could not be adjusted without first making that ally the leader.

Here, every member is shown side by side. Moving between them is ordinary horizontal cursor movement, because they are
literally adjacent columns.

The mainhand slot is deliberately absent. It is supplied by whichever weapon the actor has equipped rather than chosen
by the player, so presenting it would imply an assignment that cannot be made.

## About combat skill inputs

Combat skills are not bound to inputs directly. Each is the skill trigger modifier held alongside one of the primary
buttons, so the input shown for those slots is assembled from the current binding of both halves. Remapping either half
is reflected here immediately.

## Note about notetags

This plugin has no notetags of its own- the slots it manages are defined by JABS, and their contents are chosen by the
player rather than tagged.