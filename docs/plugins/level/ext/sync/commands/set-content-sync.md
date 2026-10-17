---
type: plugin-command
title: Set Content Sync Plugin Command
description: Activates content level sync at the specified level for all party members.
tags: [level-sync, command]
command:
  key: setContentSync
  text: Set Content Sync
  desc: Activates content level sync at the specified level for all party members.
  args:
    - key: level
      type: number
      min: 1
      text: Sync Level
      desc: The level all party actors will fight at (or be capped to).
      default: 50
    - key: uplevel
      type: boolean
      text: Uplevel
      desc: If true, underleveled actors are boosted to the sync level (exact sync). Default false = cap-only.
      default: false
---

# `setContentSync`

Activates content level sync at the specified level for all party members.