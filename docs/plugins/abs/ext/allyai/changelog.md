---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 3.2.0
  - Allies give up on a formation slot they cannot reach rather than chasing it forever. Progress toward the slot is
    measured rather than time spent, so a long walk around a wall still completes while a genuinely blocked approach
    settles.
### 3.1.1
  - Followers pass through terrain while the party has them hidden, so an ally nobody can see cannot strand itself on
    geometry nobody was shown.
### 3.1.0
  - An ally backing away from its target now arcs around it toward the leader and stops on arrival, rather than marching
    down a single axis until it is out of the fight entirely.
  - The leash measures euclidean distance, matching everything else that measures a battler against the world. Manhattan
    over-reported a diagonal by up to 41%, so an ally walking one was hauled back from a gap a straight walk was
    allowed.
  - Leash multipliers climb with spacing rather than falling. A backline ally stands furthest from the target and so
    needs the most rope, not the least.
### 3.0.3
  - Routed the invalid-preset error through J-Base's new Diagnostics, so it names J-ABS-AllyAI in the console.
### 3.0.2
  - Moved the ally AI namespace seeding from the initialize alias to initMembers, so a decoded save can establish it
    without a constructor.
### 3.0.1
  - Ally idle-check now also treats channeling as busy (J-ABS Channel).
  - Fixed applyBattleMemories' inverted check; memories went unrecorded.
  - Fixed jumpAll returning early instead of skipping just one follower.
### 3.0.0
  - Replaced exclusive AI modes with three orthogonal behavior axes: risk (careful/balanced/reckless), support
    (offense/balanced/support), and spacing (frontline/midline/backline).
  - Added ten named presets that snap all axes to a coherent archetype.
  - Added per-ally do-nothing toggle (overrides all axes).
  - Spacing axis now drives per-ally safe-distance thresholds and leash range.
  - Removed dead modes: do-nothing (now a toggle), basic-attack, variety, full-force, support. Removed unused
    JABS_AllyAIMode class.
### 2.2.0
  - Raised minimum J-ABS version to 4.10.0 (defensive dodge/guard coordination).
  - Ally `JABS_AiManager` / battler paths updated for defensive interrupts and follower dodge behavior.
### 2.1.2
  - decideAction and ally AI mode helpers now return a skill-id array, matching J-ABS 4.7.2.
  - Raised minimum J-ABS version to 4.7.2.
### 2.1.1
  - Raised minimum J-ABS version to 4.7.0.
### 2.1.0
  - Raised minimum J-ABS version to 4.6.0.
  - Delegates cleanse/heal/buff support logic to shared `JABS_AI` base methods (same behavior, less duplication).
  - Fixed `aiComboChanceModifier` using `getMode().key` when `getMode()` already returns the mode key string.
  - Fixed `bestFitHealingAllSkill` calling `bestFitHealingOneSkill` with no arguments on multi-heal fallback.
  - Battle memory helpers now live on `JABS_AI`; `JABS_BattleMemory` class moved to J-ABS core.
### 2.0.1
  - Consumed `RPGManager` update.
### 2.0.0
  - Added a concept of "formations".
  - Allies now own their own movement instead of mirroring the player.
  - Added castbar visibility while casting (for allies).
  - Changed rubberbanding to blink allies to the player instead of jump.
### 1.2.0
  - Removed ally AI code from core JABS and added here.
  - Fixed issue where battle memories were not correctly applied.
### 1.1.1
  - Updated JABS menu integration with help text.
### 1.1.0
  - Retroactively added this CHANGELOG.
  - Upgraded AI to be able to leverage combos (enemy AI, too).
  - Refactored code surrounding AI action decision-making.
  - Refactored code surrounding ally AI assignment from command windows.
  - Refactored code surrounding battler access and management.
  - Refactored ally AI targeting.
  - Removed dead code.
### 1.0.0
  - The initial release.