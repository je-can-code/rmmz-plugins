---
type: notetag
title: Slot Transform
description: The tag redirecting an entire slot to a skill, regardless of what is equipped in it.
tags: [abs, tag, skill, transform, slot]
---

# Slot Transform

## Description

Redirects an entire slot to a skill, regardless of what is equipped in it.

Where a skill transform asks "what is in this slot, and does anything replace it", a slot transform asks only "which
slot is this". That is the whole difference, and it is what lets this reach two cases the other cannot: a slot holding
an ITEM id (`Tool`, `UsableItem`), and a slot holding NOTHING. Neither offers a base skill id to match against.

The slot's stored contents are never read and never written, so the redirect ends the instant its source does — a state
lapsing hands the button straight back to whatever was always sitting in it.

## NOTE ABOUT PERMISSION

As with skill transforms, the tag is its own permission grant. The battler need not have learned SKILL_ID.

## NOTE ABOUT PRECEDENCE

Identical to skill transforms (states by priority > equips > class > database row). A slot transform also beats a skill
transform on the same slot, since naming the slot outright is the more specific statement.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies

## TAG FORMAT

`<slotTransform:[SLOT_KEY, SKILL_ID]>`
Where SLOT_KEY is a `JABS_Button` value: `Main`, `Offhand`, `Tool`, `Dodge`, `UsableItem`, or `CombatSkill1` through
`CombatSkill4`. Matched case-insensitively.
Where SKILL_ID is the skill that executes and displays for that slot.

## TAG EXAMPLES

`<slotTransform:[UsableItem, 512]>`
While this note is active, the R2 usable-item button executes skill 512 rather than consuming whatever item is sitting
in the slot.