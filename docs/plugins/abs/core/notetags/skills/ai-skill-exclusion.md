---
type: notetag
title: AI Skill Exclusion
description: The tag excluding a skill from the pool of skills an AI battler can select.
tags: [abs, tag, skill, ai, combo]
---

# AI Skill Exclusion

## Description

Excludes this skill from the pool of skills an AI battler can select.
Useful for combo-ender skills that should only be reachable through the combo chain, not random selection.

## NOTE ABOUT SKILL EXTENSION SKILLS

If using `J-Extend`, extension skills are automatically excluded from random AI selection, identical to
`<aiSkillExclusion>`.

## TAG USAGE

- Skills

## TAG FORMAT

`<aiSkillExclusion>`

## TAG EXAMPLES

`<aiSkillExclusion>`
Excludes this skill from the pool of skills an AI battler can select.