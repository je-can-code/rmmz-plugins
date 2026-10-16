---
type: plugin-command
title: Lock Panel(s) Plugin Command
description: Locks a SDP by its key. Locked panels do not appear in the list nor affect the player's parameters.
tags: [sdp, command]
command:
  key: Lock SDP
  text: Lock Panel(s)
  desc: Locks a SDP by its key. Locked panels do not appear in the list nor affect the player's parameters.
  args:
    - key: keys
      type: string[]
      desc: The unique keys for the SDPs that will be locked.
---

# `Lock SDP`

Locks a SDP by its key. Locked panels do not appear in the list nor affect the player's parameters.