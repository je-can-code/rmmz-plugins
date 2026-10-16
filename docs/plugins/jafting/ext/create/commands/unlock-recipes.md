---
type: plugin-command
title: Unlock Recipes Plugin Command
description: Unlocks all crafting recipes matching the provided keys.
tags: [jafting-create, command]
command:
  key: unlock-recipes
  text: Unlock Recipes
  desc: Unlocks all crafting recipes matching the provided keys.
  args:
    - key: recipeKeys
      type: string[]
      text: Recipe Keys
      desc: All the keys of the recipes to be unlocked.
      default: '[]'
---

# `unlock-recipes`

Unlocks all crafting recipes matching the provided keys.