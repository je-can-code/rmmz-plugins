---
type: notetag
title: No Damage
description: The tag letting a battler be healed but never hurt.
tags: [abs, tag, state, damage, immunity]
---

# No Damage

## Description

While a battler carries `<noDamage>` on any of its own notes, nothing harms its HP or MP. It doesn't matter what type
of damage it is or where it comes from:

```
- hits and drains, on HP or MP alike.
- J-ABS-Formula packets.
- damage over time from states.
- natural regeneration run below zero.
- damage floors.
- Recover HP and Recover MP effects written below zero.
```

A hit is held back as its final number, after every multiplier has had its say, so it reaches shields and drains as 0.
A shield loses nothing to it, a drain takes nothing from it, and none of the battler's on-damage reactions fire. A tick
of damage over time is shrugged off whole: it doesn't land, it doesn't pop up, and it isn't recorded as the last thing
that hit the battler.

Healing still lands. The tag doesn't stop states from applying, either: a poison still goes on, it just ticks for
nothing.

What isn't damage still goes through: skill costs, TP loss, event commands that set HP or MP, and the death state.
Keeping the death state off is [`<immuneToAll>`](state-application-immunity-resistance.md)'s job.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills, known by the battler.

## TAG FORMAT

`<noDamage>`

## TAG EXAMPLES

`<noDamage>`
On a state: while it's applied, the battler can be healed but never hurt.
