---
type: plugin-command
title: Unlock Categories Plugin Command
description: Unlocks all crafting categories matching the provided keys.
tags: [jafting-create, command]
command:
  key: unlock-categories
  text: Unlock Categories
  desc: Unlocks all crafting categories matching the provided keys.
  args:
    - key: categoryKeys
      type: string[]
      text: Category Keys
      desc: All the keys of the categories to be unlocked.
      default: '[]'
---

# `unlock-categories`

Unlocks all crafting categories matching the provided keys.