---
type: scene
title: JAFTING Scene
description: The root menu that gives access to every JAFTING mode the installed plugins offer.
tags: [jafting, scene, menu]
---

# Scene_Jafting

The `Scene_Jafting` is the root JAFTING menu: a list of the JAFTING modes available, where choosing one opens that
mode's own scene. [Salvage](jafting-salvage.md) is always on the list, and the Creation and Refinement extensions each
add their own row after it.

## How to call the scene

The scene can be opened in any of these ways:

- With the [Call Core Menu](../commands/call-menu.md) plugin command.
- From the dev console or a script call, with:

```js
Scene_Jafting.callScene()
```