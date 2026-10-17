---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 4.8.0
  - Added natural growth tags for SDP rate (sdr).
### 4.7.0
  - Mastery prose acts now break at tiers 2 and 4 rather than 3 and 9, matching a five-tier subgroup strip.
### 4.6.0
  - A name-only mastery token names a parameter without its value, so one stated magnitude can cover several stats.
    Clearing the panel detail windows hands them an empty array rather than null, which is what threw when maxed panels
    were hidden.
### 4.5.0
  - A named mastery token can name any parameter, reading a plugin-owned one's label from the parameter catalog when no
    trait encodes it.
### 4.4.0
  - Mastery values are tinted by what they are rather than which namespace wrote them, so a distance and a percentage
    never share an ink. An uppercase token namespace names its parameter alongside its value.
### 4.3.0
  - Mastery descriptions tint their live values by kind and honour an authored line break, so a description turns over
    at a clause a person chose rather than wherever the pixels ran out.
### 4.2.1
  - Mastery description wrapping measures with textSizeEx, matching the drawTextEx that paints it, so escape codes are
    not counted as characters.
### 4.2.0
  - Mastery descriptions wrap across the two lines the header reserves instead of running off its right edge, and the
    reach token carries its own unit the way the cadence and duration tokens already did.
### 4.1.0
  - Mastery descriptions now resolve in full. The prose resolver reads parameters from traits or buff tags, follows a
    mastery to the payload it delivers, phrases gates and damage formulas, and consults a tag-shape table rather than
    guessing which argument holds a magnitude. All 48 authored subgroups render every tier.
### 4.0.0
  - The SDP header now names the mastery a panel grants and describes what it does, read from a new per-act prose block
    on each subgroup in config.sdp.json.
  - Window_SdpMastery is gone, folded into that header, and the actor ribbon now caps only the panel list so the header
    can use the width.
  - Removed topFlavorText from panel identity; the header it fed is now the mastery description.
### 3.3.4
  - Removed the J.SDP namespace check from getSdpBonusForParameterKey. A plugin cannot be absent from itself, so that
    guard had no reachable false case.
  - The panel identity, mastery and progression field parsers no longer pre-check for a missing or blank value; parsing
    one yields NaN, which the check beneath already turns into the supplied default.
### 3.3.3
  - Routed every panel, rarity and rank-reward warning and error through J-Base's new Diagnostics, so each names J-SDP
    in the console.
### 3.3.2
  - Repointed SDP point, panel-unlock and mastery logging at J-Log's new $mapLogs registry. The $actionLogManager and
    $diaLogManager globals these called are gone. Requires J-Log 3.0.0 when J-Log is installed at all.
### 3.3.1
  - Adapted to the RPGManager array read signature.
### 3.3.0
  - Scene_SDP now uses the shared filterable list from J-Base rather than its own family strip window, which is deleted.
    SdpFamilyFilter carries the family predicate.
### 3.2.0
  - Unspent points now appear on each party member's cell in the main menu, beside their level and the distance to the
    next one. A currency nobody is reminded of is a currency nobody spends, and the points are otherwise invisible until
    the player already went looking for them.
  - This is drawn through the extension hook J-CMS reserves for exactly this, and does nothing at all when that plugin
    is not installed.
  - The family strip, header, mastery, and parameter list windows no longer declare private members. A window's
    constructor reaches initialize, and through it the drawing hooks, before a derived class installs its own members-
    so anything private was being touched on an object that did not yet have it.
### 3.1.0
  - Routed the _sdp namespace into its own save section, so panel investment and mastery land in systems/sdp.json rather
    than in the system blob.
  - Moved the _sdp namespace seeding from the initialize aliases to initMembers, so a decoded save can establish it
    without a constructor.
### 3.0.0
  - BREAKING: Rank-up cost spine is defined per **rarity** in plugin parameters; each panel’s `baseCost`,
    `flatGrowthCost`, and `multGrowthCost` in `config.sdp.json` are **offsets / scale** (defaults **0 / 0 / 1.0**).
  - Retune plugin defaults or panel overrides when migrating from v2.x absolute triples.
  - Added panel Families and Subgroups (`config.sdp.json` `families`/`subgroups` blocks): a Family is a top-level menu
    category cycled with L2/R2 in the SDP scene (Window_SdpFamilyStrip); a Subgroup is a tiered chain of panels within a
    Family whose masteries supersede each other.
  - Added Mastery: a panel enrolled in a subgroup (via its `mastery` block: subgroupKey, subgroupTier, masterySkillId)
    grants that tier's wrapper skill to the actor when maxed.
  - Maxing a higher tier in the same subgroup automatically forgets the previous tier's mastery skill and grants the new
    one (SdpMasteryManager) — only the highest maxed tier is ever active.
  - Surfaced read-only in the SDP scene via Window_SdpMastery for whichever panel is hovered.
### 2.1.2
  - Consumed `RPGManager` updates.
### 2.1.1
  - Added flag for showing external file load info.
### 2.1.0
  - Removed association of SDPs being backed by actual database items.
  - Implemented JABS-centric basis for dynamically generating drops.
### 2.0.2
  - Added new getTotalSdpRanks function to actors for a new data point.
### 2.0.1
  - Added filter for skipping panels that start with particular characters.
  - Retroactively added note about breaking web deploys for this plugin.
### 2.0.0
  - THIS UPDATE BREAKS WEB DEPLOY FUNCTIONALITY FOR YOUR GAME.
  - Major breaking changes related to plugin parameters.
  - Updated to extend common plugin metadata patterns.
  - Panel data is now strictly data.
  - Rankings of panels are stored on the actor as save data.
  - Now loads panel data from external file.
  - Panels being unlocked/locked are stored on the party.
  - Updated SDP scene to display rewards.
  - Updated SDP rewards to have names.
### 1.3.0
  - Added new tag for unlocking panels on use of item.
### 1.2.3
  - Updated JABS menu integration with help text.
### 1.2.2
  - Updated sdp drop production to use drop item builder.
### 1.2.1
  - Update to add tracking for total gained sdp points.
  - Update to add tracking for total spent sdp points.
### 1.2.0
  - Update to include Max TP as a valid panel parameter.
### 1.1.0
  - Update to accommodate J-CriticalFactors.
### 1.0.0
  - The initial release.