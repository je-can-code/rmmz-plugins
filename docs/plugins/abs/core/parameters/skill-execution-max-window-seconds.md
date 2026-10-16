---
type: plugin-parameter
title: Skill History Max Window (Seconds) Plugin Parameter
description: How many seconds a skill execution entry is kept before being pruned. Individual tag windows must be <= this value.
tags: [abs, parameter]
param:
  key: skillExecutionMaxWindowSeconds
  parent: skillHistoryConfigs
  type: number
  min: 1
  text: Skill History Max Window (Seconds)
  desc: How many seconds a skill execution entry is kept before being pruned. Individual tag windows must be <= this value.
  default: 15
---

# Parameter: `skillExecutionMaxWindowSeconds`

How many seconds a skill execution entry is kept before being pruned. Individual tag windows must be <= this value.