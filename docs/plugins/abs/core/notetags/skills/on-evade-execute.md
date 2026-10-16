---
type: notetag
title: On Evade Execute
description: The tag defining a skill a battler may fire when it evades an incoming attack.
tags: [abs, tag, on-chance, evade, counter]
---

# On Evade Execute

## Description

When this battler evades an incoming attack, they may fire a skill.
The attacker is used as the seed target; the skill's own scope determines actual targeting (an AoE or self-targeting
skill ignores the seed target).

Use this for counter-attacks, gap-closers, or any skill that should trigger automatically when the battler successfully
evades.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills

## TAG FORMAT

`<onEvadeExecute:[SKILL_ID, CHANCE]>`
Where SKILL_ID is the id of the skill to execute on evasion.
Where CHANCE is the integer percent chance to execute it (0-100).

## TAG EXAMPLES

`<onEvadeExecute:[40, 30]>`
Executes the skill of id 40 on evasion, at a 30 percent chance to execute it.