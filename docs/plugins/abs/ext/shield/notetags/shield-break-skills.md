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
- States (passive states included)

## TAG FORMAT

`<shieldBreak:[SKILL_IDS...]>`
Where SKILL_IDS... is a comma-delimited array of numbers that represent the ids of the skills that will be executed
when any shield breaks.

## TAG EXAMPLES

`<shieldBreak:[1,2,3]>` (on the shield state applied to the battler)
This actor will execute skill 1, 2, and 3 when their shield breaks.

`<shieldBreak:[1,2,3]>` (on the battler)
`<shieldBreak:[1,4]>` (on the shield state applied to the battler)
This battler will execute skills 1, 2, 3, 1 again, and 4 when their shield breaks. Every source fires its own list, so
a skill named by two sources fires twice.

`<shieldBreak:[5]>` (on a ring, with the actor wearing two of them)
This actor will execute skill 5 twice when their shield breaks- one blast per ring.

## FORMULA CONTEXT

A shield break skill's damage formula can read `s`, the original cap of the shield whose break fired it. The cap is
carried on the skill's own action, so it is still there when the hit lands, however many frames after the break that
is. Any action a shield break did not fire reads `s` as 0.

`s * 0.5` (in the shield break skill's damage formula)
The break skill deals damage equal to half the cap of the shield that broke.