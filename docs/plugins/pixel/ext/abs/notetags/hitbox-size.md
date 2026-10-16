---
type: notetag
title: Hitbox Size
description: The tag giving an enemy battler a rectangular, feet-anchored hitbox of a given width and height in tiles.
tags: [pixel-abs, tag, enemy, event, hitbox]
---

# Hitbox Size

## Description

Enemy battlers now share one rectangular hitbox model across:

- PIXEL movement/body collision
- JABS battler targeting/collision
- JABS battler hitbox overlays

The hitbox is centered horizontally on the event and anchored vertically to the event's feet, meaning the feet are the
bottom-center of the rectangle.

Apply hitbox size in either place:

- enemy note
- event comments on the battler page

If both exist, the event comment wins. If neither exists, the plugin parameter defaults are used.

## TAG USAGE

- Event comments, on the battler page.
- Enemies, as a default for that enemy.

## TAG FORMAT

### Square shorthand

`<hitboxSize:N>`
Where N is both the width and height in tiles.

### Explicit rectangle

`<hitboxSize:[W, H]>`
Where W is width in tiles, H is height in tiles.

## TAG EXAMPLES

`<hitboxSize:1.0>`
A 1.0 x 1.0 tile square hitbox.

`<hitboxSize:[0.8, 0.5]>`
A rectangle 0.8 tiles wide and 0.5 tiles tall.