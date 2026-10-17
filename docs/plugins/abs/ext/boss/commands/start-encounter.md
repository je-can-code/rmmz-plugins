---
type: plugin-command
title: Start Boss Encounter Plugin Command
description: Begins a boss fight. Use this when the scene in front of the fight ends.
tags: [abs-boss, command]
command:
  key: start-encounter
  text: Start Boss Encounter
  desc: Begins a boss fight. Use this when the scene in front of the fight ends.
  args:
    - key: encounterKey
      type: string
      text: Encounter
      desc: The name of the encounter to begin, as written in the configuration.
---

# `start-encounter`

Begins a boss fight. Use this when the scene in front of the fight ends.