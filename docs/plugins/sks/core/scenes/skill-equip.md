---
type: scene
title: Skill Equip Scene
description: The scene for managing which of an actor's skills are equipped into their skill slots.
tags: [sks, scene, menu]
---

# Scene_SkillEquip

The `Scene_SkillEquip` is the SKS equip scene, where the player manages the skills each actor has equipped into their
skill slots.

## How to call the scene

The scene can be opened in any of these ways:

- From the main menu, with the `Skill Equip` command. The command only appears while the switch chosen in the
  [Menu Switch ID](../parameters/menu-switch.md) parameter is ON, or always when that parameter is 0, and is always
  selectable. With `J-CMS` installed, it sits in the menu's actor column.
- From the dev console or a script call, with:

```js
Scene_SkillEquip.callScene()
```