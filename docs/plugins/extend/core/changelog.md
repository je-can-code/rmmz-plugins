---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.9.0
  - Added Game_Item#carryWhenSynthetic, so a synthetic row keeps the fields a real database row would have carried.
### 1.8.0
  - Only a row the database does not contain is carried on the item now. A row the engine can find by id stays a class
    plus an id, so a savefile holds a reference to it rather than a frozen copy that never sees a rebalance.
### 1.7.3
  - Adapted to the RPGManager array read signature.
### 1.7.2
  - The plugin metadata class no longer declares private members. Its base constructor reaches postInitialize before a
    derived class installs its own, so anything private was being touched on an object that did not yet have it.
### 1.7.1
  - Split Game_Item's extension state so the default lands in initMembers while the mapping from the constructed item
    stays in the initialize alias. Decoding never runs a constructor, so only the half that does not depend on the
    incoming item can move.
### 1.7.0
  - Renamed plugin from J-SkillExtend to J-Extend (PLUGIN_NAME only; no functional change, nothing else in the codebase
    referenced the old name by string).
  - Added <extendType:CLASSIFIER> — extends every skill/state carrying a matching J-Base <type:CLASSIFIER> tag instead
    of listing ids one by one. Type-based overlays apply before id-based overlays; id-based wins on conflict.
  - Added <applyState>/<thisApplyState> — apply a state on hit with an authored chance, and optionally an overridden
    duration (0 = state's own default, -1 = force indefinite) and starting stack count. thisApplyState is skill-scoped;
    applyState reads from any of the caster's note sources. thisApplyState wins when both target the same state id on
    the same hit.
  - Added two new sibling integration plugins: J-Extend-ABS (prevents JABS AI from selecting extension skills as
    actions) and J-Extend-SKS (skill equip detail window shows the overlayed skill).
### 1.6.0
  - Added <toggleGroupOnExecute:[STATE_ID, ...]> — a skill-scoped, press-time cycle-group toggle for
    stance/equation-style mechanics with more than one exclusive state. Coupled and self-repairing, unlike stacking
    independent <toggleOnExecute> tags for the same purpose.
  - Fixed Game_Action#toggleOnExecuteStateIds throwing on every execution — it read the tag through
    RPGManager.getNumbersFromNoteByRegex, which expects a single bracketed list capture (the shape every other consumer
    of that helper uses), but this tag captures one bare number per repeated line. Switched to
    RPGManager.getStringsFromNoteByRegex (which collects one entry per matching line instead of overwriting) plus a
    Number() map. No notetag syntax change; existing <toggleOnExecute:STATE_ID> data is unaffected.
### 1.5.0
  - Added <toggleOnExecute:STATE_ID> — a skill-scoped, press-time state toggle for stance-style skills (add if absent,
    remove if present). Repeatable.
### 1.4.1
  - Fixed Game_Actor#hasSkill to compare by skill id rather than object reference.
  - Vanilla uses includes($dataSkills[id]) which breaks the moment the overlay system returns a clone instead of the
    original database entry — hasSkill would always return false for any overlaid skill, silently blocking JABS action
    execution.
  - Optimized OverlayManager#getExtendedSkill hot path: the per-caster cache is now checked before any array allocation,
    filter, sort, or string construction. Cache hits are O(1); the skillId alone is a stable key because the whole
    per-caster cache is invalidated wholesale on every learnSkill / forgetSkill call.
### 1.4.0
  - Structural refactor of OverlayManager#getExtendedSkill: overlay candidates are now collected via caster.skillIds()
    (raw IDs, no skill()/skills() involvement) instead of caster.skills(). Removed the WeakSet re-entrancy guard. Each
    overlay id is now recursively resolved through getExtendedSkill before being applied, so chained extensions (A
    extends B extends C) produce a fully merged result at every level.
  - A per-skillId WeakMap/Set circular-extension guard replaces the old caster-level guard; it throws a clear error on
    circular data rather than silently falling back.
### 1.3.0
  - Lifted skill() override from Game_Actor to Game_Battler so enemies also receive overlay-merged skills when
    J-SkillExtend is loaded. Aliased Game_Actor#skills to map through this.skill(), making the plural form consistent
    with the singular for all consumers including the passive system.
### 1.2.1
  - Fixed extendEffects to deduplicate addState effects by state ID when merging overlays.
  - When an extension defines a state application, any prior entry for that state ID is replaced rather than
    concatenated — last extension wins per state. Multiple entries for the same state within a single extension are
    preserved for intentional stack effects.
### 1.2.0
  - Implement caching for skill extensions by caster.
  - Consume `RPGManager` updates.
### 1.1.0
  - Rewrite tag override functionality to replace excluding specified keys.
### 1.0.1
  - Fixed reference error when attempting to extend skills w/ on-hit effects.
  - Retroactively added this CHANGELOG.
### 1.0.0
  - Initial release.