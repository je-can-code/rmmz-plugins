---
type: plugin-command
title: Rewind Time Plugin Command
description: Rewinds time by a set amount; artificial time only.
tags: [time, command]
command:
  key: rewindTime
  text: Rewind Time
  desc: Rewinds time by a set amount; artificial time only.
  args:
    - key: Second
      type: number
      default: 0
    - key: Minute
      type: number
      default: 0
    - key: Hour
      type: number
      default: 0
    - key: Day
      type: number
      default: 0
    - key: Month
      type: number
      default: 0
    - key: Year
      type: number
      default: 0
---

# `rewindTime`

Rewinds time by a set amount; artificial time only.