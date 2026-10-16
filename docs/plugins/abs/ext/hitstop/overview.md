---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [abs-hitstop, overview]
version: "1.0.3"
---

# Overview

This plugin adds "hitstop" to [JABS](../../core/overview.md): a brief freeze-frame pause applied to the attacker, the
target, and the delivering action event the instant a hit connects. It's the classic "impact frame" trick used to make
hits feel heavier without touching damage numbers.

## Integrations

Integrates with others of mine plugins:

- `J-Base`; to be honest this is just required for all my plugins.

## Details

A skill's hitstop duration (in frames) is resolved from a [base amount](notetags/hitstop-duration-per-skill.md), then
adjusted by whether the hit was a critical, whether it was guarded, and whether it was parried, then scaled by the
target's own [hitstop sensitivity](notetags/hitstop-sensitivity-per-battler.md), then clamped to the configured max. A
parried hit always resolves to zero hitstop, regardless of any other tag.

## Tuning

This plugin has no editable plugin parameters. All base tuning (default hitstop frames, crit bonus, guard scale, max
frames, flurry decay/window, screen-shake power/speed/cooldown, etc.) is hardcoded in
`JHitstop_PluginMetadata#initializeMetadata` and adjusted by editing that file directly if you need different defaults
for your project.