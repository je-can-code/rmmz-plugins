---
type: notetag
title: Shield Break Skills
description: The tag defining the skills a battler executes when its shield breaks.
tags: [abs-shield, tag, shield, break, skill, retaliate]
---

# Shield Break Skills

## Description

Have you ever wanted to be able to retaliate with particular skills when your shield breaks? Well now you can! By
applying the appropriate tags on various applicable database objects, you too can customize your shield break
retaliation.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- Enemies
- States

## TAG FORMAT

`<shieldBreak:[SKILL_IDS...]>`
Where SKILL_IDS... is a comma-delimited array of numbers that represent the ids of the skills that will be executed
when any shield breaks.

## TAG EXAMPLES

`<shieldBreak:[1,2,3]>` (on the shield state applied to the battler)
This actor will execute skill 1, 2, and 3 when their shield breaks.

`<shieldBreak:[1,2,3]>` (on the battler)
`<shieldBreak:[1,4]>` (on the shield state applied to the battler)
This battler will execute skills 1 (once), 2, 3, and 4 when their shield breaks- the 1 only triggers once even though
it shows up twice.