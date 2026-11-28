---
type: notetag
title: Disabled
description: The tag locking a battler's basic attacks while the state is applied.
tags: [abs, tag, state, attack]
---

# Disabled

## Description

Locks the battler's basic attacks. For actors, this is mainhand and offhand. For enemies, this is their basic attack
traited skill. A passive state carrying this tag disables its bearer for as long as the passive lasts, the same as an
applied state does.

The moment a disabling state lands, it cancels a basic attack its bearer had lined up that winds up with a cast time,
whether the windup has started or not, with no cooldown spent on it. A basic attack with no cast time has no windup to
cut, so one already decided still goes off.

## TAG USAGE

- States

## TAG FORMAT

`<disabled>`

## TAG EXAMPLES

`<disabled>`
This state locks the battler's basic attacks.