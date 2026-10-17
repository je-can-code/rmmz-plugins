---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 4.0.0
    base: true
    orderAfter: true
  - key: J-Classes
    version: 1.0.0
    base: true
    orderAfter: true
  - key: J-Aptitude
    version: 2.0.0
    base: true
    orderAfter: true
  - key: J-Aptitude-Typed
    version: 1.1.0
    base: false
    orderAfter: true
  - key: J-SkillSlots
    version: 1.3.0
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-Classes

Supplies the class scene this adds its learnings window and each class's progress to, through the seams it leaves for
extensions.

## J-Aptitude

Supplies the `<aptitude>` teachings on each class, the progress an actor has made in them, and the source-details window
the learnings are drawn with.

## J-Aptitude-Typed

Adds its typed AP badge to the learnings window this draws; nothing here calls it.

## J-SkillSlots

Supplies the `<unslottedSkills>` tag whose skills are listed above the learnings as "Always known"; without it that
section is left out.