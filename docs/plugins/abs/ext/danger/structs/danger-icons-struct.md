---
type: plugin-struct
title: Danger Icons Struct
description: The fields of the Danger Icons Struct, which MZ edits together as one value.
tags: [abs-danger, struct]
struct:
  key: DangerIconsStruct
  params:
    - key: Worthless
      type: number
      text: Extremely Easy <7
      desc: When an enemy is more 7+ levels below the player, display this icon.
      default: 591
    - key: Simple
      type: number
      text: Very Easy <5-6
      desc: When an enemy is more 5-6 levels below the player, display this icon.
      default: 583
    - key: Easy
      type: number
      text: Easy <3-4
      desc: When an enemy is more 3-4 levels below the player, display this icon.
      default: 581
    - key: Average
      type: number
      text: Normal +/- 2
      desc: When the player and enemy are within 0-2 levels of eachother, display this icon.
      default: 579
    - key: Hard
      type: number
      text: Hard >3-4
      desc: When an player is more 3-4 levels below the enemy, display this icon.
      default: 578
    - key: Grueling
      type: number
      text: Very Hard >5-6
      desc: When an player is more 5-6 levels below the enemy, display this icon.
      default: 577
    - key: Deadly
      type: number
      text: Extremely Hard >7+
      desc: When an player is more 7+ levels below the enemy, display this icon.
      default: 588
---

# Struct: `DangerIconsStruct`

A set of fields MZ edits together. A parameter or argument uses it by naming its type `struct<DangerIconsStruct>`.