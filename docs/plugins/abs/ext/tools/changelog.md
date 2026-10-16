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
  - Adapted to the RPGManager array read signature.
### 1.2.0
  - Routed the _tools namespace into its own save section, so tool state lands in systems/abs-tools.json rather than
    inside the system blob.
### 1.1.0
  - Gap close tags now require a key: <gapClose:key> / <gapCloseTarget:key>.
  - Keys must match for gap closing to occur — no cross-mechanic bypass.
  - Removed canGapCloseByDefault plugin parameter.
  - Added <gapCloseAny> to skip key-matching and close on whatever the skill's hitbox connects with.
  - Added <blockGapClose> to make a target immune to all gap closing, including <gapCloseAny> skills.
  - Added <gapCloseMode:MODE> (blink/jump/travel) to control how the caster travels to the destination.
  - Added <gapClosePosition:POSITION> (infront/behind/same) to control where relative to the target the caster lands.
  - Added <respectTerrain> to cancel a gap close blocked by terrain, instead of the default terrain-bypassing behavior.
  - Added <onGapCloseEnd>/<thisOnGapCloseEnd> to fire follow-up skills the instant a gap close arrives at its
    destination.
  - Added <pullForward:MAGNITUDE>, a non-key-gated reverse-knockback tag that pulls the target toward the caster;
    combines with gap close by pulling first, then closing whatever distance remains.
### 1.0.3
  - Raised minimum J-ABS version requirement to 4.7.0.
### 1.0.2
  - Raised minimum J-ABS version requirement to 4.6.0.
### 1.0.1
  - Consumed `RPGManager` update.
### 1.0.0
  - Initial release.