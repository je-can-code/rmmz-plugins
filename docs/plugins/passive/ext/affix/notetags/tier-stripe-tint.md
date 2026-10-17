---
type: notetag
title: Tier Stripe / Tint
description: The tag setting the color a prefix state tints its map nameplate stripe, and optionally its HUD name row.
tags: [passive-affix, tag, state, affix, prefix, tier, color, hud]
---

# Tier Stripe / Tint

## Description

Have you ever wanted your tier prefix to communicate its tier visually on the map (and optionally in the HUD), without
forcing every prefix to have a color? Well now you can! By applying a tier hex tag to a prefix state, you too can tint
the map nameplate stripe (and optionally the HUD name row).

## NOTE ABOUT THE DEFAULT

No tag means no stripe tint. Full stop.

## TAG USAGE

- States, on a prefix state.

## TAG FORMAT

`<tier-color-hex:#RRGGBB>`

## TAG EXAMPLES

`<tier-color-hex:#FF0000>`
Uses a bright red stripe tint when this prefix is the selected tier prefix.