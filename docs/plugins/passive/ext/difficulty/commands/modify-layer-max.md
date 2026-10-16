---
type: plugin-command
title: Modify Layer Max Plugin Command
description: Modifies the maximum difficulty layer points by the given amount.
tags: [passive-difficulty, command]
command:
  key: modifyLayerMax
  text: Modify Layer Max
  desc: Modifies the maximum difficulty layer points by the given amount.
  args:
    - key: amount
      type: number
      min: -999999
      max: 999999
      desc: The amount to modify the max layer points by. This can be negative.
---

# `modifyLayerMax`

Modifies the maximum difficulty layer points by the given amount.