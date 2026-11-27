---
type: dependencies
title: Dependencies
description: The list of dependencies- required and optional- for this plugin.
tags: [plugins, deps]
dependencies:
  - key: J-Base
    version: 3.6.0
    base: true
    orderAfter: true
  - key: J-ABS
    version: 4.29.0
    base: true
    orderAfter: true
---

# Dependencies

All the various dependencies along with why they are dependencies live here.

## J-Base

All plugins in this ecosystem require the base plugin.

## J-ABS

Extends its skill slot manager as this plugin loads, and its engine's on-cast hook, which runs this plugin's on-cast
self, lose, toggle and execute-skill effects once as each action executes. Rolls every state this plugin applies or
removes by chance through its state roll and the fate an action brings against its target, and each
`<onCastExecuteSkill>` payload with the caster's own fate. Carries the DURATION and STACKS of `<applyState>` and
`<thisApplyState>` through its state overrides, and force-executes `<onCastExecuteSkill>` payloads through its engine.