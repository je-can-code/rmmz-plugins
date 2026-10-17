---
type: plugin-command
title: Spawn Loot Plugin Command
description: Dynamically spawn some loot onto the map from the database. If multiple loot ids are defined, then multiple will be dropped.
tags: [abs, command]
command:
  key: Spawn Loot
  text: Spawn Loot
  desc: |-
    Dynamically spawn some loot onto the map from the database.
    If multiple loot ids are defined, then multiple will be dropped.
  args:
    - key: x
      type: number
      desc: The x coordinate of where on the current map to spawn the loot.
      default: 1
    - key: y
      type: number
      desc: The y coordinate of where on the current map to spawn the loot.
      default: 1
    - key: lootItemIds
      type: item[]
      desc: The items to be dropped as loot.
      default: '[]'
    - key: lootWeaponIds
      type: weapon[]
      desc: The weapons to be dropped as loot.
      default: '[]'
    - key: lootArmorIds
      type: armor[]
      desc: The armors to be dropped as loot.
      default: '[]'
    - key: spawnAnimationId
      type: animation
      desc: |-
        The animation to execute upon the newly spawned enemy.
        By default, no animation will play.
      default: 0
---

# `Spawn Loot`

Dynamically spawn some loot onto the map from the database. If multiple loot ids are defined, then multiple will be
dropped.