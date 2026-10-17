---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.2.1
  - Resource amounts in the status list are rounded before being drawn. The gauge still fills from the exact value, so
    only the label changed.
### 1.2.0
  - The menu gold strip is now a currency strip: CurrencyDefinition describes a currency, registerCoreCurrencies
    declares gold, and Window_Currencies renders however many are registered. Extensions add their own without touching
    the scene.
### 1.1.0
  - Each party member's cell is now a character card rather than a data row.
  - It is headed by their name with their class beneath it, carries their map sprite beside their portrait, and is
    banded into sections by rules.
  - Level and remaining experience share a row, since a level means little without knowing how close the next one is.
  - Resources are drawn as segmented gauges spanning the cell, marked by icon rather than by abbreviation and trailed by
    their current and maximum values.
  - Afflicting states are listed by icon, and an actor suffering none says so rather than leaving the row blank.
  - Every equipment slot is listed, with empty ones named and dimmed rather than omitted, so the block keeps its shape
    as gear comes and goes.
  - A drawExtensionData hook sits alongside level and experience for other plugins to contribute to; it returns the
    position it finished at, so any number of them may each claim a row without knowing about one another.
  - The party display no longer tints each cell behind its contents. That tint marks which row a cursor is on, and
    nothing selects a party member here- it advertised an interaction that does not exist.
  - Fixed the party display overrunning the currency strip by the height of the control legend. It was measuring its own
    floor from the bottom of the screen by the strip's height rather than stopping at the strip's position, and the
    sixty pixels it overran were hidden underneath the very window that caused it.
  - Command help text no longer refers to "this character", which pointed at a referent the menu never identifies.
### 1.0.0
  - The initial release.