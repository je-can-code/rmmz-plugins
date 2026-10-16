---
type: notetag
title: Unslotted Skills
description: The tag exempting specific skills from the slot requirement for one battler only.
tags: [sks, tag, skill, slot, unslotted, exemption]
---

# Unslotted Skills

## Description

Want a specific actor/class (or any other note source) to treat a normally-slottable skill as perpetually active for
them specifically, without making that skill unslotted for everyone else? By applying the appropriate tag, you can grant
a per-battler exemption from the slot requirement- the skill still costs a slot for any other actor who has to
learn-then-equip it through the normal pipeline.

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- States

## TAG FORMAT

`<unslottedSkills:[SKILL_ID, SKILL_ID, ...]>`
Where each SKILL_ID is exempted from the slot requirement for this battler, regardless of that skill's own
`<unslotted>` tag or type.

## TAG EXAMPLES

`<unslottedSkills:[901,902]>`
This actor/class always has skills 901 and 902 active, without spending a slot on either- e.g. a class with native
weapon access to two weapon types.