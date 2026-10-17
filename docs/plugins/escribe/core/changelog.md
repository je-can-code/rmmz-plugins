---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.1.1
  - Escriptions now hang off the character overlay and centre on whole pixels, so they no longer stretch with an
    animating character or blur on half of them.
### 1.1.0
  - Multiple <text> tags now render as multiple lines, rather than the last one silently winning. An icon rides above
    the whole block.
  - Collapsed text and icons into one internal escription type.
  - Fixed unreachable opacity branches and a negative-zero offset.
### 1.0.2
  - Text escriptions are now horizontally centered on their event. The map coordinate was being added into a pixel
    offset, drifting every label one pixel to the right per tile from the left edge of the map.
  - Escription height is now measured from the character sprite instead of being picked from the sheet's "$" prefix,
    which is a single-character marker rather than a tall-character one. Small "$" sheets floated their labels far too
    high, and sheets taller than 96 pixels wore theirs inside the sprite. Sheets 48 and 96 pixels tall are unaffected.
  - <proximityText:DISTANCE> now fades its text in. It was being gated on the icon's proximity, so an event with
    proximity text and no icon never showed the text at all.
### 1.0.1
  - <proximityText>/<proximityIcon> now require an explicit DISTANCE; the no-argument form (implicit distance 0) is no
    longer supported- use <proximityText:0>/<proximityIcon:0> instead.
  - Removed a dead constructor-type check against Game_Event that was already unreachable behind an equivalent isEvent()
    check.
### 1.0.0
  - Initial release.