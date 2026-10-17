---
type: notetag
title: On Target Defeat
description: The tag defining a follow-up skill a battler may fire when it defeats a target.
tags: [abs, tag, on-chance, defeat]
---

# On Target Defeat

## Description

When this battler defeats a target, they may fire a follow-up skill.

Use this for "execute" skills or landing a visual flourish on a kill.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills

## TAG FORMAT

`<onTargetDefeat:[SKILL_ID,CHANCE]>`
Where SKILL_ID is the skill to fire when killing a target.
Where CHANCE is the integer percent chance to fire it (0-100).

## TAG EXAMPLES

`<onTargetDefeat:[30,25]>`
Fires skill ID 30 when killing a target, at a 25 percent chance to fire it.