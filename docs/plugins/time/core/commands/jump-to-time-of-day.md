---
type: plugin-command
title: Jump to Time of Day Plugin Command
description: Jump to the next instance of a chosen time of day (e.g., morning).
tags: [time, command]
command:
  key: jumpToTimeOfDay
  text: Jump to Time of Day
  desc: Jump to the next instance of a chosen time of day (e.g., morning).
  args:
    - key: TimeOfDay
      type: select
      options:
        - option: Moontide (00:00am aka midnight)
          value: 0
        - option: Dawn (04:00am)
          value: 1
        - option: Morning (08:00am)
          value: 2
        - option: Afternoon (12:00pm aka noon)
          value: 3
        - option: Evening (16:00pm)
          value: 4
        - option: Night (20:00pm)
          value: 5
      desc: |-
        Use the dropdown to select a time of day to jump to.
        This will jump to the next day rather than rewind.
---

# `jumpToTimeOfDay`

Jump to the next instance of a chosen time of day (e.g., morning).