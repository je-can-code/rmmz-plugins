---
type: scene
title: Questopedia Scene
description: The scene for browsing the quests of the game by category, and choosing which of them to track on the map.
tags: [omni-quest, scene, menu]
---

# Scene_Questopedia

The `Scene_Questopedia` is the scene for browsing the quests of the game, one category at a time. A column down the left
lists the quests of the category being browsed beneath a strip naming it, with a quest the player has not discovered yet
showing its name masked. The highlighted quest's description fills the top right, with the objectives the player knows
about beneath it. The L2 and R2 triggers walk through the categories, confirming a quest toggles whether it is tracked
on the map, and cancelling leaves the scene.

## How to call the scene

The scene can be opened in any of these ways:

- From the [Omnipedia](../../../core/scenes/omnipedia.md), with the "Questopedia" entry in its list. The entry only
  appears while the game switch with id 104 is ON. That switch id is fixed in the plugin; the
  [Menu Switch ID](../parameters/menu-switch.md) parameter does not change it.
- On the map, with the "Open Quest Log" shortcut, when `J-ABS` and `J-ABS-InputManager` are installed. It defaults to
  the D-pad Right and can be rebound under "Quest Actions" in the
  [remap scene](../../../../abs/ext/input/scenes/jabs-remap.md). It does nothing while a message is showing or the
  player is transferring, and unlike the Omnipedia entry it does not look at the switch above.
- From the dev console or a script call, with:

```js
Scene_Questopedia.callScene()
```