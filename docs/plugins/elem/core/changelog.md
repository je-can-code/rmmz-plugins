---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.5.0
  - Its tags are described in words.
### 1.4.0
  - Added <slayer:[ELEMENT_ID, PERCENT]>, a damage bonus against targets weak to an element. Keyed on what the target is
    rather than what the attack is made of, so the attacker need not carry the element to benefit.
### 1.3.2
  - Routed the damage-formula failure through J-Base's new Diagnostics. It was two warnings plus a separate error; it is
    now one error naming J-Elementalistics and the offending skill id, carrying the item and the caught error as named
    keys.
### 1.3.1
  - Fixed Game_Actor#elementRate capturing its own original into the actor alias map and then invoking the enemy's chain
    instead. Harmless only by coincidence, since vanilla defines elementRate on Game_BattlerBase alone and both maps
    held the same inherited function; the moment either subclass gained its own, actors would have silently run the
    enemy's.
### 1.3.0
  - Changed <boostElement:ELEMENT_ID:PERCENT_BOOST> to <boostElement:[ELEMENT_ID, PERCENT_BOOST]>.
  - The old colon-separated shape required a bespoke, ad-hoc capture-group reader
    (RPGManager.getAllCapturesFromNoteByRegex) instead of the standardized bracket-array family used by every other
    multi-value tag; the bracket form now reads through getArraysFromNotesByRegex like the rest. Existing game data must
    be migrated.
### 1.2.0
  - evalDamageFormula now delegates formula evaluation to Game_Action#evalFormulaWithContext.
  - The hardcoded p (proficiency) setup and J.PROF conditional block have been removed; J-Proficiency registers p
    independently via Game_Action.registerFormulaContext.
  - All registered context variables (p, s, and any future additions) are automatically available in damage formulas
    without J-Elementalistics needing to know about them.
### 1.1.0
  - Added resistance piercing via pierceElement and thisPierceElement tags.
  - Pierce applies to the target's base element rate before the attacker's boost multiplier, nudging resistances toward
    neutral (1.0). Weaknesses and absorbed elements are never affected.
### 1.0.1
  - Consumed `RPGManager` updates.
### 1.0.0
  - The initial release.