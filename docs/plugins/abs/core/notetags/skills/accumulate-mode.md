---
type: notetag
title: Accumulate Mode
description: The tag counting every positive roll in a chance-roll contest instead of stopping at the first success.
tags: [abs, tag, on-chance, accumulate, encore]
---

# Accumulate Mode

## Description

By default, a chance-roll contest stops rolling the instant it finds one success (or exhausts all rolls without one).
With `<accumulate>`, every single positive roll in the contest is counted instead of stopping at the first success, and
that count feeds into how many times the proc executes -- stacking with (not replacing) [Encore
Repeats](encore-repeats-bonus-proc-executions.md).

Use ACCUMULATE MODE for "the luckier you get, the more it snowballs" builds; use plain LUCKY ROLLS/ENCORE REPEATS for a
steady, predictable bonus instead.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills

## TAG FORMAT

`<accumulate>`

## TAG EXAMPLES

`<accumulate>`
Every single positive roll in the contest is counted instead of stopping at the first success.