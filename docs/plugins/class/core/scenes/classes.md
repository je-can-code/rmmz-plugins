---
type: scene
title: Classes Scene
description: The scene for reviewing an actor's classes and, where the game allows it, changing between them.
tags: [class, scene, menu]
---

# Scene_Classes

The `Scene_Classes` is the scene where the player reviews an actor's classes and, where the game allows it, changes
between them.

## How to call the scene

The scene can be opened in any of these ways:

- From the main menu, with the command named by the [Command Name](../parameters/command-name.md) parameter and carrying
  the icon set in the [Command Icon](../parameters/command-icon.md) parameter. The command only appears while the switch
  chosen in the [Menu Switch ID](../parameters/menu-switch.md) parameter is ON, or always when that parameter is 0, and
  is always selectable. It sits in the menu's actor column. From here the scene only views, unless the switch chosen in
  the [Menu Change Switch ID](../parameters/menu-change-switch.md) parameter is ON.
- With the [Call Scene](../commands/call-scene.md) plugin command, which says whether changing is allowed.
- From the dev console or a script call, with either of:

```js
Scene_Classes.callScene(true)
Scene_Classes.callScene(false)
```

Where `true` opens the scene with changing allowed, and `false` opens it only to view.