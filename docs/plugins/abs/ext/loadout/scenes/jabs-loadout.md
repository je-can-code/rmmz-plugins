---
type: scene
title: Loadout Scene
description: The scene for reviewing and changing what each party member has bound to each combat input.
tags: [abs-loadout, scene, menu]
---

# Scene_JabsLoadout

The `Scene_JabsLoadout` is the scene showing every party member's assignable combat slots at once, where the player
changes any of them.

## How to call the scene

The scene can be opened in any of these ways:

- From the main menu, with the command named by the [Command Name](../parameters/command-name.md) parameter and
  carrying the icon set in the [Command Icon](../parameters/command-icon.md) parameter. The command only appears while
  the switch chosen in the [Menu Switch ID](../parameters/menu-switch.md) parameter is ON, or always when that parameter
  is 0, and is always selectable. With `J-CMS` installed, it sits in the menu's actor column.
- From the dev console or a script call, with:

```js
Scene_JabsLoadout.callScene()
```