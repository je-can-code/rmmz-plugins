---
type: scene
title: Monsterpedia Scene
description: The scene for perusing the monsters the player has perceived and what has been learned of each.
tags: [omni-monster, scene, menu]
---

# Scene_Monsterpedia

The `Scene_Monsterpedia` is the scene for perusing the monsters the player has perceived. The left column lists every
monster that can be observed, and the right side details whichever one is highlighted. There is nothing to confirm here,
only to read, and cancelling leaves the scene.

## How to call the scene

The scene can be opened in any of these ways:

- From the [Omnipedia](../../../core/scenes/omnipedia.md), with the command named "Monsterpedia". The command only
  appears while the game switch with id 103 is ON. Its name and that switch id are fixed rather than parameters, as this
  plugin has none.
- From the dev console or a script call, with:

```js
Scene_Monsterpedia.callScene()
```