---
type: notetag
title: Aggro Multiplier
description: The tag scaling the aggro a skill generates by a decimal multiplier.
tags: [abs, tag, skill, aggro]
---

# Aggro Multiplier

## NOTE ABOUT DEFAULT VALUE

Default is 1.0. A value of 0.5 halves aggro; 2.0 doubles it.

## NOTE ABOUT HIT/MISS/PARRY

All aggro tags fire regardless of hit/miss/parry, same as the base aggro calculation chain.

## TAG USAGE

- Skills

## TAG FORMAT

`<aggroMultiplier:VAL>`
Where VAL is a decimal multiplier applied on top of all other aggro.

## TAG EXAMPLES

`<aggroMultiplier:2.0>`
This skill's aggro is doubled.