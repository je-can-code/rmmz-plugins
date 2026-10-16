---
type: scene
title: Study Scene
description: The scene for buying the knowledge of recipes from somebody who already has it.
tags: [jafting-create, scene, menu]
---

# Scene_JaftingStudy

The `Scene_JaftingStudy` is the study shop: a shelf of the recipes for sale in the unlocked categories, each with its
price and what it consumes, requires and makes, where the player buys the recipes they want to learn.

A recipe is for sale when it carries a price, either of its own or from the tier it sits on in its
[profession](../overview.md#professions). One the party already knows stays on the shelf, greyed out. Buying pays the
price once and unlocks the recipe.

Which categories are on offer is decided before the scene opens: an event unlocks the categories its vendor deals in,
opens the scene, and locks them again.

## How to call the scene

The scene has no row on the JAFTING menu, and can be opened in either of these ways:

- With the [Call the Study Shop](../commands/call-study-shop.md) plugin command, which refuses, with a buzzer, when no
  unlocked category has a recipe for sale.
- From the dev console or a script call, with:

```js
Scene_JaftingStudy.callScene()
```