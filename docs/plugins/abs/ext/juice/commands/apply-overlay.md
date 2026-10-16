---
type: plugin-command
title: Apply Overlay Plugin Command
description: Shows an icon over a character in one of the overlay presets.
tags: [abs-juice, command]
command:
  key: applyOverlay
  text: Apply Overlay
  desc: Shows an icon over a character in one of the overlay presets.
  args:
    - key: target
      type: select
      options:
        - option: Player
        - option: Follower
        - option: Event
        - option: This Event
      text: Target
      desc: Which character shows the icon.
      default: This Event
    - key: targetId
      type: number
      min: 1
      text: Target ID
      desc: The follower's party slot or the event's id. Ignored for the player and this event.
      default: 1
    - key: iconSource
      type: select
      options:
        - option: Item
        - option: Weapon
        - option: Armor
        - option: Skill
        - option: Icon Index
      text: Icon Source
      desc: Where the icon comes from. Naming a database row survives that row's icon being changed later.
      default: Item
    - key: iconId
      type: number
      min: 0
      text: Icon ID
      desc: The database id of the row, or the IconSet cell index when the source is Icon Index.
      default: 1
    - key: motion
      type: select
      options:
        - option: present
        - option: arc
        - option: arc-reverse
        - option: arc-oscillate
        - option: spin
        - option: spin-reverse
        - option: stab-forward
        - option: bash
        - option: recoil
      text: Motion
      desc: Which preset to pose the icon in. `present` lifts it straight up over the head.
      default: present
    - key: duration
      type: number
      min: 1
      text: Duration
      desc: How many frames the motion takes. When held, this is how long reaching the pose takes.
      default: 20
    - key: repeats
      type: number
      min: 1
      max: 8
      text: Repeats
      desc: How many times the motion repeats within the duration. Rotations, for the spin presets.
      default: 1
    - key: spanDegrees
      type: number
      min: 30
      max: 300
      text: Arc Span
      desc: How wide the arc sweeps, in degrees. Only the arc presets read this.
      default: 120
    - key: hold
      type: boolean
      text: Hold
      desc: Park at the final pose and stay there until Remove Overlay withdraws it.
      default: false
    - key: sourceKey
      type: string
      text: Source
      desc: Who owns this overlay. Removing a source only removes what that source applied.
      default: command
---

# `applyOverlay`

Shows an icon over a character in one of the overlay presets.