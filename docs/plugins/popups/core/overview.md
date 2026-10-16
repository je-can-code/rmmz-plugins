---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [popups, overview]
version: "2.2.1"
---

# Overview

This plugin is the core of the `J-Popups` system.

Have you ever wanted floating text popups on your map for damage, healing, experience, loot, and more? Well now you can!
This plugin provides the infrastructure for building and displaying text popups on map characters, and is designed to be
extended by the various `J-Popups` extension plugins.

## Integrations

Integrates with others of mine plugins:

- [`J-Popups-ABS`](../ext/abs/overview.md); combat damage, healing, loot, and reward popups.
- [`J-Popups-APT`](../ext/apt/overview.md); aptitude point reward popups.
- [`J-Popups-SDP`](../ext/sdp/overview.md); SDP point reward popups.
- [`J-Popups-Resources`](../ext/resources/overview.md); skill cost and hit-based resource gain popups.

## Details

Popups are built using the `TextPopBuilder` fluent interface, placed into a layout ring on a map character, and rendered
by `Sprite_Damage`. Each extension plugin provides its own builders for the popup types it needs.

NOTE: Listeners on the optional `PopupEmitter` (`J.POPUPS.Helpers.PopupEmitter`) must stay cheap- no heavy work per
frame. Event names live in `J.POPUPS.EventNames`.

## Note about notetags

This plugin has no notetags of its own- it is purely a fluent builder/rendering infrastructure that its extensions (ABS,
APT, SDP, Resources) build popups on top of.