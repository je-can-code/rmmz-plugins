---
type: plugin-parameter
title: Full Parry Scale Factor Plugin Parameter
description: Multiplies the raw parry formula output to produce the actual full-negate chance. 0.2 = 20% of formula.
tags: [abs, parameter]
param:
  key: implicitParryScaleFactor
  parent: implicitParryConfigs
  type: number
  decimals: 2
  min: 0
  max: 1
  text: Full Parry Scale Factor
  desc: Multiplies the raw parry formula output to produce the actual full-negate chance. 0.2 = 20% of formula.
  default: 0.2
---

# Parameter: `implicitParryScaleFactor`

Multiplies the raw parry formula output to produce the actual full-negate chance. 0.2 = 20% of formula.