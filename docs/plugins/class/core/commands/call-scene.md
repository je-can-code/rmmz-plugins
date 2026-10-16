---
type: plugin-command
title: Call Scene Plugin Command
description: Opens the class scene for the party, either to change classes or only to review them.
tags: [class, command]
command:
  key: call-scene
  text: Call Scene
  desc: Opens the class scene for the party, either to change classes or only to review them.
  args:
    - key: allowChanging
      type: boolean
      text: Allow Changing
      desc: Whether confirming a class changes the actor into it. When false, the scene only views.
      default: true
---

# `call-scene`

Opens the class scene for the party, either to change classes or only to review them.