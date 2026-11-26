---
type: notetag
title: Remove On Skill Execution
description: The tag giving a state a chance to lose a stack whenever its bearer pays for a map skill it is executing.
tags: [passive-conditional, tag, state, stack, removal]
---

# Remove On Skill Execution

## Description

Once this battler has paid for a map skill it is executing, rolls CHANCE (1–100), once for the state however many
stacks it has. STYPE_ID 0 = any type. On success, peels stacks via `decrementStateStacks` (respects
[`loseAllStacksAtOnce`](../../../../abs/core/notetags/states/stack-config-overrides.md) on this state row).

The roll comes after the cost, so a state it strips still shapes what that skill costs: a "next cast is free" buff
really is free. A decided cast, a dodge and a channel's vessel all pay; a forced payload never does, so never reaches
it.

## NOTE ABOUT WHERE THE TAG LIVES

Tag lives on the state that may be removed — not on skills/equip.

## TAG USAGE

- States only.

## TAG FORMAT

`<removeOnSkillExecution:[STYPE_ID, CHANCE]>`
Where STYPE_ID is the skill type id; 0 = any type,
Where CHANCE is the chance rolled (1–100).

## TAG EXAMPLES

`<removeOnSkillExecution:[7, 100]>`
`<removeOnSkillExecution:[0, 25]>`