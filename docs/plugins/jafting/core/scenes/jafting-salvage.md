---
type: scene
title: Salvage Scene
description: The scene for dismantling stamped items and gear back into the ingredients they were built from.
tags: [jafting, scene, menu]
---

# Scene_JaftingSalvage

The `Scene_JaftingSalvage` is the scene where the player dismantles stamped items and gear: a list of the party's
inventory entries that carry a record of the ingredients they were made from, a preview of the refund for the
highlighted entry, and a confirmation before one copy is destroyed.

Nothing is stamped by this plugin on its own. The Creation extension stamps what it crafts and the Refinement extension
stamps what it refines, so with neither installed the list is always empty.

## How to call the scene

The scene can be opened in any of these ways:

- From the [JAFTING scene](jafting.md), with the row named by the
  [Salvage hub command name](../parameters/salvage-menu-name.md) parameter and carrying the icon set in the
  [Salvage hub command icon](../parameters/salvage-menu-icon.md) parameter. The row is always listed, but can only be
  selected while the switch chosen in the [Salvage hub switch id](../parameters/salvage-menu-switch.md) parameter is ON,
  or always when that parameter is 0.
- With the [Call Salvage Scene](../commands/call-salvage.md) plugin command, which ignores that switch.
- From the dev console or a script call, with:

```js
Scene_JaftingSalvage.callScene()
```