---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 2.2.0
    base: true
    orderAfter: true
  - key: J-SkillSlots
    base: true
    orderAfter: true
  - key: J-ABS
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-SkillSlots

Supplies the skills an actor has equipped into slots, each skill's `unslotted` exemption (`<unslotted>`, or a skill type
ineligible for slotting), and the unequip hook this plugin answers by clearing the matching JABS button.

## J-ABS

Owns the combat, dodge and offhand candidate pools this plugin narrows, and the JABS skill slots it clears when a skill
is unequipped from SKS.