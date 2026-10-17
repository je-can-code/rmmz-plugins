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

## NOTE ABOUT STATE RESISTANCE

State resistance is not taken into account in regards to the CHANCE of the various self-state effects. It is assumed
that the percent chance designated in the tag is fully representative of the chance that the state will be applied to
the caster.

## NOTE ABOUT MULTIPLE TRIGGERS

In addition to JABS multiple projectiles triggering the on-hit effect multiple times, having a skill "repeat", or in
JABS have multiple hits on the skill, will both result in triggering the on-hit effect multiple times.

## NOTE ABOUT LITERAL HITS

On-hit effects only process on a literal hit. If the action misses, is evaded, or is parried, then the on-hit effects
will not trigger.

## TAG USAGE

- Skills only.

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
The caster has a 40% chance of applying state w/ id of 3 to oneself. When using JABS, this applies as soon as the
skill/action is executed. When using non-JABS, this applies in the same phase as you would gain TP from executing a
skill.

`<onHitSelfState:[19,100]>`
The caster has a 100% (always) chance of appling state id 19 to oneself. This processes when the action successfully
hits the target. When using JABS, this applies as soon as the skill/action lands on a target. This will trigger multiple
times if an action has multiple projectiles. When using non-JABS, this applies when a skill successfully hits a target.
Misses, evades, and parries do not trigger this.

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
On cast, always force-execute skill id 1026, and separately roll a 50% chance to also force-execute skill id 1027.
Fires once at press-time (same timing as `onCastSelfState`), through JABS `forceMapAction` — no MP/TP cost, no cooldown
on the payload skills. Skill-scoped and repeatable: stack as many `<onCastExecuteSkill>` tags on one skill as you want,
each rolls independently. A forced skill's own `<onCastExecuteSkill>` tag may chain one further hop before being cut off
(depth-guarded against runaway loops).

`<onCastExecuteSkillIfAfflicted:[267,100,134]>`
On cast, if the caster currently has state id 134 active, force-execute skill id 267 at 100% chance. If the caster does
not have state 134, this tag does nothing- no roll occurs at all, and nothing is force-executed. Same
`<onCastExecuteSkill>` timing, JABS dispatch path, and depth guard; this is purely a gate on top of it. Skill-scoped and
repeatable, same as its unconditional counterpart.