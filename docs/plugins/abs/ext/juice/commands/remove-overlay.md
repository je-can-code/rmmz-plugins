---
type: plugin-command
title: Remove Overlay Plugin Command
description: Takes down whatever a source was holding up on a character.
tags: [abs-juice, command]
command:
  key: removeOverlay
  text: Remove Overlay
  desc: Takes down whatever a source was holding up on a character.
  args:
    - key: target
      type: select
      options:
        - option: Player
        - option: Follower
        - option: Event
        - option: This Event
      text: Target
      desc: Which character to take the icon from.
      default: This Event
    - key: targetId
      type: number
      min: 1
      text: Target ID
      desc: The follower's party slot or the event's id. Ignored for the player and this event.
      default: 1
    - key: sourceKey
      type: string
      text: Source
      desc: Who is withdrawing. Only overlays applied under this same source are removed.
      default: command
---

# `removeOverlay`

Takes down whatever a source was holding up on a character.