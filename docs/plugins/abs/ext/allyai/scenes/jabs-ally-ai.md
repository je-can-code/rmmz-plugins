---
type: scene
title: Ally AI Scene
description: The scene for deciding how the party's allies behave in combat.
tags: [abs-allyai, scene, menu]
---

# Scene_JabsAllyAi

The `Scene_JabsAllyAi` is the scene for deciding how the party's allies behave in combat: each ally's preset and
do-nothing toggle, the party-wide aggro/passive toggle, and the party's formation.

## How to call the scene

The scene can be opened in any of these ways:

- From the main menu, with the command named by the [Menu Text](../parameters/jabs-menu-ally-ai-command-name.md)
  parameter. The command only appears while the switch chosen in the
  [Menu Switch](../parameters/jabs-menu-ally-ai-command-switch-id.md) parameter is ON, and can only be selected while
  followers are being shown.
- From the dev console or a script call, with:

```js
Scene_JabsAllyAi.callScene()
```