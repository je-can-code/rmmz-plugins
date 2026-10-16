---
type: plugin-parameter
title: Heal Chain Depth Plugin Parameter
description: Maximum number of cascade rounds a single heal event can trigger. 0 disables all cascades. Higher values allow deeper empathy-bond chains.
tags: [resources-abs, parameter]
param:
  key: healChainDepth
  type: number
  min: 0
  max: 20
  text: Heal Chain Depth
  desc: |-
    Maximum number of cascade rounds a single heal event can trigger.
    0 disables all cascades. Higher values allow deeper empathy-bond chains.
  default: 5
---

# Parameter: `healChainDepth`

Maximum number of cascade rounds a single heal event can trigger. 0 disables all cascades. Higher values allow deeper
empathy-bond chains.