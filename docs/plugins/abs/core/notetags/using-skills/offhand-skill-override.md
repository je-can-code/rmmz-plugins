---
type: notetag
title: Offhand Skill Override
description: The tag defining a different skill a weapon grants to the offhand slot than to the mainhand slot.
tags: [abs, tag, weapon, slot, offhand]
---

# Offhand Skill Override

## Description

In some cases, you may want a weapon to specify a different skill for the offhand slot than the mainhand slot. This is
useful for two-handed weapons that also define their own offhand behavior.

## TAG USAGE

- Weapons

## TAG FORMAT

`<offhandSkillId:SKILL_ID>`
Where SKILL_ID is the skill to assign specifically to the offhand.

## TAG EXAMPLES

`<offhandSkillId:13>`
This weapon assigns skill 13 specifically to the offhand.