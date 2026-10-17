---
type: notetag
title: Vision Multiplier
description: The tag scaling how well a battler sees its opponents.
tags: [abs, tag, battler, vision, sight, pursuit]
---

# Vision Multiplier

## Description

You can scale how well a battler sees its opponents using this tag. It modifies the sight and pursuit radii by a percent
offset from 100.

A value of 0 has no effect. Tags from all applicable notes are summed. Values are clamped so the result never drops
below zero.

## TAG USAGE

- Actors
- Classes
- Enemies
- Weapons
- Armor
- States

## TAG FORMAT

`<visionMultiplier:VAL>`
Where VAL is the percent offset (e.g. 50 adds 50%, -50 cuts in half).

## TAG EXAMPLES

`<visionMultiplier:50>`
An enemy with sight 4 and a state bearing this tag will see as if it had sight 6 for the duration of that state.