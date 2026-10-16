---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [drops, overview]
version: "2.7.0"
---

# Overview

This plugin rewrites the way gold and item drops from enemies are handled.

## New

### Features

- [Percentage Drops](#percentage-drops)

### Tags

- [Additional Items](notetags/additional-items.md)
- [Drop Multiplier](notetags/drop-multiplier.md)
- [Gold Multiplier](notetags/gold-multiplier.md)

## Warnings

### Other drop plugins

This is likely incompatible with any other plugins that interact with the drops for enemies unless it was specifically
written as an extension of this plugin.

### Drop Item Double

The party ability of "Drop Item Double" will double the entire multiplier that is provided via the tags. Having multiple
of this party ability will not further double the multiplier.

## Percentage Drops

Have you ever wanted an enemy to drop something say... 40% of the time, but realized you can't put decimal numbers into
the enemy drop "denominator" field in the editor, or go dig up your probability section out of your math book to
remember the formula to translate a percentage into a probability?

Well look no further because now you can just enter a number into the drop items "Probability" box and that number will
be treated as a #/100 chance! For example, if you enter "40" in the "Probability" field on the Enemy tab in the
database, it will be treated as "a 40/100 chance of acquiring the loot, aka 40% chance".

### Note about using this plugin

By having this plugin enabled, you opt into the PERCENTAGE DROPS feature and cannot disable it. It is required, and
probably the reason you're using this plugin anyway.

### Note about treasure hunter godliness

If the percentage chance exceeds 100%, the drop item will always drop. This sounds obvious, but remember this when
looking at the [TAG EXAMPLES](notetags/drop-multiplier.md#tag-examples).