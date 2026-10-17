---
type: plugin-parameter
title: Global Cooldown Skill Types Plugin Parameter
description: Skill type ids (stypeId, same order as Database Types). These types trigger and respect GCD. Empty = no type-based GCD.
tags: [abs, parameter]
param:
  key: globalCooldownSkillTypes
  parent: globalCooldownConfigs
  type: number[]
  text: Global Cooldown Skill Types
  desc: Skill type ids (stypeId, same order as Database Types). These types trigger and respect GCD. Empty = no type-based GCD.
  default: '[]'
---

# Parameter: `globalCooldownSkillTypes`

Skill type ids (stypeId, same order as Database Types). These types trigger and respect GCD. Empty = no type-based GCD.