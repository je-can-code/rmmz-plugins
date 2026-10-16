---
type: scene
title: SDP Scene
description: The scene for managing unlocked SDPs and spending SDP points to rank them up.
tags: [sdp, scene, menu]
---

# Scene_SDP

The `Scene_SDP` is the scene to manage unlocked SDPs, where an actor spends their SDP points to rank panels up.

## How to call the scene

The scene can be opened in any of these ways:

- From the main menu, with the command named by the [Menu Name](../parameters/menu-command-name.md) parameter. The
  command only appears while the switch chosen in the [Menu Switch ID](../parameters/menu-switch.md) parameter is ON,
  and can only be selected once a panel has been unlocked.
- With the [Access the SDP Menu](../commands/call-sdp-menu.md) plugin command.
- From the dev console or a script call, with:

```js
Scene_SDP.callScene()
```