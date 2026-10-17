---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.3.2
  - Routed the unsupported-component-type error and the four recipe/category lock and unlock errors through J-Base's new
    Diagnostics, so each names J-JAFTING-Creation in the console.
### 1.3.1
  - Fixed a recipe carrying an SDP cost throwing when J-SDP is not installed.
  - The affordability check read the leader's panel points directly, while the held-quantity method it duplicates guards
    that read and answers zero without the plugin; it now defers to that method for every component type.
### 1.3.0
  - Added the study shop - Scene_JaftingStudy, its two windows, and StudyPurchaseService - so recipes can be bought
    rather than only found.
  - Recipes now carry a tier and a profession; CraftingProfession describes the price ladder a profession charges. The
    crafting bench gained an everything tab and stopped offering the whole menu, and the category badge and list windows
    it replaced are gone.
### 1.2.2
  - The recipe detail window reads a crafted weapon or armor's base parameters through thisBParam rather than off the
    params array. An equip's worth for a parameter is that field plus any this-parameter tag it carries, so reading the
    array alone understated anything authored as a tag.
### 1.2.1
  - The plugin metadata class and the category badge and recipe detail windows no longer declare private members. Both
    base constructors reach an overridable hook before a derived class installs its own members- so anything private was
    being touched on an object that did not yet have it.
### 1.2.0
  - Routed the _crafting namespace into its own save section, so recipe and category tracking land in
    systems/crafting.json.
  - Moved the _crafting namespace seeding from the initialize alias to initMembers, so a decoded save can establish it
    without a constructor.
### 1.1.2
  - Registered RecipeTracking/CategoryTracking with SerializableRegistry so JsonEx restores keep their prototype methods
    after a save load.
  - Moved dev-only debug cheat helpers from a standalone debug/ file into initialization.js; no functional change.
### 1.0.4
  - Craft outputs inherit dismantle lineage from recipe ingredients (core salvage stamping).
### 1.0.3
  - Developer/debug helpers on J.JAFTING.EXT.CREATE.Debug and a plugin command to prep Creation test saves.
### 1.0.2
  - Added flag for showing external file load info.
### 1.0.1
  - Recipes & Categories can now be updated for existing save files.
### 1.0.0
  - The initial release.