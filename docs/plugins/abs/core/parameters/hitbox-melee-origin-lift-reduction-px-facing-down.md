---
type: plugin-parameter
title: Melee Origin Lift Reduction When Facing Down (px) Plugin Parameter
description: Subtracts from the default half-tile vertical lift when facing down (2) or diagonal down (1/3). Fixes pivots that sit too high (hitbox reads behind the actor). Half strength on diagonals.
tags: [abs, parameter]
param:
  key: hitboxMeleeOriginLiftReductionPxFacingDown
  parent: miscConfigs
  type: number
  decimals: 0
  min: 0
  max: 999
  text: Melee Origin Lift Reduction When Facing Down (px)
  desc: Subtracts from the default half-tile vertical lift when facing down (2) or diagonal down (1/3). Fixes pivots that sit too high (hitbox reads behind the actor). Half strength on diagonals.
  default: 28
---

# Parameter: `hitboxMeleeOriginLiftReductionPxFacingDown`

Subtracts from the default half-tile vertical lift when facing down (2) or diagonal down (1/3). Fixes pivots that sit
too high (hitbox reads behind the actor). Half strength on diagonals.