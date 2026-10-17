---
type: scene
title: Template Scene
description: The scene this plugin adds, and how to open it.
tags: [template, scene, menu]
---

# Scene_Template

The `Scene_Template` is the scene where the player does the cool stuff this plugin is about.

## How to call the scene

The scene can be opened in any of these ways:

- From the main menu, while the switch chosen in the [Menu Switch ID](../parameters/menu-switch.md) parameter is ON.
- From the dev console or a script call:

```js
Scene_Template.callScene()
```