---
type: plugin-struct
title: Elemental Icon Struct
description: The fields of the Elemental Icon Struct, which MZ edits together as one value.
tags: [abs, struct]
struct:
  key: ElementalIconStruct
  params:
    - key: elementId
      type: number
      desc: The id of the element to match an icon to.
      default: 0
    - key: iconIndex
      type: number
      desc: The index of the icon for this element.
      default: 64
---

# Struct: `ElementalIconStruct`

A set of fields MZ edits together. A parameter or argument uses it by naming its type `struct<ElementalIconStruct>`.