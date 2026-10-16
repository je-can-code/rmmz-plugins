---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.6.0
  - Renamed the maxTraitCount notetag to maxRefinedTraits, which says what it counts.
  - Removed the unused JAFTING_RefinementData model.
### 1.5.1
  - Routed the uncapturable-equip error through J-Base's new Diagnostics, so it names J-JAFTING-Refinement and carries
    the equip as its detail rather than as a second bare warning beneath it.
### 1.5.0
  - Note effects now count against the refinement ceiling alongside traits.
  - An equip could previously accumulate transferable note lines without limit while reporting itself full.
### 1.4.0
  - A refinement now costs the base exactly one count, whatever the donor had accumulated. Previously a donor's own
    history was added to the output and charged against the base's ceiling, which meant a fully-refined weapon could not
    be spent on anything - the pairing was barred before it could be offered. A maxed donor hands over everything it
    gathered for the price of a single count, which is what makes building one worth doing.
  - The refine-count ceiling no longer consults the donor either, so the case that used to read as an unexplained
    refusal now simply projects one more than the base has spent.
  - Added the transferrableEffectsBelow note tag, the note-side counterpart to the divider trait. Everything above it
    describes what an equip is and never leaves it; everything below is what a donor hands over when consumed. An equip
    without the tag offers no note effects at all - the absence means nothing transfers rather than everything does,
    which is what keeps an equip's own identity from being launderable.
  - Note effects now merge on refinement, where previously only traits did. The base keeps its retained half verbatim
    and the two transferable halves combine beneath a fresh divider, so an output is itself donatable. Numeric tags
    total, distinct formulas and arrays stack side by side, and identical lines collapse to one.
  - The refinement result column shows what an equip will be worth rather than the raw trait values behind it: a before
    and after per parameter, with the percentage responsible in a third column. A percentage landing on a stat the item
    has none of now reads plainly as zero to zero instead of looking like a gain.
  - Transferable note effects are listed too, as authored - tag key on the left, value on the right, both sides shown
    when a value moves. Nothing interprets what a tag means yet, so these read as written rather than as a friendlier
    guess.
  - The column headings are drawn on the output's name line and no longer depend on a numeric row existing, so switching
    between donors that grant an amount and donors that grant a name stopped moving every row a line.
  - An effect the base already carried is no longer dimmed. The rightmost column says what happened to every row, and
    grey is what the donor list already uses for rows that cannot be picked.
  - Fixed the details panel continuing to project a merge after backing out of the donor list. The last-highlighted
    donor stayed selected internally while nothing on screen said which one it was.
### 1.3.0
  - Fixed refinement lineage collapsing on save/load. A refined item's ancestry was detected by comparing the datum's id
    against the refinement starting index, but refined rows are clones that keep the base item's id - only the slot they
    occupy moves. Every ancestor therefore looked like a base item, so a +5 sword came back as +1 carrying only its last
    material.
  - Fixed commitRefinement unwrapping its arguments as Game_Item when the scene passes raw datums, which threw before a
    refinement could complete.
  - Fixed the refinement detail panel staying blank after a commit; the cursor was already on the row it needed to
    redraw, so no index change was raised to trigger it.
  - Removed a call to JaftingManager.combineBaseParameterTraits, which had not existed since the module migration and
    prevented the scene from opening.
  - Routed the _refinement namespace into its own save section.
### 1.2.0
  - Replaced ~550 lines of local trait-combining logic with calls to J-Base's new shared
    TraitResolver.refineTraits/consolidate.
  - Fixed the salvage ledger being silently dropped from refined equipment on save/load- RPG_EquipItem's base schema
    doesn't carry _jaftingSalvageLedger, so Game_Party's database-refresh reconstruction (new RPG_Weapon/RPG_Armor from
    raw JSON) lost refinement lineage every time until this fix.
### 1.0.2
  - Salvage ledger merges before refine consumes inputs.
  - Refinable list lineage hints; hollow-diamond prefix for stamped rows.
### 1.0.1
  - Consumed `RPGManager` updates.
### 1.0.0
  - Initial release.