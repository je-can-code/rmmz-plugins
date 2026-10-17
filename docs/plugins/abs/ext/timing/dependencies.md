---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-ABS
    version: 4.13.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-ABS

Supplies the cast time and cooldown of every JABS action, which this plugin runs through the caster's cast speed and
fast cooldown by extending `JABS_Action`'s `getCastTime` and `getCooldown`.