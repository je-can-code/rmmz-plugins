---
type: notetag
title: Projectile
description: The tag defining how many projectiles fire when a skill is executed.
tags: [abs, tag, skill, projectile]
---

# Projectile

## Description

How many projectiles fire when the skill is executed. All fire in parallel in the direction the caster is facing.

## NOTE ABOUT PERFORMANCE

There is no hard cap, but keep the count reasonable to avoid performance issues.

## TAG USAGE

- Skills

## TAG FORMAT

`<projectile:VAL>`
Where VAL is the number of projectiles per direction.

## TAG EXAMPLES

`<projectile:3>`
This skill fires 3 projectiles per direction.