---
type: notetag
title: Assigning the Offhand (Player Pin)
description: The tag opting a skill into the list players can pin into the offhand slot.
tags: [abs, tag, skill, slot, offhand]
---

# Assigning the Offhand (Player Pin)

## Description

Players may pin a learned skill into the offhand slot via the JABS quick menu. The pin survives until the player either
clears it or changes the offhand equipment, at which point the pin is automatically cleared so that the newly equipped
offhand's skill takes priority.

Skills available in the offhand assignment list are:

- Learned skills carrying the `<offhandEligible>` tag.
- The skill currently granted by the equipped offhand item.
- The skill currently granted by the mainhand's `<offhandSkillId:N>`.

Generic learned weapon skills are NOT automatically eligible.

Place this tag on any skill to opt it into the offhand assignment list regardless of skill type. This is intended for
specially learned support, utility, or offensive skills that should be equippable as player-chosen offhand actions.

## TAG USAGE

- Skills

## TAG FORMAT

`<offhandEligible>`

## TAG EXAMPLES

`<offhandEligible>`
This skill is opted into the offhand assignment list regardless of skill type.