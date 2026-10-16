---
type: plugin-command
title: Set Time Plugin Command
description: Sets the time to a fixed time; only applicable to artificial time.
tags: [time, command]
command:
  key: setTime
  text: Set Time
  desc: Sets the time to a fixed time; only applicable to artificial time.
  args:
    - key: Second
      type: number
      max: 59
    - key: Minute
      type: number
      max: 59
    - key: Hour
      type: number
      max: 12
    - key: Day
      type: number
      min: 1
      max: 30
    - key: Month
      type: number
      min: 1
      max: 12
      default: 1
    - key: Year
      type: number
      default: 2021
---

# `setTime`

Sets the time to a fixed time; only applicable to artificial time.