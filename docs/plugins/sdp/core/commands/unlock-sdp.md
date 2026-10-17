---
type: plugin-command
title: Unlock Panel(s) Plugin Command
description: Unlocks a new panel for the player to level up by its key. Key must exist in the SDPs list above.
tags: [sdp, command]
command:
  key: Unlock SDP
  text: Unlock Panel(s)
  desc: Unlocks a new panel for the player to level up by its key. Key must exist in the SDPs list above.
  args:
    - key: keys
      type: string[]
      desc: The unique keys for the SDPs that will be unlocked.
---

# `Unlock SDP`

Unlocks a new panel for the player to level up by its key. Key must exist in the SDPs list above.