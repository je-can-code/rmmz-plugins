---
type: plugin-parameter
title: Subcells Per Tile Plugin Parameter
description: The number of subcells to divide each tile into along each axis. Higher = more precise edges but more memory.
tags: [pixel, parameter]
param:
  key: collisionStepCount
  parent: collisionConfigs
  type: select
  options:
    - option: 1 (coarse)
      value: 1
    - option: 2 (medium)
      value: 2
    - option: 4 (fine, default)
      value: 4
  text: Subcells Per Tile
  desc: The number of subcells to divide each tile into along each axis. Higher = more precise edges but more memory.
  default: 4
---

# Parameter: `collisionStepCount`

The number of subcells to divide each tile into along each axis. Higher = more precise edges but more memory.