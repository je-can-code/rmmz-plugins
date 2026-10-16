---
type: plugin-command
title: Add Loot Log Plugin Command
description: Arbitrarily create a log for the log window. Respects text codes.
tags: [log, command]
command:
  key: addLootLog
  text: Add Loot Log
  desc: Arbitrarily create a log for the log window. Respects text codes.
  args:
    - key: lootId
      type: number
      default: 1
    - key: lootType
      type: select
      options:
        - option: Item
          value: item
        - option: Weapon
          value: weapon
        - option: Armor
          value: armor
---

# `addLootLog`

Arbitrarily create a log for the log window. Respects text codes.