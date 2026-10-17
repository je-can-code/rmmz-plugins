---
type: plugin-parameter
title: Dominance Multiplier (M) Plugin Parameter
description: 'A/D ratio: no parry if >= M; always parry if <= 1/M; else linear odds. Default 2. Min 1.01.'
tags: [abs, parameter]
param:
  key: implicitParryDominanceMultiplier
  parent: implicitParryConfigs
  type: number
  decimals: 2
  min: 1.01
  text: Dominance Multiplier (M)
  desc: 'A/D ratio: no parry if >= M; always parry if <= 1/M; else linear odds. Default 2. Min 1.01.'
  default: 2
---

# Parameter: `implicitParryDominanceMultiplier`

A/D ratio: no parry if >= M; always parry if <= 1/M; else linear odds. Default 2. Min 1.01.