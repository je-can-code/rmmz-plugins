---
type: notetag
title: Auto Assignment of Skills
description: The tag enabling newly learned skills to be auto-assigned to empty combat slots.
tags: [abs, tag, actor, class, skill, slot, learning]
---

# Auto Assignment of Skills

## Description

For developer convenience, new skills can be auto-assigned to combat slots when learned. Skills can only auto-assign to
the four combat slots, not mainhand/offhand/dodge/tool.

### Auto Assignment Conditionals

The full check for auto-assignment upon learning a skill:

1) The actor or class has the "enable auto assign" tag.
2) The actor doesn't already have the skill equipped.
3) The actor has an empty combat slot.
4) The skill is not blocked from auto assignment.
5) The skill is not upgrade-only.
6) The skill type is not on the blacklist.

If all are true, the skill is auto-assigned.

## TAG USAGE

- Actors
- Classes

## TAG FORMAT

`<autoAssignSkills>`

## TAG EXAMPLES

`<autoAssignSkills>`
This actor or class has the "enable auto assign" tag, so newly learned skills can auto-assign to empty combat slots.