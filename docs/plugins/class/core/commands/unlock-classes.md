---
type: plugin-command
title: Unlock Classes Plugin Command
description: Unlocks classes for an actor, making them selectable in the class scene. Repeating an unlock does nothing.
tags: [class, command]
command:
  key: unlock-classes
  text: Unlock Classes
  desc: Unlocks classes for an actor, making them selectable in the class scene. Repeating an unlock does nothing.
  args:
    - key: actorId
      type: actor
      text: Actor
      desc: The actor the classes are unlocked for.
      default: 1
    - key: classIds
      type: class[]
      text: Classes
      desc: The classes to unlock.
      default: '[]'
---

# `unlock-classes`

Unlocks classes for an actor, making them selectable in the class scene. Repeating an unlock does nothing.