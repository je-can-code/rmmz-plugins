---
type: scene
title: Passives Scene
description: The scene for reviewing the passive states applied to each party member.
tags: [passive, scene, menu]
---

# Scene_Passive

The `Scene_Passive` is the viewer scene for the passive states applied to an actor: a state list, beside a detail window
describing whichever state is highlighted.

## How to call the scene

The scene can be opened in any of these ways:

- From the main menu, with the command named by the [Menu Name](../parameters/menu-command-name.md) parameter and shown
  with the icon from the [Menu Icon](../parameters/menu-command-icon.md) parameter. The command only appears while the
  switch chosen in the [Menu Switch ID](../parameters/menu-switch.md) parameter is ON.
- From the dev console or a script call, with:

```js
Scene_Passive.callScene()
```