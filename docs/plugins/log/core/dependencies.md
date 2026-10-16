---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.7.0
    base: true
    orderAfter: true
  - key: J-Message
    version: 2.0.0
    base: true
    orderAfter: true
  - key: J-ABS
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-Message

Translates the database text codes inside the log messages, such as `\Skill[ID]` and `\Item[ID]`, as the log windows
draw them.

## J-ABS

Feeds the action and loot logs with the skills, defeats, level ups, rewards and item usage it reports; this plugin reads
nothing from J-ABS itself.