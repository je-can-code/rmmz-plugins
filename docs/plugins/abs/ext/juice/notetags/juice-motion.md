---
type: notetag
title: Juice Motion
description: The tag selecting the preset weapon overlay or caster-body motion a skill plays when it executes.
tags: [abs-juice, tag, skill, motion, overlay]
---

# Juice Motion

## Description

Selects a preset weapon/caster motion. Valid values:

- Weapon overlay: `arc` | `arc-reverse` | `arc-oscillate` | `bash` | `present` | `recoil` | `spin` | `spin-reverse` |
  `stab-forward`
- Caster-body: `squish` | `pulse` | `flip` | `flip-reverse`
- Suppress: `none` (equivalent to [`<noJuice>`](no-juice.md))

`present` lifts the icon upward on screen (screen-stable "brandish"; uses facing-up card).

`arc-oscillate` sweeps the arc back and forth, alternating direction on each sweep (see
[`<juiceRepeatCount:N>`](juice-repeat-count.md) for sweep count).

## NOTE ABOUT LEGACY KEYS

`swing-top-down` → `arc`; `swing-bottom-up` → `arc-reverse`; `spin-360` → `spin`; `spin-720` → `spin`;
`spin-360-reverse` → `spin-reverse`.

## NOTE ABOUT HEALING SKILLS

On healing skills, omitting `juiceMotion` keeps caster-only support squish; any `juiceMotion` tag opts into full strike
juice.

## TAG USAGE

- Skills

## TAG FORMAT

`<juiceMotion:NAME>`
Where NAME is the preset motion, one of the valid values above.

## TAG EXAMPLES

`<juiceMotion:arc-oscillate>`
This skill's weapon swing overlay sweeps the arc back and forth, alternating direction on each sweep.