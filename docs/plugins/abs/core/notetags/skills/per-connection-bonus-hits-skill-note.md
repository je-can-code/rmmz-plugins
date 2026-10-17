---
type: notetag
title: Per-Connection Bonus Hits (Skill Note)
description: The tag adding extra battle-effect applications per target each time a skill's pierce step resolves.
tags: [abs, tag, skill, pierce, hits, formula]
---

# Per-Connection Bonus Hits (Skill Note)

## Description

Each time a pierce step resolves against targets, JABS runs the full battle-effect pipeline once per target, plus extra
runs controlled by bonus-hit tags. This tag on the skill adds extra applications per target for that step (stacking with
battler-side tags).

### Formula Variant

VAL can also be a bracketed formula instead of a flat integer, evaluated with `a` bound to the caster at the moment the
action is created.

### Parry vs Guard

If a parry triggers on a target during the first application of a bundle, remaining applications in that bundle for that
target are skipped. Guard still runs every application in the bundle with normal mitigation each time.

## NOTE ABOUT FLOORING

The final combined total across every bonus-hits source (flat and formula, skill-note and battler-side) is floored once
at the very end. Formulas do not need to wrap themselves in `floor()` -- the engine handles discretization so a clean
`a.luk / 10` is fine as-is.

## TAG USAGE

- Skills

## TAG FORMAT

`<bonus-hits:VAL>`
Where VAL is a non-negative integer added to the per-connection bonus.

`<bonus-hits:[FORMULA]>`
Where FORMULA is a JS-style expression (e.g. `<bonus-hits:[a.luk / 10]>`).

## TAG EXAMPLES

`<bonus-hits:2>`
Adds 2 to the per-connection bonus.

`<bonus-hits:[a.luk / 10]>`
Adds the caster's LUK divided by 10 to the per-connection bonus.