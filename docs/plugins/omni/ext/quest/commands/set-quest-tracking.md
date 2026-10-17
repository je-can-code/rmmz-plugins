---
type: plugin-command
title: Set Quest Tracking Plugin Command
description: Sets whether or not a given quest is tracked.
tags: [omni-quest, command]
command:
  key: set-quest-tracking
  text: Set Quest Tracking
  desc: Sets whether or not a given quest is tracked.
  args:
    - key: key
      type: string
      desc: The unique key for the quest to progress.
    - key: trackingState
      type: boolean
      desc: True if the quest should be tracked, false otherwise.
      on: Start Tracking Quest
      off: Stop Tracking Quest
      default: true
---

# `set-quest-tracking`

Sets whether or not a given quest is tracked.