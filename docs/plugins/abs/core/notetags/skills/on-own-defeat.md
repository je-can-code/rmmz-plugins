---
type: notetag
title: On Own Defeat
description: The tag defining a parting skill a battler may fire when it is defeated.
tags: [abs, tag, on-chance, defeat]
---

# On Own Defeat

## Description

When this battler is defeated, they may fire a parting skill.

Use this for enemies that "explode" or curse the player on death.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills

## TAG FORMAT

`<onOwnDefeat:[SKILL_ID,CHANCE]>`
Where SKILL_ID is the skill to fire on self-defeat.
Where CHANCE is the integer percent chance to fire it (0-100).

## TAG EXAMPLES

`<onOwnDefeat:[25,50]>`
Fires skill ID 25 on self-defeat, at a 50 percent chance to fire it.