---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 2.7.0
  - Its tags are described in words.
### 2.6.0
  - Added natural growth tags for gold rate (gdr). Fixed drop rate growth, which never applied when J-NaturalGrowth
    loaded after this plugin, and drop rate buffs, which landed a hundred times too strong.
### 2.5.1
  - Routed the static-instantiation and invalid-drop reports through J-Base's new Diagnostics, so each names
    J-DropsControl. The invalid-drop warning now shows the enemy, kind and id as named keys instead of a wrapped string.
### 2.5.0
  - Added drop upgrade ladders. A ladder names a chain of rows in ascending order, and a battler carrying
    <dropUpgrade:N> promotes each drop N rungs along whichever ladder claims it, so a single authored drop can express a
    whole rarity tier without the enemy listing every rung it might yield.
  - Added <dropQuantity:N>, granting extra copies of each item that dropped.
  - Both are summed from all note sources on both sides of the kill, because an affix graded onto the slain enemy and a
    harvesting tool carried by the killer are the same kind of contribution. An enemy's ordinary states are already
    cleared by death; passive states held externally survive.
  - Added the postProcessDroppedLoot hook, which runs after loot is rolled and before it is awarded. Extensions that
    observe or modify a haul alias this rather than makeDropItems, so they see the list at a defined point rather than
    racing each other through one override.
### 2.3.0
  - Loot drops now resolve through the shared proc-count path, so a killer in Accumulate Mode earns a copy per
    successful roll rather than spending the surplus on an already-won roll, and Encore echoes each earned copy. The
    treasure-hunter shortcut is gone as a special case rather than as behavior; one consequence is that an absolutely
    cursed killer can now be denied a guaranteed drop, where the shortcut previously bypassed fate. didFindLoot keeps
    its boolean contract and delegates.
  - Fixed two compounding rate bugs that made loot far more common than authored: the enemy base rate and the party
    bonus both started from one and were summed, doubling every drop in the game; and the double-drop accessory was
    consulted twice per roll, once inside the multiplier and again as a bare doubling of the chance.
### 2.2.0
  - Added a NaturalGrowth-integrated drop rate stat (key "dor") via
    <dorBuffPlus>/<dorBuffRate>/<dorGrowthPlus>/<dorGrowthRate>, following J-NaturalGrowth's own Buff/Growth tag
    pattern; requires J-NaturalGrowth. makeDropItems/didFindLoot now accept the killing battler, whose lucky/cursed
    on-chance rolls now contribute to the loot-discovery roll.
  - Documented that drop TYPE accepts long-form aliases (item/weapon/armor) alongside the short forms (i/w/a).
### 2.1.2
  - Consumed `RPGManager` updates.
### 2.1.1
  - Added guard to prevent adding invalid drops to the drop list.
### 2.1.0
  - Further abstracted some of the logic for drops to support extension.
### 2.0.0
  - Retroactively added this CHANGELOG.
  - Refactored various data retrieval methods from given battlers.
  - Fixed issue with mismapped level calculations.
  - Added more jsdocs and comments to explain better the logical flow.
  - Removed useless methods.
### 1.0.0
  - The initial release.