---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.4.0
  - Its tags are described in words, conditions and all, and the Passives view draws those lines under each state,
    wrapping any too long for the panel.
### 1.3.2
  - Dropped a redundant round from the remaining-seconds display, which was already rounded by the time it got there.
### 1.3.1
  - Adapted to the RPGManager array read signature.
### 1.3.0
  - Passive states no longer appear in the JABS affliction strip. A passive is permanent and neither waits out nor
    cures, so listing it beside poison and paralysis filled the strip with rows the player could do nothing about.
  - This exclusion previously lived in J-ABS, which had to reach across for it; it belongs here, where passives and JABS
    already meet.
### 1.2.0
  - Conditional passive tracking state is no longer written to savefiles where it can be recomputed from the battler's
    current situation on load.
### 1.1.2
  - Added the whenGlanced condition (this battler suffers a glancing blow as the victim- mutually exclusive with
    whenCrit on any single hit), wired into autoApplyState and autoExecuteSkill via Game_Action#apply alongside the
    existing whenCrit check. Lets "retaliate on a glancing blow" builds fire.
### 1.1.1
  - Wired negaStateInflicted/posiStateInflicted/anyStateInflicted into autoModifyCooldowns via a new shared
    AutoRuleManager#scheduleSelfStateInflictedTriggers pump, called from Game_Battler#onJabsStateInflicted alongside the
    existing autoInflictState dispatch. Lets "reduce my own cooldowns when I land a debuff" builds fire, not just
    onKill.
### 1.1.0
  - Added autoModifyCooldowns, which directly modifies one or more of the bearer's own active skill-slot cooldowns
    (percent-of-total or flat frames) on a condition- currently wired for onKill only. Widened the shared dispatch
    contract so a subclass's dispatch() can see the full authored tuple, not just the leading id, and added an opt-out
    (requiresPositiveId) from the base class's positive-id validation for tags whose leading slot is a signed value
    instead.
### 1.0.0
  - Initial release. Passive gates (passiveSourceRule, passiveStateRule, passiveStateCount) with map reconcile and
    combat timestamps (movement, hit, attack, onHealHp/Mp/Tp). autoApplyState schedules real JABS states on time,
    hpDmg/mpDmg/tpDmg/anyDmg (combat gain* loss only, not skill pay), whenCrit (victim),
    negaStateAdded/posiStateAdded/anyStateAdded, move (whole tiles via Pixelistics updatePixelStepping), and stand (idle
    on map). removeOnSkillExecution on state rows (stype filter, chance, stack-aware decrementStateStacks).
    removeOnSkillResolution on state rows — same shape as removeOnSkillExecution but fires at action expiry so state
    traits are active during damage calculation.