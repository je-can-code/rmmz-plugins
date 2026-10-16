---
type: notetag
title: On Defeated Target
description: The tag making an onTargetDefeat skill spawn on the defeated target rather than on the caster.
tags: [abs, tag, on-chance, defeat, animation]
---

# On Defeated Target

## Description

A companion flag for `<onTargetDefeat>`. When present on a skill that fires via `onTargetDefeat`, the action event
spawns on top of the defeated target's last position rather than on the caster.

Without this flag, the `onTargetDefeat` skill spawns at the caster.
With this flag, the visual effect appears where the target fell.
Use this to create effects like "on kill: play animation on corpse".

## TAG USAGE

- Skills, on a skill that fires via `<onTargetDefeat>`.

## TAG FORMAT

`<onDefeatedTarget>`

## TAG EXAMPLES

`<onDefeatedTarget>`
When this skill fires via `onTargetDefeat`, the action event spawns on top of the defeated target's last position.