---
type: notetag
title: Skill Learning
description: The tag holding one of an enemy's skills back until the enemy reaches a given level.
tags: [level, tag, enemy, skill, learning]
---

# Skill Learning

## Description

Have you ever wanted enemies to learn new skills as they "level up"? Well, now you can! By applying the appropriate tag
w/ data points to the enemies, you too can have enemies obtain new skills as they reach ever-higher levels!

## NOTE ABOUT LEVELS AND SKILLS

The actual skill needs to be in the actions list of an enemy in order for it to ever be available. The tag is
basically a "guard" that level-checks before allowing the skill to be included in the skill list when the list of
skills for an enemy is grabbed and mapped.

## NOTE ABOUT COMPATIBILITY

Due to the nature of how this functionality works, this tag probably won't work as-intended outside of JABS. An
extension would need to be drafted that leverages the `Game_Enemy.prototype.skills` function to determine their
available skills instead of the default- which directly parses the actions.

## TAG USAGE

- Enemies only.

## TAG FORMAT

`<learning:[SKILL_ID, LEVEL_LEARNED]>`
Where SKILL_ID is the skill being learned,
Where LEVEL_LEARNED is the level at which the enemy must be before the skill becomes available to them.

## TAG EXAMPLES

`<learning:[210, 10]>`
An enemy with this tag will have skill of ID 210 become "learned" when the enemy is level 10 or higher.