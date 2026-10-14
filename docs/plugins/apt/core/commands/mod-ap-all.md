---
type: plugin-command
title: Modify Party's AP Plugin Command
description: The command for modifying the whole party's AP at once.
tags: [ap, command, party]
command:
  key: mod-ap-all
  text: Add/Remove AP (Party)
  desc: Adds or removes a designated amount of AP from all members of the current party.
  args:
    - key: points
      type: number
      min: -99999999
      max: 99999999
      desc: The amount of AP to modify by. Negative removes AP. Per-source never goes below 0.
      default: 10
---

# `mod-ap-all`

The command for modifying the amount of AP every actor in the party has. This can be used for custom rewards through
events and such. AP cannot be reduced below zero per source.
