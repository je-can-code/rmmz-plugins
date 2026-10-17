---
type: scene
title: Omnipedia Scene
description: The scene listing every pedia the omnipedia extensions add, for the player to pick one to browse.
tags: [omni, scene, menu]
---

# Scene_Omnipedia

The `Scene_Omnipedia` is the root of the Omnipedia: a list of the pedias that the omnipedia extensions have added, under
a header reading "The Omnipedia". Choosing a pedia is handled by the extension that added it, and cancelling leaves the
scene.

This plugin adds no pedia of its own, so the list stays empty until an extension adds its entry.

## How to call the scene

The scene can be opened in any of these ways:

- From the main menu, with the command named "The Omnipedia". The command only appears while the game switch with id
  102 is ON. Its name and that switch id are fixed rather than parameters, as this plugin has none.
- With the `$gameSystem.callOmnipediaScene()` script call.
- From the dev console or a script call, with:

```js
Scene_Omnipedia.callScene()
```