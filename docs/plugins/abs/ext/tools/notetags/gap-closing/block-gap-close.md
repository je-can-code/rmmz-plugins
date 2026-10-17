---
type: notetag
title: Block Gap Close
description: The tag making a battler immune to all gap closing, including gap close any skills.
tags: [abs-tools, tag, enemy, state, equipment, gap-close]
---

# Block Gap Close

## Description

Put this on an enemy, state, or equipment to make that battler immune to ALL gap closing, including
[`<gapCloseAny>`](gap-close-any.md) skills. This is the only way to opt a target out of an "any" gapcloser — useful for
bosses, flying units, or holding a hookshot-only chasm as a genuine traversal gate instead of letting a combat
gapcloser trivialize it.

## TAG USAGE

- Enemies
- States
- Weapons
- Armor

## TAG FORMAT

`<blockGapClose>`

## TAG EXAMPLES

`<blockGapClose>`
This battler is immune to all gap closing, including `<gapCloseAny>` skills.