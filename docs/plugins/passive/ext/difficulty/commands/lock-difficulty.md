---
type: plugin-command
title: Lock Difficulty Plugin Command
description: Locks a difficulty, making it unchoosable in the difficulty menu.
tags: [passive-difficulty, command]
command:
  key: lockDifficulty
  text: Lock Difficulty
  desc: Locks a difficulty, making it unchoosable in the difficulty menu.
  args:
    - key: keys
      type: string[]
      desc: The unique keys for the difficulties that will be locked.
---

# `lockDifficulty`

Locks a difficulty, making it unchoosable in the difficulty menu.