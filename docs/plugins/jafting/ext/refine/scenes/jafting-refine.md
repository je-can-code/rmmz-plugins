---
type: scene
title: Refinement Scene
description: The scene for refining equipment, where a material equip is sacrificed to transfer its traits onto a base.
tags: [jafting-refine, scene, menu]
---

# Scene_JaftingRefine

The `Scene_JaftingRefine` is the scene where equipment is refined: a base equip is chosen, then a material equip to
sacrifice onto it, and the refinement is confirmed.

## How to call the scene

The scene can be opened in any of these ways:

- From the [JAFTING](../../../core/scenes/jafting.md) menu, with the command named by the
  [Menu Name](../parameters/menu-name.md) parameter. The command is always listed there, but can only be selected while
  the switch chosen in the [Menu Switch ID](../parameters/menu-switch.md) parameter is ON and the party's inventory
  holds at least one equip that can be chosen as a refinement base.
- With the [Call the Refinement Menu](../commands/call-menu.md) plugin command.
- From the dev console or a script call, with:

```js
Scene_JaftingRefine.callScene()
```

The plugin command and the script call ignore the switch, but still need an equip in the party's inventory that can be
chosen as a refinement base; without one, they play the buzzer and the scene does not open.