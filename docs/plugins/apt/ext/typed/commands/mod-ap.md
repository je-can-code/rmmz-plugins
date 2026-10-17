---
type: plugin-command
title: Add/Remove Typed AP Plugin Command
description: Adds or removes a designated amount of typed AP from an actor by its id.
tags: [apt-typed, command]
command:
  key: mod-ap
  text: Add/Remove Typed AP
  desc: Adds or removes a designated amount of typed AP from an actor by its id.
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
    - key: domain
      type: select
      options:
        - option: element
        - option: weapontype
        - option: skilltype
      desc: The family of AP typing to consider for the actor.
      default: element
    - key: id
      type: number
      min: 1
      max: 9999
      desc: The id of the element, weapon type, or skill type to consider for the actor.
      default: 1
---

# `mod-ap`

Adds or removes a designated amount of typed AP from an actor by its id.