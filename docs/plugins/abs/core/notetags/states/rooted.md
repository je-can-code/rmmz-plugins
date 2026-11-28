---
type: notetag
title: Rooted
description: The tag locking a battler's movement while the state is applied.
tags: [abs, tag, state, movement]
---

# Rooted

## Description

Locks the battler's movement, including dodge skills for actors. It locks nothing else: a rooted battler can still
attack and use skills.

## NOTE ABOUT PASSIVES

A passive state carrying this tag roots its bearer for as long as the passive lasts, the same as an applied state does.
That is how a battler is pinned in place for good, like a turret or a vent.

## NOTE ABOUT AI

A rooted AI battler cannot walk into range, so it attacks from where it stands: once its target is within the reach of
the skill it chose, it fires that skill without moving, and while the target is out of reach it waits for the target to
come to it. A rooted battler does not wander while it is idle, either. To stop a battler from acting at all, use
[`<paralyzed>`](paralyzed.md) instead.

## TAG USAGE

- States

## TAG FORMAT

`<rooted>`

## TAG EXAMPLES

`<rooted>`
This state locks the battler's movement, including dodge skills for actors.