---
type: notetag
title: Block Auto Assignment per Skill Type
description: The tag blocking skills of the listed skill types from being auto-assigned.
tags: [abs, tag, actor, class, skill, learning]
---

# Block Auto Assignment per Skill Type

## TAG USAGE

- Actors
- Classes

## TAG FORMAT

`<noAutoAssignType:[TYPE_IDS...]>`
Where TYPE_IDS is a comma-delimited list of skill type ids.

## TAG EXAMPLES

`<noAutoAssignType:[2, 3]>`
Skills of skill type 2 or 3 are blocked from auto assignment.