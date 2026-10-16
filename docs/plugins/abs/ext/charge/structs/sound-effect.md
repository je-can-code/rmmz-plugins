---
type: plugin-struct
title: Sound Effect Struct
description: The fields of the Sound Effect Struct, which MZ edits together as one value.
tags: [abs-charge, struct]
struct:
  key: soundEffect
  params:
    - key: name
      type: file
      text: Sound Effect Name
      desc: The name of the sound effect file to play.
      default: '""'
    - key: volume
      type: number
      min: 0
      max: 100
      text: Volume
      desc: The volume at which to play the sound effect.
      default: 90
    - key: pitch
      type: number
      min: 50
      max: 150
      text: Pitch
      desc: |-
        The pitch of the sound effect- aka the speed of how the
        sound effect is played. Higher is faster.
      default: 100
    - key: pan
      type: number
      min: -100
      max: 100
      text: Volume
      desc: |-
        The directional pan of the sound effect.
        Negative is played to the left, positive to the right.
      default: 0
---

# Struct: `soundEffect`

A set of fields MZ edits together. A parameter or argument uses it by naming its type `struct<soundEffect>`.