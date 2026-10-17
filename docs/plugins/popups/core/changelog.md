---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 2.2.1
  - Popups queued while a character was off-screen are dropped instead of bursting in when it returns. Requires J-Base
    4.2.0.
### 2.2.0
  - Damage popups now draw above everything that takes light away, so a hit always reports itself even when whatever was
    hit cannot be seen.
### 2.1.1
  - Routed the rejected-text-pop warning through J-Base's new Diagnostics. The prefix is now a literal rather than read
    from J.POPUPS.Metadata.name, so it still identifies the ship if the namespace is what went wrong.
### 2.1.0
  - Sprite_MapDamage accumulation phase; merge helpers + PopupEmitter flush hooks.
  - Merge idle flush is battler-wide (any merged stream refreshes the timer); strike floats release on that idle window
    only (not on unrelated combo-chain clear signals).
### 2.0.0
  - Split from J-TextPops; plugin renamed J-Popups; layout rings + WeakMap stacking; addTextPop validation;
    J.POPUPS.EXT.* extensions for J-ABS, Aptitude, SDP, and Resources pop builders; disablePopups parameter (no J-ABS
    required).
### 1.1.0
  - PopupEmitter lifecycle; DisablePopups; layout constants; variance/motion fixes; textAccent.
### 1.0.0
  - Initial release (as J-TextPops).