---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [level, overview]
version: "1.6.4"
---

# Overview

This plugin scales various data points based on the difference between the actor and enemy's levels. This also bestows
a new "level" property upon enemies, meaning they too can leverage their level in damage formulas for skills and
whatever other scripting shenanigans you want to do.

The various data points include:

- damage
- experience
- gold

See below [SAMPLE CALCULATIONS](#sample-calculations) to understand how the scaling works.

## Caution

This probably won't work with any other plugins that mess with the level functionality of battlers.

## Integrations

Integrates with others of mine plugins:

- [`J-ABS`](../../abs/core/overview.md); enables per-event-enemy level overrides.
- [`J-NATURAL`](../../natural/core/overview.md); handles level-based max hp/mp/tp growths.

## Plugin Configuration

All tuning for this plugin (scaling multipliers, invariance ranges, actor/enemy level balancer variable ids,
single-level-across-classes toggle, the canonical exp curve inputs, and the max level settings) lives in an external
JSON file rather than `PluginManager` parameters:

`data/config.level.json`

This file is required- a missing or invalid file will crash boot, exactly like this author's other config-file-driven
plugins (`J-ABS`, `J-SDP`, `J-JAFTING-Creation`, `Omni-Quest`, `J-Diff`, `J-Prof`). Author/maintain it via
jmz-data-editor's Level board rather than hand-editing JSON.

### Fields and their meaning

- `useScaling` (boolean): Whether or not this scaling functionality is enabled by default.
- `minMultiplier` / `maxMultiplier` (number): Clamp floor/ceiling for damage and other combat uses of level scaling.
- `rewardMinMultiplier` / `rewardMaxMultiplier` (number, nullable): Separate clamps for EXP and gold from level
  scaling. When null/absent, the combat min/max above is used instead.
- `growthMultiplier` (number): The amount the multiplier changes per level of difference.
- `invariantUpperRange` / `invariantLowerRange` (number): The amount above/below 0 levels of difference before scaling
  is applied. See the [SAMPLE CALCULATIONS](#sample-calculations) below for examples.
- `variableActorBalancer` / `variableEnemyBalancer` (number): A variableId whose value is added to all
  actors'/enemies' levels.
- `useSharedActorLevel` (boolean): Whether all classes share one actor-wide level/exp instead of each class leveling
  independently (vanilla RMMZ behavior).
- `canonicalExpBasis` / `canonicalExpExtra` / `canonicalExpAccA` / `canonicalExpAccB` (number): The four inputs to the
  class-independent exp curve used when `useSharedActorLevel` is on. Ignored if another plugin (e.g. `J-Level-Flat`)
  overrides `expForLevel`; only matters as the honest default when nothing else does.
- `defaultBeyondMaxLevel` (number): The default max level beyond the database's 99 cap.
- `trueMaxLevel` (number): The absolute max level your level can be, including all boosts.

## Single Level Across Classes

By default, RPG Maker MZ tracks experience per-class (`Game_Actor._exp` is keyed by `classId`), so switching to a class
you haven't played resets you to level 1 even if your other classes are deep into the double digits. With this setting
enabled, every class always agrees on the same level and exp for a given actor- `_exp` remains an object keyed by
`classId` (for compatibility with anything that expects that shape), but every key is kept in sync with every write, so
there is effectively only one level per actor.

Switching classes no longer resets or re-derives level from a per-class exp bucket. It also retroactively grants every
learning on the destination class at or below your current level (mirroring how a fresh actor learns everything up to
their initial level), so jumping into a brand new class at level 40 doesn't skip past its first 40 levels of learnings.

This is intentionally orthogonal to per-class stat growth (see [`J-NATURAL`](../../natural/core/overview.md)):
`J-NATURAL` banks permanent stat growth once per level-up, sourced from whichever class is active in that exact moment.
With levels shared, playing many classes no longer punishes you with a level-1 reset, but the stat growth you bank is
still shaped entirely by which classes you actually spent those levels playing.

## Sample Calculations

Here is an example back and forth encounter between an allied party and enemy party.

Let us assume you are using the default plugin parameters.

You have a party that looks like this:

- Gilbert lv12
- Susan lv14
- Frank lv11
- Ophelia lv35

And you are fighting an enemy troop that looks like this:

- Slime lv12 (10xp)
- Goblin lv13 (14xp)
- Gigagoblin lv20 (55xp)
- Red Slime lv16 (21xp)

Gilbert attacks Slime!

- They are the same level.
- Damage is not modified; 1.0x.

Susan attacks Slime!

- Susan is 2 levels over the slime.
- There is 1 level of upper invariance.
- The actual variance is +1 level difference.
- The growth per level of difference is 0.1x.
- Damage is increased; 1.1x for this attack.

Goblin attacks Gilbert!

- The attacker(Goblin) is 1 level over the defender(Gilbert).
- There is 1 level of upper invariance.
- The actual variance is 0 level difference.
- Damage is not modified; 1.0x.

Gigagoblin attacks Susan!

- The attacker(Gigagoblin) is 6 levels over the defender(Susan).
- There is 1 level of upper invariance.
- The actual variance is +5 level difference.
- The growth per level of difference is 0.1x.
- Damage is increased; 1.5x for this attack.

Ophelia attacks Gigagoblin!

- The attacker(Ophelia) is 15 levels over the defender(Gigagoblin).
- There is 1 level of lower invariance.
- The actual variance is +14 level difference.
- The growth per level of difference is 0.1x.
- The actual multiplier is 2.4x.
- The cap multiplier is 2.0x.
- Damage is increased; capped at 2.0x (from 2.4x).

Frank attacks Red Slime!

- The attacker(Frank) is 5 levels under the defender(Red Slime).
- There is 1 level of lower invariance.
- The actual variance is -4 level difference.
- The reduction per level of difference is -0.1x.
- Damage is reduced; 0.6x for this attack.

Gigagoblin attacks Ophelia!

- The attacker(Gigagoblin) is 15 levels under the defender(Ophelia).
- There is 1 level of lower invariance.
- The actual variance is -14 level difference.
- The reduction per level of difference is -0.1x.
- The actual multiplier is -0.4x. (which would actually heal the defender!!!)
- The minimum multiplier is 0.1x.
- Damage is reduced; capped at 0.1x for this attack.

Eventually, all enemies are defeated (thanks Ophelia!). Average the actor's party level (18). There is 1 level of
upper/lower invariance.

- Party average of 18 is 6 levels over the slime, -1 for invariance. Slime experience (10) is multiplied by 0.5x; 5xp.
- Party average of 18 is 5 levels over the goblin, -1 for invariance. Goblin experience (14) is multiplied by 0.6x;
  8.4xp.
- Party average of 18 is 2 levels under the gigagoblin, +1 for invariance. Gigagoblin experience (55) is multiplied by
  1.1x; 60.5xp.
- Party average of 18 is 2 levels over the red slime, -1 for invariance. Red Slime experience (21) is multiplied by
  0.9x; 18.9xp.

Each member of the party gains 92.8 experience.

This same logic is again applied to gold from each defeated enemy.