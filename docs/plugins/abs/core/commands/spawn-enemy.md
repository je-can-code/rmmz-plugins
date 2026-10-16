---
type: plugin-command
title: Spawn Enemy Plugin Command
description: Dynamically spawn an enemy onto the map from the enemy clone map.
tags: [abs, command]
command:
  key: Spawn Enemy
  text: Spawn Enemy
  desc: Dynamically spawn an enemy onto the map from the enemy clone map.
  args:
    - key: x
      type: number
      desc: The x coordinate of where on the current map to spawn the enemy.
      default: 1
    - key: y
      type: number
      desc: The y coordinate of where on the current map to spawn the enemy.
      default: 1
    - key: enemyEventId
      type: number
      desc: The id of the event from the enemy clone map to spawn onto this map.
      default: 1
    - key: spawnAnimationId
      type: animation
      desc: |-
        The animation to execute upon the newly spawned enemy.
        By default, no animation will play.
      default: 0
---

# `Spawn Enemy`

Dynamically spawn an enemy onto the map from the enemy clone map.