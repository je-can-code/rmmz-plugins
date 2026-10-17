---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.2.0
  - Added natural growth tags for lifesteal, manasteal and techsteal (lst, mst, tst).
### 1.1.0
  - Added HEAL EVENTS system with onSelf and onAlly resource cascade tags.
  - 24 notetag variants (4 triggers × 3 outputs × 2 families).
  - New plugin parameter: healChainDepth (default 5) caps cascade depth.
  - Fixed: Scene_Boot import was missing from entry.js, so parameter registration was never called. Now fixed.
  - Added LST/MST/TST (life/mana/tech steal) battler-wide percent-point stats, summed from every note source plus SDP
    panel bonus, recovering HP/MP/TP as a percent of HP damage dealt on every hit.
### 1.0.0
  - Initial release.
  - Added on-attack HP/MP/TP gains via flat, percent, and formula skill tags.
  - Added when-hit HP/MP/TP gains aggregated across all traited sources.