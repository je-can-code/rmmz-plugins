---
type: scene
title: Files Scene
description: The single scene for saving, loading, deleting and rewinding, offering whatever its origin allows.
tags: [base-save, scene, menu]
---

# Scene_Files

The `Scene_Files` is the single scene that saves, loads, deletes, and rewinds, in place of `Scene_Save` and
`Scene_Load`. What it offers depends entirely on where it was opened from, as
[the overview](../overview.md#the-files-scene) describes.

## How to call the scene

The scene can be opened in any of these ways:

- From a save platform, with the `Open Save Screen` event command. Opened this way, it offers Save, Load and Rewind.
- From the main menu, with the `Files` command, which takes the place of the save command. The command is always listed
  and always selectable. Opened this way, it offers Load and Rewind.
- From the title screen, with the `Continue` command, which can only be selected while a slot holds a save. Opened this
  way, it offers Load and Delete.
- From the dev console or a script call, with the call for the origin it should open as:

```js
Scene_Files.callFromSavePoint()
Scene_Files.callFromMenu()
Scene_Files.callFromTitle()
```