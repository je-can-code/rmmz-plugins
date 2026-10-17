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
  - key: J-Passive
    base: true
    orderAfter: true
  - key: J-SkillSlots
    version: 1.3.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-Passive

Supplies `getPassiveStateSourcedSkills`, the seam deciding which of an actor's skills count as passive state sources,
which this plugin narrows down.

## J-SkillSlots

Supplies the skills an actor has equipped into slots, each skill's `unslotted` exemption (`<unslotted>`, or a skill
type ineligible for slotting), and the actor's own `<unslottedSkills:[SKILL_ID, SKILL_ID, ...]>` exemptions, which
together decide which skills this plugin keeps.