---
type: scene
title: Monsterpedia Scene
description: The scene for perusing the monsters the player has perceived and what has been learned of each.
tags: [omni-monster, scene, menu]
---

# Scene_Monsterpedia

The `Scene_Monsterpedia` is the scene for perusing the monsters the player has perceived. The left column lists every
entry that can be observed on the open page, beneath a strip naming that page, and the right side details whichever
entry is highlighted. There is nothing to confirm here, only to read, and cancelling leaves the scene.

## Pages

Each page lists one kind of entry, named on an enemy with the [Monster Type](../notetags/monster-type.md) tag. The
kinds are authored in `data/config.omni.json` with a key, a name, an icon, and whether the entries on that page show
their stats. L2/R2 flips between their pages in the order they are authored, and the scene opens on the first.

## The detail

An entry is pictured the way it looks on the map: the front-facing standing frame of the character sheet its event
wears on J-ABS's enemy map, drawn at three times its size, or smaller when it would not otherwise fit. It is pictured
only once it has been defeated at least once.

Beneath the portrait sit its elementalistics: how each damage type lands on it, and beside those, its family, traits
and tools. Its stats (level, resources and parameters) are shown only on a page authored to show them, so a crate's
page can leave out numbers nobody fights it for.

Its drops are listed one line per item. An item the enemy rolls several times shows once, with the best chance among
its rolls and how many times it can drop, as in `70% ×3`.

## How to call the scene

The scene can be opened in any of these ways:

- From the [Omnipedia](../../../core/scenes/omnipedia.md), with the command named "Monsterpedia". The command only
  appears while the game switch with id 103 is ON. Its name and that switch id are fixed rather than parameters, as this
  plugin has none.
- From the dev console or a script call, with:

```js
Scene_Monsterpedia.callScene()
```