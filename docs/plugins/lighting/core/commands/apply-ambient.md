---
type: plugin-command
title: Apply Darkness Plugin Command
description: Darkens the scene until removed. Compounds with the map's own darkness rather than replacing it.
tags: [lighting, command]
command:
  key: applyAmbient
  text: Apply Darkness
  desc: Darkens the scene until removed. Compounds with the map's own darkness rather than replacing it.
  args:
    - key: darkness
      type: number
      min: 0
      max: 100
      text: Darkness
      desc: How much light to take away, from 0 to 100.
      default: 50
    - key: color
      type: string
      text: Color
      desc: 'A hex colour for the dark itself, ex: #0a2a2a. Leave blank for ordinary black.'
      default: ''
---

# `applyAmbient`

Darkens the scene until removed. Compounds with the map's own darkness rather than replacing it.