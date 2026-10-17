---
type: plugin-command
title: Lock Recipes Plugin Command
description: Locks all crafting recipes matching the provided keys.
tags: [jafting-create, command]
command:
  key: lock-recipes
  text: Lock Recipes
  desc: Locks all crafting recipes matching the provided keys.
  args:
    - key: recipeKeys
      type: string[]
      text: Recipe Keys
      desc: All of the keys of the recipes to be locked.
      default: '[]'
---

# `lock-recipes`

Locks all crafting recipes matching the provided keys.