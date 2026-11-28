---
type: notetag
title: Muted
description: The tag locking a battler's combat skills while the state is applied.
tags: [abs, tag, state, skill]
---

# Muted

## Description

Locks the battler's combat skills. For actors, this is the four combat slots. For enemies, this is any skill that isn't
the basic attack. A passive state carrying this tag mutes its bearer for as long as the passive lasts, the same as an
applied state does.

The moment a muting state lands, it cancels a skill its bearer had lined up that winds up with a cast time, whether the
windup has started or not, with no cooldown spent on it. A skill with no cast time has no windup to cut, so one already
decided still goes off. A boss fight's scripted cast counts too: a mute landing during its windup cancels it.

## TAG USAGE

- States

## TAG FORMAT

`<muted>`

## TAG EXAMPLES

`<muted>`
This state locks the battler's combat skills.