---
type: plugin-parameter
title: Reapply Type Plugin Parameter
description: The strategy used when applying a state on a battler already afflicted with the same state.
tags: [abs, parameter]
param:
  key: defaultStateReapplyType
  parent: stateConfigs
  type: select
  options:
    - option: Refresh
      value: refresh
    - option: Extend
      value: extend
    - option: Stack
      value: stack
  text: Reapply Type
  desc: The strategy used when applying a state on a battler already afflicted with the same state.
  default: refresh
---

# Parameter: `defaultStateReapplyType`

The strategy used when applying a state on a battler already afflicted with the same state.