---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [hud-dps, overview]
---

# Overview

This plugin adds a damage readout to the map screen. It draws one row per battle member and three columns of rates:

- Now - the rolling rate across the last few seconds of combat.
- Fight - the rate across the encounter in progress.
- Last - the rate across the encounter before it.

This plugin measures nothing itself. Every number on it is asked of the tracker in `J-ABS-Dps`, which is where the rules
about what counts and how it is timed all live.

## Details

### It is off by default

This is a tuning instrument, not part of the game's presentation. It stays off until somebody is actually measuring
something.

### The figures hold between fights

The clock behind them only runs while the party is in combat, so the table does not bleed to zero on the walk to the
next encounter. The Fight column keeps showing the fight that just ended, and only moves down into Last when the next
one begins.

### A low number is a reading, not a gap

Every member is measured against the same encounter clock. An ally who spent the fight dead or idling divides what
little they did by the whole fight and reads low, which is the thing worth knowing.