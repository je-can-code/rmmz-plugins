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
  - key: J-Passive
    version: 2.1.0
    base: true
    orderAfter: true
  - key: J-Passive-Affix
    version: 1.1.0
    base: false
    orderAfter: true
  - key: J-ABS
    base: false
    orderAfter: true
  - key: J-Base-Save
    version: 1.0.0
    base: false
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-Passive

Supplies the passives themselves: each layer's actor and enemy states join the passive source list `J-Passive` builds
for every actor and enemy, a toggled layer reaches battlers that already exist through its `refreshPassiveStates`, and
its `<hideFromPassiveList>` tag keeps those states out of the Passives menu.

## J-Passive-Affix

Lets a layer's `affixEffects` block bias how enemy affixes roll, by wrapping the two pool methods and the two chance
resolvers `J-Passive-Affix` rolls through and by checking each grant against its `<enemy-prefix>`, `<enemy-suffix>` and
`<affix-weight>` tags at boot; without it the block is read but never applied.

## J-ABS

Hands the difficulty states to the enemies already standing on the map when a layer is toggled, finding them through
`JABS_AiManager`; without it only the enemies of a stock battle are refreshed.

## J-Base-Save

Routes the `_difficulty` namespace into its own save section.