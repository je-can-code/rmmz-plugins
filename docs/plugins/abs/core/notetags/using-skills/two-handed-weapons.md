---
type: notetag
title: Two-Handed Weapons
description: The native trait that marks a weapon as two-handed by sealing the offhand slot.
tags: [abs, tag, weapon, slot, offhand, trait]
---

# Two-Handed Weapons

## Description

Use RMMZ's native trait instead of a notetag. When that trait is active anywhere on the battler, JABS treats the offhand
as sealed. The seal is bypassed if the mainhand also declares `<offhandSkillId:N>`, which lets a "two-handed but defines
its own offhand action" weapon (such as a spear) keep its offhand action.

## TAG USAGE

- Weapons, as a trait on the two-handed weapon.
- Actors, Classes, Armor or States, since the trait counts anywhere on the battler.

## TAG FORMAT

`Trait -> Seal Equip -> Offhand`