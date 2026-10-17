---
type: notetag
title: Guarding
description: The tags configuring a guard skill's damage reduction, parry window and counter skills.
tags: [abs, tag, skill, guard, parry, counter]
---

# Guarding

## Description

Guarding is a first-class feature of JABS!

### Implicit vs Explicit Parry

Implicit (passive) parry uses attacker pressure A vs defender pressure D: baseline floor plus per-level on each side
(caster level on A, target level on D), then 100×HIT and 100×(GRD−1) respectively and small AGI/LUK terms; `J-LEVEL`
scales A like other attacker-vs-target effects, then ratio = A/max(D,1). If ratio >= M (plugin param, default 2), no
parry; if ratio <= 1/M, always parry; between, linear chance. It does not run while the defender is guarding, casting,
or dashing — timed guard parry replaces implicit while a guard is held, and committed movement or casts suspend passive
parry. Dash and guard are mutually exclusive for the player (pivot guard clears dash; pixel movement does not reapply
dash while guarding).

Explicit parry is the `<parry:N>` window after raising guard; the parry extension rate extends that window. Skills may
still use `<unparryable>` and `<ignoreParry:N>`.

### Guard

The basic guard tag defines damage reduction when guarding.

### Parry

Defines the window (in frames) where a "just guard" completely mitigates an incoming attack.

The window opens when guarding starts and counts down.
A successful parry is identified by a blue flash on the guarding battler.

### Counter-Guard/Counter-Parry

Define a skill to fire back when guarding or parrying.

## NOTE ABOUT GUARD SKILL TYPES

A skill must have the "Guard Skill Type" id to be recognized as a guard skill. This is defined in the plugin parameters.

## NOTE ABOUT PARRYING AGAIN

On a successful parry, all guarding stops and the parry window ends.
Release and re-press the guard button to parry again.

## NOTE ABOUT COUNTER PRECEDENCE

Counter-parry takes precedence over counter-guard.
If both are available and RNG favors a counter, only counter-parry fires.

## TAG USAGE

- Skills, on a guard skill.

## TAG FORMAT

`<guard:[FLAT,PERCENT]>`
Where FLAT is the flat damage modification (usually negative).
Where PERCENT is the percent damage modification (usually negative).

`<parry:VAL>`
Where VAL is the number of frames parrying is available.

`<counterGuard:[SKILL,CHANCE]>`
Where SKILL is the skill ID to counter with when guarding.
Where CHANCE is the percent chance to execute per hit guarded.

`<counterParry:[SKILL,CHANCE]>`
Where SKILL is the skill ID to counter with when parrying.
Where CHANCE is the percent chance to execute on parry.

## TAG EXAMPLES

`<guard:[-10,-25]>`
Reduces damage by 10 flat, then by 25%. Flat comes first to favor the player.

`<parry:15>`
Parrying is available for 15 frames.

`<counterGuard:[7,50]>`
Counters with skill ID 7 when guarding, at a 50 percent chance to execute per hit guarded.

`<counterParry:[8,100]>`
Counters with skill ID 8 when parrying, at a 100 percent chance to execute on parry.