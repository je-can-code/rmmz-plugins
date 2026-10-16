---
type: notetag
title: Shield Amplification / Effectiveness
description: The tags scaling the shields a battler grants (SAR) and the shields a battler receives (SER).
tags: [abs-shield, tag, shield, amplification, effectiveness, parameter]
---

# Shield Amplification / Effectiveness

## Description

Two percent-point stats scale every shield this battler is involved with, summed from all of a battler's note sources
(actor, class, weapons, armors, states) and also contributed to by SDP panel investment.

SAR (Shield Amplification Rate) scales shields THIS battler grants when applying a shield state to someone (including
themselves). SER (Shield Effectiveness Rate) scales shields THIS battler receives, regardless of who applied them. Both
default to a neutral 100 (1.0x multiplier).

## TAG USAGE

- Actors
- Classes
- Enemies
- Weapons
- Armor
- States

## TAG FORMAT

`<sar:PERCENT_POINTS>`
`<ser:PERCENT_POINTS>`
Where PERCENT_POINTS is a signed integer offset from the 100 baseline. All matching sources are summed before being
converted to a multiplier.

## TAG EXAMPLES

`<sar:25>`
This source grants +25 percent-points of Shield Amplification, meaning shields this battler applies to others (or
themselves) come out 25% larger.

`<ser:-50>`
This source grants -50 percent-points of Shield Effectiveness, meaning any shield this battler receives is worth half as
much.