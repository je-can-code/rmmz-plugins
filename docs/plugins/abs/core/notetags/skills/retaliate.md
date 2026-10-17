---
type: notetag
title: Retaliate
description: The tag defining a skill a battler has a chance to fire in immediate retaliation when struck.
tags: [abs, tag, on-chance, retaliate, counter]
---

# Retaliate

## Description

These tags define skills that can fire under special circumstances.
Each tag takes the form `[SKILL_ID, CHANCE]`, where CHANCE is an integer percent (0-100).

When this battler is struck, they have a chance to fire a skill in immediate retaliation.

Inside the payload skill's damage formula, three extra variables are available:

```text
d  — the HP damage dealt by the hit that triggered this retaliation
m  — the MP damage dealt by the triggering hit
t  — the TP damage dealt by the triggering hit
```

All three default to 0 in non-retaliation formulas, so referencing them is safe on any skill.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Skills

## TAG FORMAT

`<retaliate:[SKILL_ID, CHANCE]>`
`<retaliate:[SKILL_ID, CHANCE, TYPE]>`
Where SKILL_ID is the skill to fire.
Where CHANCE is the integer percent chance to fire it (0-100).
Where TYPE is an optional hit type filter: physical, magical, or certain.
When TYPE is omitted the skill fires regardless of the incoming hit type.
When TYPE is set the skill only fires if the incoming hit matches that type.

## TAG EXAMPLES

`<retaliate:[THORNS_SKILL_ID, 100, physical]>`
Thorns authoring example — reflect 30% of physical HP damage back.
Payload skill formula: `d * 0.3`
Payload skill: `<unparryable>`