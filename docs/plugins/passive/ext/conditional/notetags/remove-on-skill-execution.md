---
type: notetag
title: Remove On Skill Execution
description: The tag giving a state a chance to lose a stack whenever its bearer executes a map skill.
tags: [passive-conditional, tag, state, stack, removal]
---

# Remove On Skill Execution

## Description

On this battler executing a map skill, rolls CHANCE (1–100). STYPE_ID 0 = any type. On success, peels stacks via
`decrementStateStacks` (respects [`loseAllStacksAtOnce`](../../../../abs/core/notetags/states/stack-config-overrides.md)
on this state row).

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