---
type: plugin-command
title: Apply global cooldown to actor Plugin Command
description: Sets the battler-wide GCD timer on a party actor that is on the map (leader or visible follower).
tags: [abs, command]
command:
  key: Apply Global Cooldown
  text: Apply global cooldown to actor
  desc: Sets the battler-wide GCD timer on a party actor that is on the map (leader or visible follower).
  args:
    - key: actorId
      type: actor
      text: Actor
      desc: Actor receiving the GCD. Must be the leader or a visible follower on the current map.
      default: 1
    - key: frames
      type: number
      min: 0
      text: Frames
      desc: GCD duration in frames. Use 0 to clear the global cooldown slot.
      default: 30
---

# `Apply Global Cooldown`

Sets the battler-wide GCD timer on a party actor that is on the map (leader or visible follower).