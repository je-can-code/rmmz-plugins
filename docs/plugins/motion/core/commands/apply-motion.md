---
type: plugin-command
title: Apply Motion Plugin Command
description: Applies a motion to a character, optionally for a limited time.
tags: [motion, command]
command:
  key: applyMotion
  text: Apply Motion
  desc: Applies a motion to a character, optionally for a limited time.
  args:
    - key: target
      type: select
      options:
        - option: Player
        - option: Follower
        - option: Event
        - option: This Event
      text: Target
      desc: Which character the motion is applied to.
      default: This Event
    - key: targetId
      type: number
      min: 1
      text: Target ID
      desc: The follower's party slot or the event's id. Ignored for the player and this event.
      default: 1
    - key: motion
      type: string
      text: Motion
      desc: 'The motion and its parameters, written as they would be inside a tag. Ex: breathe, 0.08, 90'
      default: breathe
    - key: sourceKey
      type: string
      text: Source
      desc: Who owns this motion. Removing a source only removes what that source applied.
      default: command
    - key: duration
      type: number
      min: 0
      text: Duration
      desc: How many frames the motion lasts before it removes itself. 0 lasts until removed.
      default: 0
---

# `applyMotion`

Applies a motion to a character, optionally for a limited time.