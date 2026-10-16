---
type: plugin-command
title: Assign a JABS skill Plugin Command
description: Assigns a specific skill id or (item id) to a designated slot. Assigned skills will be removed if not learned (unless locked).
tags: [abs, command]
command:
  key: Set JABS Skill
  text: Assign a JABS skill
  desc: "\nAssigns a specific skill id or (item id) to a designated slot.\nAssigned skills will be removed if not learned (unless locked)."
  args:
    - key: actorId
      type: actor
      text: Choose Actor
      desc: "\nThe actor to have the skill assigned to.\nPlease don't choose \"none\", that'll cause the game to crash."
      default: 1
    - key: skillId
      type: skill
      text: Choose Skill
      desc: "\nThe skill to be assigned to the actor.\nYou may choose \"none\" if you want to unassign the slot."
      default: 0
    - key: itemId
      type: item
      text: Choose Item
      desc: "\nThe item to be assigned to the actor.\nThis is only for use if assigning to the \"tool\" slot."
      default: 0
    - key: slot
      type: select
      options:
        - option: Tool
        - option: UsableItem
        - option: Dodge
        - option: Offhand
        - option: L1A
        - option: L1B
        - option: L1X
        - option: L1Y
      text: Choose Slot
      desc: The slot to assign the skill to for this actor.
      default: L1A
    - key: locked
      type: boolean
      desc: Locked skills cannot be unequipped until unlocked.
      on: Lock Skill
      off: Don't Lock
      default: false
---

# `Set JABS Skill`

Assigns a specific skill id or (item id) to a designated slot. Assigned skills will be removed if not learned (unless
locked).