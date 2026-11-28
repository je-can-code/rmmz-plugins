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

## NOTE ABOUT CANCELLING

The moment a paralyzing state lands, it cancels whatever its bearer had lined up: a windup or channel in flight stops,
and the action it had decided on is dropped, with no cooldown spent on it. It decides afresh once it can act again.
Every application cancels, a repeat one included, so a boss fight's script puts its hold on before forcing a cast,
never while one of its forced casts is still winding up.

A passive state carrying this tag paralyzes its bearer for as long as the passive lasts, the same as an applied state
does.

## TAG USAGE

- States

## TAG FORMAT

`<paralyzed>`

## TAG EXAMPLES

`<paralyzed>`
This state is functionally the same as being rooted, disabled, and muted all at once.