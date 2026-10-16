---
type: scene
title: Statistopedia Scene
description: The scene reporting how this save has actually been played, one section of statistics at a time.
tags: [omni-stats, scene, menu]
---

# Scene_Statistopedia

The `Scene_Statistopedia` is the scene reporting how this save has actually been played. A strip names the section being
read, and a panel of rows beneath it lists that section's statistics. There is nothing in it to confirm or change. Its
controls are described in the [overview](../overview.md#controls).

## How to call the scene

The scene can be opened in any of these ways:

- From the [Omnipedia](../../../core/scenes/omnipedia.md), with the command named "Statistopedia". The command only
  appears while the game switch with id 111 is ON. Its name and that switch id are fixed rather than parameters, as this
  plugin has none.
- From the dev console or a script call, with:

```js
Scene_Statistopedia.callScene()
```