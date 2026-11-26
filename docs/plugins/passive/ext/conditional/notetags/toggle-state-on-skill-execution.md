---
type: notetag
title: Toggle State On Skill Execution
description: The tag arming a state on one hardcast of a skill type and spending it on the next, a Red Mage's Dualcast.
tags: [passive-conditional, tag, state, toggle, dualcast]
---

# Toggle State On Skill Execution

## Description

Each time this battler pays for a hardcast of type STYPE_ID, STATE_ID flips: the battler gains it when it lacks it, and
loses it outright when it carries it. A hardcast is any skill of that type that costs MP, however long or short its
cast. Those casts alternate: a plain cast, then one the armed state shapes, then a plain one again. STYPE_ID 0 = any
type. A skill that costs no MP, and a skill of another type, leave the state alone.

The flip happens once the cost is paid. The spending cast's cast time was read when it was decided, with the state on,
and its cost was paid with the state on, so a state that makes a cast instant and free makes the spending cast both.
The spending cast never arms the state again. An armed state no cast spends lapses on its own `<stateDuration>`.

## NOTE ABOUT WHERE THE TAG LIVES

Tag lives on the state that holds the rule, usually a passive the bearer always carries, and names the state it arms
and spends. The named state carries the effects: a cast speed and a cost rate, say.

## NOTE ABOUT WHAT REACHES IT

A decided cast, a dodge and a channel's vessel all pay, so all of them can flip it. A forced payload never pays (an
auto-executed skill, a retaliation, a channel's tick), so none of them do.

An AI (or a player) can decide a cast while the state is armed and then wait before the cast fires: walking into
range, for instance. If the state lapses in that wait, the cast pays its full cost and arms the state instead.

## TAG USAGE

- States only.

## TAG FORMAT

`<toggleStateOnSkillExecution:[STATE_ID, STYPE_ID]>`
Where STATE_ID is the state armed and spent,
Where STYPE_ID is the skill type id; 0 = any type.

## TAG EXAMPLES

`<toggleStateOnSkillExecution:[143, 4]>`
A Red Mage's Dualcast, when state 143 carries `<castSpeedRate:[-300]>` and an MP-cost-rate of 0: a Magecraft spell that
costs MP arms 143, the next one is instant and free and spends it, and the one after that arms it again. A cheap mover
arms it, so the big nuke after it fires free.