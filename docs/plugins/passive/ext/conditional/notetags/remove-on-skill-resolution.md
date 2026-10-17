---
type: notetag
title: Remove On Skill Resolution
description: The tag giving a state a chance to lose a stack whenever an action its bearer fired expires.
tags: [passive-conditional, tag, state, stack, removal]
---

# Remove On Skill Resolution

## Description

When the action fired by this battler fully expires — after its last hit lands, or after it travels its full duration
without contacting any target — rolls CHANCE (1–100). STYPE_ID 0 = any type. On success, peels stacks via
`decrementStateStacks` (respects [`loseAllStacksAtOnce`](../../../../abs/core/notetags/states/stack-config-overrides.md)
on this state row).

## NOTE ABOUT WHERE THE TAG LIVES

Tag lives on the state that may be removed — not on skills/equip.

## NOTE ABOUT TIMING

Unlike [`removeOnSkillExecution`](remove-on-skill-execution.md), removal fires at action expiry (after damage is
already resolved), so state traits such as ATK bonuses are still present during damage calculation.

## TAG USAGE

- States only.

## TAG FORMAT

`<removeOnSkillResolution:[STYPE_ID, CHANCE]>`
Where STYPE_ID is the skill type id; 0 = any type,
Where CHANCE is the chance rolled (1–100).

## TAG EXAMPLES

`<removeOnSkillResolution:[7, 100]>`
`<removeOnSkillResolution:[0, 25]>`