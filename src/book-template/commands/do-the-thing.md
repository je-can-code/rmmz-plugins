---
type: plugin-command
title: Add/Remove Points Plugin Command
description: Adds or removes a designated amount of points from all members of the current party.
tags: [template, command]
command:
  key: do-the-thing
  text: Add/Remove points
  desc: Adds or removes a designated amount of points from all members of the current party.
  args:
    - key: points
      type: number
      min: -99999999
      max: 99999999
      desc: The number of points to modify by. Negative will remove points. Cannot go below 0.
---

# `do-the-thing`

Adds or removes a designated amount of points from all members of the current party.