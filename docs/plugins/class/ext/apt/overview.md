---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [class-apt, overview]
version: "1.0.0"
---

# Overview

This plugin connects `J-Classes` to `J-Aptitude`, for games whose classes teach skills through
[`<aptitude>`](../../../apt/core/notetags/teachable.md) tags.

## Integrations

Integrates with others of mine plugins:

- [`J-Base`](../../../_base/core/overview.md); to be honest this is just required for all my plugins.
- [`J-Classes`](../../core/overview.md); the [class scene](../../core/scenes/classes.md) this adds to.
- [`J-Aptitude`](../../../apt/core/overview.md); the learnings this shows.
- [`J-Aptitude-Typed`](../../../apt/ext/typed/overview.md); typed learnings carry their badge here too.
- `J-SkillSlots`; the skills a class keeps known are listed too.

## Details

The class scene gains a window beside the parameters, showing every skill the highlighted class teaches and how far
along the actor is with each. Progress is kept per class whether or not it is being worn, so a class set aside still
shows how far along it got.

With `J-SkillSlots` installed, the skills a class lists in `<unslottedSkills>` are shown above them as "Always known":
the skills the class keeps active for as long as it is worn, like the weapon types it can equip.

Each class in the list also shows how many of its skills have been learned, as learned/total, and MASTERED in green once
every one of them has. A "???" class shows neither.

## Mastery

A class is mastered once every skill it teaches has been learned, from that class or any other. A class that teaches
nothing is never mastered.

Events can ask with a script call in a conditional branch:

```js
$gameActors.actor(1).isClassMastered(2)
```

This is true once actor 1 has learned everything class 2 teaches.