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
  - Removed refinementMaterialHasNoRecoverableRows along with the early exit it drove in buildRefinementOutputLedger. A
    bare vendor donor already reached the final return with base lineage alone, so the pre-check spent four branches
    reaching the answer the pipeline arrived at anyway.
### 2.2.0
  - Routed the _jafting namespace into its own save section, so crafting state lands in systems/jafting.json rather than
    in the system blob.
### 2.1.3
  - Split JaftingSalvageDataModels.js into one file per class (JaftingSalvageLedgerRow/Snapshot/PartyLedgerBag) and
    registered all three with SerializableRegistry so JsonEx restores keep their prototype methods after a save load.
### 2.1.2
  - Salvage hub row: label, icon, optional switch gate ({@link Window_JaftingList}). {@link Scene_JaftingSalvage.KEY}
    ties the hub entry to scene routing.
### 2.1.1
  - Party salvage bags init from {@link DataManager.createGameObjects} and {@link DataManager.extractSaveContents} (not
    {@link Scene_Boot#onDatabaseLoaded}; runs before $gameParty exists).
### 2.1.0
  - Salvage ledger helpers, {@link Scene_JaftingSalvage}, and plugin command call-salvage.
### 2.0.0
  - Removed all references to refinement logic.
  - Extracted the crafting logic entirely into its own plugin.
  - Repurposes this plugin to be the "core" or "root" crafting menu only.
  - Retroactively added this CHANGELOG.
### 1.0.0
  - Initial release.