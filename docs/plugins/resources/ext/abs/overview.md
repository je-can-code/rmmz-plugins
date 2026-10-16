---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [resources-abs, overview]
version: "1.2.0"
---

# Overview

This plugin is an extension of [`J-Resources`](../../core/overview.md), enabling resource mutations that trigger during
combat rather than at the moment a skill is cast.

## Integrations

Integrates with others of mine plugins:

- [`J-Popups-Resources`](../../../popups/ext/resources/overview.md); on-attack and when-hit gains emit popups
  automatically.

## Details

Two new families of notetags are provided by this plugin:

- [ON-ATTACK tags](notetags/on-attack-gains.md) live on skills. Every time that skill lands a hit on-map, the caster is
  granted some amount of HP, MP, or TP.
- [WHEN-HIT tags](notetags/when-hit-gains.md) live on actors, classes, equips, or states. Every time that battler takes
  HP damage on-map, gains from all tagged sources are summed and applied to them.