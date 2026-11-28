---
type: notetag
title: On-Hit Apply State When Afflicted
description: The tags making a hit apply a state only to a target already afflicted with another, from one skill or every hit.
tags: [extend, tag, skill, state, on-hit, passive]
---

# On-Hit Apply State When Afflicted

## Description

Have you ever wanted a hit to make an affliction worse, rather than start a new one? A curse that only deepens on foes
who are already cursed, or a blade that turns a bleed into a hemorrhage? Well now you can! By naming the state a target
must already carry, these tags apply a state only to the targets that were already afflicted, and leave everyone else
alone.

## NOTE ABOUT TIMING

The target is judged as it stood before the hit landed anything. A hit's own state effects land partway through the
hit, so a necessary state that the same hit applies never counts: a skill that applies state 72 and carries
`<thisApplyStateWhenAfflicted:[73, 72, 100]>` puts only state 72 on a fresh target, and adds state 73 from its next hit
on. Who put the necessary state there does not matter, only that it was already there.

## NOTE ABOUT CHANCE

CHANCE is a whole percent between 0 and 100, and it rolls the way every chance a state has to land rolls, as
[State-Application Immunity & Resistance](../../../abs/core/notetags/states/state-application-immunity-resistance.md)
describes: it meets the target's State Rate traits and `<stateTypeResist>`, then, for a harmful state, the luck
between the caster and the target, and is then rolled with both battlers' fate, as
[On-Chance Roll Manipulation](../../../abs/core/notetags/skills/on-chance-roll-manipulation-lucky-cursed-rolls.md)
describes.

[Accumulate Mode](../../../abs/core/notetags/skills/accumulate-mode.md) and
[Encore Repeats](../../../abs/core/notetags/skills/encore-repeats-bonus-proc-executions.md) can land the state more than
once on a single hit. Each landing uses the state's own duration and stacks, and the target's immunities are checked on
every one, so a target that cannot receive the state never does, however the roll went.

## NOTE ABOUT BOTH VARIANTS

| Variant | Read from | Fires on |
|---|---|---|
| `<applyStateWhenAfflicted>` | every note source the caster has | every hit the caster lands, with anything |
| `<thisApplyStateWhenAfflicted>` | the skill's own note | that skill's own hits |

Caster-wide entries roll first and skill-scoped ones last. A caster-wide tag placed on a skill counts toward every hit
its caster lands while that skill is known, not only that skill's own hits, so a tag meant for one skill wants the
`this` variant.

## NOTE ABOUT MULTIPLE TAGS

A source may carry several of these tags, each naming its own pair of states. Each entry is judged and rolled on its
own.

## TAG USAGE

- `<thisApplyStateWhenAfflicted>`: Skills only.
- `<applyStateWhenAfflicted>`: Actors, Classes, Enemies, Weapons, Armors, States and Skills.

## TAG FORMAT

`<thisApplyStateWhenAfflicted:[APPLYING_STATE_ID, NECESSARY_STATE_ID, CHANCE]>`
`<applyStateWhenAfflicted:[APPLYING_STATE_ID, NECESSARY_STATE_ID, CHANCE]>`
Where APPLYING_STATE_ID is the id of the state to apply to the target.
Where NECESSARY_STATE_ID is the id of the state the target must already carry.
Where CHANCE is the percent chance between 0 and 100 that it triggers.

## TAG EXAMPLES

`<thisApplyStateWhenAfflicted:[73, 72, 100]>`
On a skill: its hits always apply state id 73 to a target that already carried state id 72 before the hit.

`<applyStateWhenAfflicted:[37, 15, 50]>`
On a weapon: every hit its wielder lands has a 50% chance to apply state id 37 to a target already afflicted with state
id 15.