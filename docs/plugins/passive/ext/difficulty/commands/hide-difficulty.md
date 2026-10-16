---
type: plugin-command
title: Hide Difficulty Plugin Command
description: Hides a difficulty, preventing it from being added to the list in the difficulty menu.
tags: [passive-difficulty, command]
command:
  key: hideDifficulty
  text: Hide Difficulty
  desc: Hides a difficulty, preventing it from being added to the list in the difficulty menu.
  args:
    - key: keys
      type: string[]
      desc: The unique keys for the difficulties that will be hidden.
---

# `hideDifficulty`

Hides a difficulty, preventing it from being added to the list in the difficulty menu.