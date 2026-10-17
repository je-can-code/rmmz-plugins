---
type: plugin-command
title: Lock Categories Plugin Command
description: Locks all crafting categories matching the provided keys.
tags: [jafting-create, command]
command:
  key: lock-categories
  text: Lock Categories
  desc: Locks all crafting categories matching the provided keys.
  args:
    - key: categoryKeys
      type: string[]
      text: Category Keys
      desc: All of the keys of the categories to be locked.
      default: '[]'
---

# `lock-categories`

Locks all crafting categories matching the provided keys.