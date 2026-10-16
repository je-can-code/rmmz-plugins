---
type: scene
title: Creation Scene
description: The scene for crafting the recipes the party has unlocked, browsed by category.
tags: [jafting-create, scene, menu]
---

# Scene_JaftingCreate

The `Scene_JaftingCreate` is the crafting scene: the player cycles through an "All" tab and the unlocked categories,
browses the unlocked recipes of each, sees what the highlighted one consumes, requires and makes, and crafts it as many
times as the party's stock allows.

Only an unlocked recipe filed under an unlocked category is listed. An event decides what a crafting station offers by
unlocking the categories it deals in, opening the scene, and locking them again.

## How to call the scene

The scene can be opened in any of these ways:

- From the [JAFTING scene](../../../core/scenes/jafting.md), with the row named by the
  [Menu Name](../parameters/menu-name.md) parameter and carrying the icon set in the
  [Menu Icon](../parameters/menu-icon.md) parameter. The row is always listed, but can only be selected while the switch
  chosen in the [Menu Switch ID](../parameters/menu-switch.md) parameter is ON and at least one unlocked category holds
  an unlocked recipe.
- With the [Call the Creation Menu](../commands/call-menu.md) plugin command, which ignores that switch but still
  refuses, with a buzzer, when no unlocked category holds an unlocked recipe.
- From the dev console or a script call, with:

```js
Scene_JaftingCreate.callScene()
```