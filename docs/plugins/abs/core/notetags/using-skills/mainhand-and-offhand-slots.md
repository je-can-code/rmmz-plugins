---
type: notetag
title: Mainhand and Offhand Slots
description: The tag defining which skill a piece of equipment grants to its mainhand or offhand slot.
tags: [abs, tag, weapon, armor, slot, mainhand, offhand]
---

# Mainhand and Offhand Slots

## Description

The mainhand slot is auto-assigned via the weapon equip slot using its `<skillId:SKILL_ID>` tag. The offhand slot is
resolved each refresh using the following precedence (highest first):

1. Native offhand seal: if the battler has RMMZ's "Seal Equip: Offhand" trait active AND the mainhand does not also
   declare `<offhandSkillId:N>`, the offhand resolves to nothing.
2. Player pin: a skill the player explicitly assigned to the offhand via the JABS quick menu (see
   [Assigning the Offhand](assigning-the-offhand-player-pin.md)).
3. Mainhand-provided offhand skill: `<offhandSkillId:N>` on the currently equipped mainhand weapon.
4. The equipped offhand item's `<skillId:N>` tag.
5. Nothing.

Once the base offhand skill is resolved, it may be further transformed via `<skillTransform:[BASE, OVERRIDE]>` from any
note-bearing source (state, equip, class, or actor) — see [Skill Transform](../states/skill-transform.md).

To designate which skill a piece of equipment grants, use `<skillId:SKILL_ID>`.

## NOTE ABOUT GUARD SKILLS

Only the offhand slot can host a guard skill. Pinning a non-guard skill into the offhand intentionally trades the guard
ability for that skill until the player clears or changes the pin.

## TAG USAGE

- Weapons
- Armor, as the equipped offhand item.

## TAG FORMAT

`<skillId:SKILL_ID>`
Where SKILL_ID is the skill to assign to the equip slot.

## TAG EXAMPLES

`<skillId:12>`
This equipment assigns skill 12 to its equip slot.