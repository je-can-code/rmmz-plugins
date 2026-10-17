---
type: plugin-command
title: Fast Forward Time Plugin Command
description: Fast-forwards time by a set amount; artificial time only.
tags: [time, command]
command:
  key: fastForwardtime
  text: Fast Forward Time
  desc: Fast-forwards time by a set amount; artificial time only.
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

# `fastForwardtime`

Fast-forwards time by a set amount; artificial time only.