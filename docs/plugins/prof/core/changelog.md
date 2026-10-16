---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 2.6.0
  - Its tags are described in words.
### 2.5.0
  - Added natural growth tags for proficiency bonus (prof).
### 2.4.3
  - Removed the save-migration block from updateBonusSkillProficiencyGains. The field is established in initMembers, so
    the absent value it defended against cannot arrive, and the very next statement overwrote whatever it had written.
### 2.4.2
  - Routed every proficiency warning and error through J-Base's new Diagnostics, so each names J-Proficiency. The
    swallowed reward error is now reported as an error carrying the caught exception rather than a bare console.log of
    it beneath a separate line.
### 2.4.1
  - Repointed the proficiency-growth announcement at J-Log's new $mapLogs registry. The $diaLogManager global this
    called is gone. Requires J-Log 3.0.0 when J-Log is installed at all.
### 2.4.0
  - Defense earns proficiency the way offense does - guarding and parrying a skill now advances proficiency in it, so a
    defensive player is not frozen out of the system.
### 2.3.0
  - Routed the _proficiency namespace into its own save section, so earned proficiency lands in systems/proficiency.json
    rather than in the system blob.
### 2.2.0
  - Learning a skill through proficiency now announces in the dia log, naming the practiced skill, instead of only
    producing a floating text pop on the same visual channel as damage numbers and gold. A skill's own message1/message2
    overrides the line.
  - Converted the last SDP duck-type in this ship to a namespace check.
### 2.1.0
  - Registers 'p' as a formula context variable via Game_Action.registerFormulaContext.
  - Damage formulas can now use 'p' for skill proficiency without J-Elementalistics needing to hardcode a J.PROF
    conditional block. The registration calls this.skillProficiency() on the Game_Action instance at formula evaluation
    time.
  - Proficiency bonus (key "prof") registered with the shared parameter catalog, given an SDP panel binding via
    baseSkillProficiencyAmount().
### 2.0.1
  - Added flag for showing external file load info.
  - Removed dead plugin parameters for conditionals.
### 2.0.0
  - THIS UPDATE BREAKS WEB DEPLOY FUNCTIONALITY FOR YOUR GAME.
  - Updated to extend common plugin metadata patterns.
  - Loads configuration data from external file.
  - Proficiency conditional data is no longer saved to the actor.
  - Retroactively added this changelog.
### 1.0.0
  - The initial release.