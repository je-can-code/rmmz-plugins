---
type: scene
title: Remap Scene
description: The scene for rebinding the keys and buttons that control JABS.
tags: [abs-input, scene, menu]
---

# Scene_JabsRemap

The `Scene_JabsRemap` is the scene for rebinding the keys and buttons that control JABS. Each action is listed in its
group beside the key or button bound to it. Choosing an action waits for the next key or button pressed, and gives up
after five seconds; the Tool input (Tab or Triangle) clears the selected action's binding. A strip along the bottom
applies the new bindings, resets them to the defaults, undoes the changes made in the scene, or exits without saving.

## How to call the scene

The scene can be opened in any of these ways:

- From the main menu, with the `Remap Controls` command. The command is always listed and always selectable.
- From the dev console or a script call, with:

```js
Scene_JabsRemap.callScene()
```