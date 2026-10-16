---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 3.0.0
  - BREAKING: replaces J-Difficulty and J-Difficulty-Affix; plugin commands now come from J-Passive-Difficulty. Each
    layer is a pair of hidden passive states, and the difficulty screen says what they do in words. Locked layers show
    behind a padlock.
### 2.2.2
  - Dropped a redundant round from the parameter and reward factors. The inputs are whole percentages, so it never had
    anything to round.
### 2.2.1
  - Routed the duplicate-key and lock/unlock/enable/disable warnings through J-Base's new Diagnostics, so each one names
    J-Difficulty in the console.
### 2.2.0
  - Difficulty layers now retain the raw configuration they were built from.
  - The classifier reads a fixed set of fields by name, so anything an extension adds to a layer was unrecoverable once
    parsing finished - and parsing happens during this plugin's own construction, too early for any extension to
    intervene. Keeping the source is what lets an extension find its own fields without reading the file a second time.
### 2.1.2
  - Difficulty scaling can no longer reduce max hp below one. The engine floors it at one inside its own param call, and
    the difficulty multiplier was applied to the result - outside that clamp - so a max hp multiplier of zero produced a
    battler with no maximum hp and broke every ratio computed from it. Other parameters still scale to zero, which is a
    legitimate setting.
### 2.1.1
  - The difficulty points window no longer declares private members. A window's constructor reaches initialize, and
    through it the drawing hooks, before a derived class installs its own members- so anything private was being touched
    on an object that did not yet have it.
### 2.1.0
  - Routed the _difficulty namespace into its own save section, so difficulty state lands in systems/difficulty.json
    rather than in the system blob.
  - Moved the _difficulty namespace seeding from the initialize alias to initMembers, so a decoded save can establish it
    without a constructor.
### 2.0.2
  - Fixed the scene's initMembers chain never reaching Scene_Base, which left the modal dimmer field unseeded.
    getModalDimmerWindow guards on === null, so undefined slipped straight past it and showModalDimmer dereferenced it.
  - Command windows now seed state in initMembers, early enough for makeCommandList to see it.
### 2.0.1
  - Added flag for showing external file load info.
  - Removed dead plugin parameter inputs.
### 2.0.0
  - Updated window layout of scene.
  - Added multiple layer application support.
  - Updated difficulty layers to also be applicable to actors if desired.
  - Refactored a lot of underlying code.
  - Externalized difficulty layer data.
### 1.0.0
  - Initial release.