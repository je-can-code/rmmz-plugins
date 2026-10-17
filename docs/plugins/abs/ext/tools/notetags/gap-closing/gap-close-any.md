---
type: notetag
title: Gap Close Any
description: The tag letting a skill gap close to whatever single target it hits, without matching keys.
tags: [abs-tools, tag, skill, gap-close]
---

# Gap Close Any

## Description

Put this on a skill instead of [`<gapClose:key>`](gap-closing.md) to skip key-matching entirely. A skill with this tag
gap closes to whatever single target its hitbox connects with, no matter what (or whether) that target carries a
`<gapCloseTarget:key>` of its own. Intended for melee gap-closers that just need to close distance to whatever they
hit — no pre-tagging required.

## TAG USAGE

- Skills

## TAG FORMAT

`<gapCloseAny>`

## TAG EXAMPLES

`<gapCloseAny>`
This skill gap closes to whatever single target its hitbox connects with.