---
type: notetag
title: Dodge Slot
description: The skill type setup that makes a skill eligible for the dodge slot.
tags: [abs, tag, skill, slot, dodge]
---

# Dodge Slot

## Description

The dodge slot represents a unique mobility skill. For a skill to be recognized as a "dodge" skill, it must belong to
the skill type defined in the plugin parameters for "dodge skill type".

## NOTE ABOUT ACTION PIPELINE

The dodge skill is still processed through the normal JABS action pipeline, so it can apply states, deal damage, fire
projectiles, etc.

## TAG USAGE

- Skills, through their Skill Type rather than a notetag.

## TAG FORMAT

The skill's Skill Type must be the one set in the `dodgeSkillTypeId` plugin parameter.