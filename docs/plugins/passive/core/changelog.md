---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 2.4.0
  - Its tags are described in words.
### 2.3.0
  - Passive sources are no longer written to savefiles; they are entirely derived from equipment, states, and skills,
    and are now rebuilt on load rather than restored from a file that could disagree with the database.
  - Routed the _passive namespace into its own save section.
  - Moved the _passive namespace seeding from the initialize alias to initMembers, so a decoded save can establish it
    without a constructor.
### 2.2.0
  - Retrofitted the passive viewer onto the shared actor skeleton, so it matches the other actor-scoped scenes.
  - Constrained the viewer's chrome, which previously spanned the whole screen.
  - The passive list now names both absences it can report, rather than showing one message for two different
    situations.
  - Fixed passive-refresh ordering: Game_Actor/Game_Enemy#onSetup now attach passives before the original setup logic
    runs, so the base setup's own notification is the only one that fires instead of cascading a redundant second pass
    through the note-regex-heavy onBattlerDataChange path.
### 2.1.0
  - Added Scene_Passive viewer scene with actor ribbon, state list, and semantic detail window.
  - Detail window uses a three-column layout with labeled sections: Combat, Parameters, Elements, Ailments, Skills,
    Equip, Properties, and Rewards.
  - Parameters section color-codes values green/red; "lower is better" sparams (PDR, MDR, MCR, TCR, FDR) use inverted
    color so reductions display green.
  - Elements section uses element icons as identifiers throughout; Dmg In color is inverted.
  - J-Natural buff/growth rows display with stat icons, +sign prefix, and /lv suffix.
  - Formulas evaluate to current numeric values against the viewing actor.
  - Added Passives command to the main menu with configurable name, icon, and switch.
  - Added J.PASSIVE.EXT.OTIB — item-to-state passive unlock system with optional DiaLog integration.
  - Added J.PASSIVE.EXT.AFFIX — aliases detail window sections to inject JABS-specific content: slip effects, shield,
    stacking, resource gains (J-Resources-ABS), and JABS modifier/timing rows.
  - Added <hideFromPassiveList> to keep stack amplifiers and other implementation-only passive duplicates out of the
    Passives menu while still contributing traits in combat.
### 2.0.2
  - Added support for passives driven by map events.
### 2.0.1
  - Consumed `RPGManager` updates.
### 2.0.0
  - Refactored the entire passive state implementation.
  - Added passive states for all database objects with notes.
  - Added support for only-while-equipped passive states.
### 1.1.0
  - Added passives for items/weapons/armors as well.
### 1.0.0
  - Initial release.