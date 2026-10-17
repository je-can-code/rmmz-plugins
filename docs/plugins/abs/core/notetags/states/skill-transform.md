---
type: notetag
title: Skill Transform
description: The tag transforming one equipped skill into another at runtime.
tags: [abs, tag, skill, transform]
---

# Skill Transform

## Description

Transforms one equipped skill into another at runtime without mutating the slot's stored id. The slot's base skill id is
compared against BASE; when they match, OVERRIDE is used for all execution and display purposes instead.

This applies to ALL equipped skill slots (combat, dodge, offhand). The tool and usable-item slots are excluded because
they store item ids rather than skill ids; use [Slot Transform](slot-transform.md) to reach those.

## NOTE ABOUT PERMISSION

The battler does not need to have formally learned OVERRIDE. The transform tag itself grants implicit permission; only
the BASE slot skill must be known via the normal `hasSkill` check.

## NOTE ABOUT PRECEDENCE

First match wins:

1. Active states, ordered by highest priority first.
2. Equipped items (actors only), in equip-slot order.
3. Current class (actors only).
4. Actor or enemy database row.

If multiple sources define a transform for the same BASE, the source highest in the precedence list wins. States always
beat equips.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies

## TAG FORMAT

`<skillTransform:[BASE, OVERRIDE]>`
Where BASE is the equipped skill id to match against.
Where OVERRIDE is the skill id that executes and displays instead.

## TAG EXAMPLES

`<skillTransform:[151, 152]>`
While this note is active on any source, any slot whose base skill id is 151 will execute and display as skill 152
instead.