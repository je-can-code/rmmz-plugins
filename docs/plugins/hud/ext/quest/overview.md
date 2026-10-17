---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [hud-quest, overview]
version: "1.1.0"
---

# Overview

This plugin is an extension of the [`J-HUD`](../../core/overview.md) plugin. It will display quests and their
objectives and the player's progress as in realtime.

It will show and hide with the rest of the HUD, and will only reveal quests that are flagged as "tracked" in the
questopedia.

## Integrations

Integrates with others of mine plugins:

- `J-Base`; to be honest this is just required for all my plugins.

## Details

Quest and objective data is sourced from the Omni/Questopedia system (see `J-Omni-Quest`), not from notetags of any
kind- this plugin is purely a display frame that reads tracked quest state and renders it.

## Note about notetags

This plugin has no notetags of its own.