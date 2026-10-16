---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [omni-stats, overview]
---

# Overview

This plugin adds the "Statistopedia" to the [Omnipedia](../../core/overview.md): a read-only profile of how this save
has actually been played. Enemies felled, damage dealt and taken, how often guard was raised and how often it mattered,
which weapon has done the most work, and where the player keeps dying.

Nothing here changes gameplay. It observes and it reports.

## Integrations

Integrates with others of mine plugins:

- [`J-Base`](../../../_base/core/overview.md); to be honest this is just required for all my plugins.
- [`J-ABS`](../../../abs/core/overview.md); every combat moment reported here is a JABS event.
- [`J-ABS-Metrics`](../../../abs/ext/metrics/overview.md); owns the twenty-six lifetime counters this reads.
- [`J-Omnipedia`](../../core/overview.md); the menu this adds a row to.

## Details

The numbers behind this screen live in two places on purpose.

`J-ABS-Metrics` keeps twenty-six running counters in game variables, because a variable is the one store an event page
can branch on- which is what makes a trophy or a milestone message possible with no code at all. Each of those is a
single number, and a single number is what a variable is good at.

This plugin keeps a second, separate record for the questions that are not a single number: kills per enemy, damage per
weapon, deaths per map. There is no arrangement of variables that answers those without reserving one variable per row
in the database, so they live in a model on the party instead.

The two are not copies of each other. The variables hold the totals, the model holds the breakdowns, and this screen
reads both.

## Derived values

Rates- crit rate, parry rate, accuracy- are computed when the screen draws them, never stored. Each is a division of two
counters that are both already recorded, and keeping the quotient would create a third number able to fall out of
agreement with the two it came from.

## Controls

L2 / R2 cycles between sections. Cancel returns to the Omnipedia.