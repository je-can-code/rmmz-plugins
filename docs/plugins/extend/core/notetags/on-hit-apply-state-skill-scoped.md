---
type: notetag
title: On-Hit Apply State (Skill-Scoped)
description: The tag making one skill apply a state to its target on hit, with an authored chance, duration and stacks.
tags: [extend, tag, skill, state, on-hit, duration, stacks]
---

# On-Hit Apply State (Skill-Scoped)

## Description

Have you ever wanted a specific skill to apply a state to its target with a custom duration or stack count, rather than
whatever the state's defaults are? Well now you can! By applying the appropriate tag directly to the skill, you can
author exactly how long or how many stacks a state lands with on a per-skill basis.

## NOTE ABOUT CHANCE

CHANCE is a whole percent between 0 and 100, and it rolls the way every chance a state has to land rolls, as
[State-Application Immunity & Resistance](../../../abs/core/notetags/states/state-application-immunity-resistance.md)
describes: it meets the target's State Rate traits and `<stateTypeResist>`, then, for a harmful state, the luck
between the caster and the target, and is then rolled with both battlers' fate, as
[On-Chance Roll Manipulation](../../../abs/core/notetags/skills/on-chance-roll-manipulation-lucky-cursed-rolls.md)
describes. A skill aimed at the caster's opponents applies its state as harm, so every curse the target carries is one
more chance for the state to land; a skill aimed at anyone else applies it as help, so every curse the target carries is
one more hurdle it has to clear.

[Accumulate Mode](../../../abs/core/notetags/skills/accumulate-mode.md) and
[Encore Repeats](../../../abs/core/notetags/skills/encore-repeats-bonus-proc-executions.md) can land the state more than
once on a single hit, and every landing carries the same DURATION and STACKS. The target's immunities are checked on
every landing, so a target that cannot receive the state never does, however the roll went.

## NOTE ABOUT DURATION

DURATION is in frames (60 frames = 1 second at 60fps). A positive value replaces the state's own
`jabsStateDurationFrames` value as the BASE duration, and wins over the state's own tags EVEN IF the state carries
[`<indefiniteState>`](../../../abs/core/notetags/states/state-durations.md) — an explicit DURATION always overrides the
target's own indefinite/duration tags. Attacker
[duration-boost tags](../../../abs/core/notetags/states/state-duration-extensions.md) (`stateDurationFlat`,
`stateDurationPerc`, `stateDurationFormula`) still apply on top of this overridden base, so passive gear and traits
remain relevant.

## NOTE ABOUT OPTIONAL VALUES

DURATION and STACKS are both optional, and DURATION carries two sentinels:

- Omitted, or `0`: no override — defer entirely to the state's own tags (`jabsStateDurationFrames`,
  `<indefiniteState>`), unchanged from today.
- `-1`: force this application indefinite, regardless of the state's own tags. No duration-boost math runs (there is no
  duration to boost).

Omitting STACKS uses the state's own default stack count.

## NOTE ABOUT MULTIPLE TAGS

A skill may carry multiple `<thisApplyState>` tags to apply different states on the same hit. Each entry is evaluated
independently.

## NOTE ABOUT BOTH VARIANTS

If both `<thisApplyState>` and [`<applyState>`](on-hit-apply-state-caster-wide.md) target the same state id on the same
hit, `<thisApplyState>` fires last and wins.

## TAG USAGE

- Skills only.

## TAG FORMAT

`<thisApplyState:[STATE_ID, CHANCE]>`
`<thisApplyState:[STATE_ID, CHANCE, DURATION]>`
`<thisApplyState:[STATE_ID, CHANCE, DURATION, STACKS]>`
Where STATE_ID is the id of the state to apply to the target.
Where CHANCE is the percent chance between 0 and 100 that it triggers.
Where DURATION is the duration in frames; omit or use 0 for the state's default, or -1 to force the application
indefinite regardless of the state's own tags.
Where STACKS is the starting stack count; omit to use the state's default.

## TAG EXAMPLES

`<thisApplyState:[8, 100, 240]>`
On hit, always apply state id 8 for 240 frames (4 seconds at 60fps).

`<thisApplyState:[8, 25]>`
On hit, 25% chance to apply state id 8 using the state's own default duration.

`<thisApplyState:[8, 50, 120, 2]>`
On hit, 50% chance to apply state id 8 for 120 frames with 2 starting stacks.

`<thisApplyState:[8, 50, 0, 2]>`
On hit, 50% chance to apply state id 8 with 2 starting stacks and the state's own default duration (0 = no duration
change).

`<thisApplyState:[8, 50, -1]>`
On hit, 50% chance to apply state id 8 forever, regardless of the state's own duration tags.