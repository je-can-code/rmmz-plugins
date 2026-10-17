---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.2.0
  - Added natural growth tags for life cost (hcr). A negative value makes costs cheaper.
### 1.1.0
  - Routed the _resources namespace into its own save section, so resource state lands in systems/resources.json rather
    than in the system blob.
### 1.0.0
  - Initial release.
  - Added HP/MP/TP costs and gains via flat, percent, and formula notetags.
  - Added HCR (HP Cost Reduction) as an additive stat sourced from traits.
  - Added <hp-cost-can-kill> tag to allow lethal HP costs.
  - Registered {@code hcr} (HP Cost Reduction) in the parameter catalog.
  - Added <stackCost:[STATE_ID,COUNT]> (requires J-ABS) and <itemCost:[ITEM_ID,COUNT]> skill costs, feeding directly
    into canPaySkillCost/paySkillCost alongside hp/mp/tp.