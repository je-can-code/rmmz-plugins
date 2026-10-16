---
type: plugin-command
title: Force Respawn Plugin Command
description: Frees every defeated battler in the world from its respawn timer at once, regardless of the method each was scheduled with. Use this for the beats that move the world on, such as sleeping at an inn.
tags: [abs, command]
command:
  key: forceRespawn
  text: Force Respawn
  desc: |-
    Frees every defeated battler in the world from its respawn timer at once, regardless of the method each was scheduled with.
    Use this for the beats that move the world on, such as sleeping at an inn.
  args:
    - key: includePermanent
      type: boolean
      desc: Whether placements tagged <noRespawn> are also forced back. Story-critical defeats usually should stay defeated.
      on: Revive Permanent, Too
      off: Leave Permanent Dead
      default: false
---

# `forceRespawn`

Frees every defeated battler in the world from its respawn timer at once, regardless of the method each was scheduled
with. Use this for the beats that move the world on, such as sleeping at an inn.