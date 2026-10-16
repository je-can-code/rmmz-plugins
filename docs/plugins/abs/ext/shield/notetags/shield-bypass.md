---
type: notetag
title: Shield Bypass
description: The tag letting a skill ignore every shield, or only the shields of certain elements.
tags: [abs-shield, tag, skill, shield, bypass, element]
---

# Shield Bypass

## Description

Have you ever wanted to be able to ignore all those awesome shields that we just setup from all the previous tags? Well
now you can! By applying the appropriate tag on your skills, you too can bypass shields as much as you feel the player
should.

## NOTE ABOUT TYPES AND BYPASS INTERSECTIONS

Shield bypassing is expected to go hand-in-hand with [shield typing](shield-type.md). If a shield has any types that
intersect with the types of the skill AND the bypass types also intersect with any of the shield types, then the result
is that the shield will be bypassed. That sounds confusing to write, but in practice it'll probably be a lot less
complicated since skills typically only have one element associated with them. If you just want a skill that totally
bypasses shields, then use the typeless tag.

## TAG USAGE

- Skills

## TAG FORMAT

`<shieldBypass>`
This tag will indicate a skill will bypass any and all shields entirely.

`<shieldBypass:[TYPES...]>`
Where TYPES... is a comma-delimited array of numbers that represent the element ids from your database of the elements
that you want this skill to bypass shields for.

## TAG EXAMPLES

`<shieldBypass>`
This skill will entirely bypass all shields. There are no exceptions.

`<shieldBypass:[1,2,3]>`
This skill will bypass shields for elements with ids 1, 2, and 3.