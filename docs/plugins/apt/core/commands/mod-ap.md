---
type: plugin-command
title: Modify AP Plugin Command
description: The command for modifying an actor's AP.
tags: [ap, command]
command:
  key: mod-ap
  text: Add/Remove AP
  desc: Adds or removes a designated amount of AP from an actor by its id.
  args:
    - key: actorId
      type: actor
      desc: The id of the actor to modify AP for.
      default: 1
    - key: points
      type: number
      min: -99999999
      max: 99999999
      desc: The amount of AP to modify by. Negative removes AP. Per-source never goes below 0.
      default: 10
---

# `mod-ap`

The command for modifying the amount of AP an actor has. This can be used for custom rewards through events and such.
AP cannot be reduced below zero per source.
