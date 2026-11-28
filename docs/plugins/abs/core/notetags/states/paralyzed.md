---
type: notetag
title: Paralyzed
description: The tag locking a battler's movement, basic attacks and combat skills all at once.
tags: [abs, tag, state, movement, attack, skill]
---

# Paralyzed

## Description

Functionally the same as being rooted, disabled, and muted all at once. A paralyzed AI battler neither moves nor acts on
its own, which makes this the state for holding a boss still while a boss fight's script acts for it: the fight's
forced skills still fire.

A passive state carrying this tag paralyzes its bearer for as long as the passive lasts, the same as an applied state
does.

## TAG USAGE

- States

## TAG FORMAT

`<paralyzed>`

## TAG EXAMPLES

`<paralyzed>`
This state is functionally the same as being rooted, disabled, and muted all at once.