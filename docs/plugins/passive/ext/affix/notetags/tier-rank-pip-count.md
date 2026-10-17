---
type: notetag
title: Tier Rank (Pip Count)
description: The tag ranking a prefix state's tier, drawn as that many thin pips on the map nameplate stripe.
tags: [passive-affix, tag, state, affix, prefix, tier, pips]
---

# Tier Rank (Pip Count)

## Description

Have you ever wanted the map nameplate stripe to communicate not just that a prefix is special, but how special, without
forcing players to memorize five different tier colors? Well now you can! By applying a tier rank tag to a prefix state,
you too can make the stripe draw that many thin pips instead of one solid block.

## NOTE ABOUT THE DEFAULT

No tag (or a tag of 1) draws the original single solid stripe. Full stop.

## NOTE ABOUT THE PIP CAP

Rank is capped at 5 pips regardless of the tagged value.

## TAG USAGE

- States, on a prefix state.

## TAG FORMAT

`<affix-tier:N>`
Where N is a positive integer tier rank.

## TAG EXAMPLES

`<affix-tier:3>`
Draws three thin pips on the map nameplate stripe when this prefix is the selected tier prefix.