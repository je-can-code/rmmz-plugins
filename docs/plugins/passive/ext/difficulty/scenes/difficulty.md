---
type: scene
title: Difficulty Scene
description: The scene for turning difficulty layers on and off, spending layer points to enable them.
tags: [passive-difficulty, scene, menu]
---

# Scene_Difficulty

The `Scene_Difficulty` is the scene to turn difficulty layers on and off, where the player spends layer points to enable
a layer and gets them back by disabling it. The points start at the [Starting Points](../parameters/initial-points.md)
parameter, and the [Modify Layer Max](../commands/modify-layer-max.md) plugin command changes the most there can be.

## How to call the scene

The scene can be opened in any of these ways:

- With the [Call Difficulty Menu](../commands/call-difficulty-menu.md) plugin command.
- From the dev console or a script call, with:

```js
Scene_Difficulty.callScene()
```