---
type: plugin-command
title: Toggle MiniMap Plugin Command
description: Toggles visibility of the minimap to the designated state.
tags: [map, command]
command:
  key: toggle-minimap
  text: Toggle MiniMap
  desc: Toggles visibility of the minimap to the designated state.
  args:
    - key: action
      type: boolean
      desc: True for visible, false for invisible.
      default: true
---

# `toggle-minimap`

Toggles visibility of the minimap to the designated state.