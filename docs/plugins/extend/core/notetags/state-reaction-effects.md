---
type: notetag
title: State Reaction Effects
description: The tags making a skill apply, lose, strip or remove states, or force-execute skills, when cast or on hit.
tags: [extend, tag, skill, state, on-cast, on-hit]
---

# State Reaction Effects

## Description

Have you ever wanted a battler to be able to inflict themselves with a state, lose one of their own state stacks, strip
a state stack from a target, or fully remove a state from a target as part of a skill's execution? Well now you can! By
applying the appropriate tag to the skill(s) in question, you too can have battlers that react to casting or landing
skills with state application and removal effects.

## NOTE ABOUT CHANCE

The self-states (`<onCastSelfState>`, `<onHitSelfState>` and `<onCastSelfStateIfAfflicted>`) roll the way every chance a
state has to land rolls, as
[State-Application Immunity & Resistance](../../../abs/core/notetags/states/state-application-immunity-resistance.md)
describes, with the caster as both the battler applying the state and the one receiving it. CHANCE meets the caster's
own State Rate traits and `<stateTypeResist>`, the caster holds no luck over itself, and its fate counts once.
[Accumulate Mode](../../../abs/core/notetags/skills/accumulate-mode.md) and
[Encore Repeats](../../../abs/core/notetags/skills/encore-repeats-bonus-proc-executions.md) can land the state more than
once, and the caster's immunities are checked on every landing.

The lose, strip and remove effects meet no resistances. CHANCE rolls with the caster's fate against whoever loses the
state, as
[On-Chance Roll Manipulation](../../../abs/core/notetags/skills/on-chance-roll-manipulation-lucky-cursed-rolls.md)
describes. A skill aimed at the caster's opponents strips and removes as harm, so every curse its target carries is one
more chance for the removal to land; a skill aimed at anyone else strips and removes as help, so every curse its target
carries is one more hurdle the removal has to clear. A caster losing its own state brings its fate once.

`<onCastExecuteSkill>` and `<onCastExecuteSkillIfAfflicted>` roll CHANCE with the caster's own fate alone, once per
tag, as [On-Chance Roll Manipulation](../../../abs/core/notetags/skills/on-chance-roll-manipulation-lucky-cursed-rolls.md)
describes: the caster's lucky and cursed rolls, joined by the cast skill's own `<thisLuckyRolls>` and
`<thisCursedRolls>`, weigh on any CHANCE under 100. Nothing is aimed at anyone yet, so no resistance and no other
battler's fate weighs on it. A caster under `<veryLucky>` executes the payload every time, even at 0%, and one under
`<veryCursed>` never does, even at 100%. A payload whose roll lands executes once: Accumulate Mode and Encore never
repeat it.

## NOTE ABOUT MULTIPLE TRIGGERS

In addition to JABS multiple projectiles triggering the on-hit effect multiple times, having a skill "repeat", or in
JABS have multiple hits on the skill, will both result in triggering the on-hit effect multiple times.

## NOTE ABOUT LITERAL HITS

On-hit effects only process on a literal hit. If the action misses, is evaded, or is parried, then the on-hit effects
will not trigger.

## TAG USAGE

- Skills.
- States the caster carries, for every tag here except `<onCastExecuteSkill>` and `<onCastExecuteSkillIfAfflicted>`,
  which read the executing skill's own note only.

## TAG FORMAT

`<onCastSelfState:[STATE_ID,CHANCE]>`
`<onCastSelfStateIfAfflicted:[STATE_TO_APPLY,CHANCE,STATE_REQUIREMENT]>`
`<onHitSelfState:[STATE_ID,CHANCE]>`
`<onCastLoseState:[STATE_ID,CHANCE]>`
`<onHitLoseState:[STATE_ID,CHANCE]>`
`<onCastStripState:[STATE_ID,CHANCE]>`
`<onHitStripState:[STATE_ID,CHANCE]>`
`<onCastRemoveState:[STATE_ID,CHANCE]>`
`<onHitRemoveState:[STATE_ID,CHANCE]>`
`<onCastExecuteSkill:[SKILL_ID,CHANCE]>`
`<onCastExecuteSkillIfAfflicted:[SKILL_ID,CHANCE,STATE_REQUIREMENT]>`
Where STATE_ID is the id of the state to apply, strip, or remove.
Where CHANCE is the percent chance between 0 and 100 that it'll trigger.

## TAG EXAMPLES

`<onCastSelfState:[3,40]>`
The caster has a 40% chance of applying state w/ id of 3 to oneself. This applies as soon as the skill/action is
executed.

`<onHitSelfState:[19,100]>`
The caster has a 100% chance of applying state id 19 to oneself. This processes when the action successfully
hits the target, as soon as the skill/action lands on it. This will trigger multiple times if an action has multiple
projectiles. Misses, evades, and parries do not trigger this.

`<onCastSelfStateIfAfflicted:[42,100,19]>`
On cast, if the caster currently has state id 19 (STATE_REQUIREMENT) active, apply state id 42 (STATE_TO_APPLY) to
oneself at 100% chance. If the caster does not have state 19, this tag does nothing- no roll occurs at all.

`<onCastLoseState:[6,100]>`
The caster has a 100% (always) chance of losing one stack of state id 6 from oneself. This processes alongside other
on-cast effects when the skill is executed.

`<onHitLoseState:[7,50]>`
The caster has a 50% chance of losing one stack of state id 7 from oneself when the skill successfully hits a target.

`<onCastStripState:[8,100]>`
The caster has a 100% (always) chance of stripping one stack of state id 8 from the target. This processes alongside
other on-cast effects when the skill is executed.

`<onHitStripState:[9,40]>`
The caster has a 40% chance of stripping one stack of state id 9 from the target when the skill successfully hits that
target.

`<onCastRemoveState:[10,100]>`
The caster has a 100% (always) chance of fully removing state id 10 from the target. This processes alongside other
on-cast effects when the skill is executed.

`<onHitRemoveState:[11,40]>`
The caster has a 40% chance of fully removing state id 11 from the target when the skill successfully hits that target.

`<onCastExecuteSkill:[1026,100]>`
`<onCastExecuteSkill:[1027,50]>`
On cast, force-execute skill id 1026 at 100%, which only a caster under `<veryCursed>` misses, and separately roll a 50%
chance, with the caster's own fate, to also force-execute skill id 1027. Fires once at press-time (same timing as
`onCastSelfState`), through JABS `forceMapAction` — no MP/TP cost, no cooldown on the payload skills. Skill-scoped and
repeatable: stack as many `<onCastExecuteSkill>` tags on one skill as you want, each rolls independently. A forced
skill's own `<onCastExecuteSkill>` tag may chain one further hop before being cut off (depth-guarded against runaway
loops).

`<onCastExecuteSkillIfAfflicted:[267,100,134]>`
On cast, if the caster currently has state id 134 active, force-execute skill id 267 at 100% chance, rolled exactly as
`<onCastExecuteSkill>` rolls. If the caster does not have state 134, this tag does nothing- no roll occurs at all, and
nothing is force-executed. Same `<onCastExecuteSkill>` timing, JABS dispatch path, and depth guard; this is purely a
gate on top of it. Skill-scoped and repeatable, same as its unconditional counterpart.