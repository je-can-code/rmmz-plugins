---
type: plugin-command
title: Remove Motion Plugin Command
description: Withdraws whatever a source had applied to a character.
tags: [motion, command]
command:
  key: removeMotion
  text: Remove Motion
  desc: Withdraws whatever a source had applied to a character.
  args:
    - key: target
      type: select
      options:
        - option: Player
        - option: Follower
        - option: Event
        - option: This Event
      text: Target
      desc: Which character to stop moving.
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
      desc: Who is withdrawing. Only motions applied under this same source are removed.
      default: command
---

# `removeMotion`

Withdraws whatever a source had applied to a character.