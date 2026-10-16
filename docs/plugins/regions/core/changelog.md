---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.3.0
  - Added globalDenyTerrainTags, a plugin-level list of terrain tags that block passage outright. It joins the region
    allow and deny lists already here.
### 1.2.0
  - Routed the _regions namespace into its own save section, so region effect state lands in systems/regions.json rather
    than in the system blob.
  - Moved the _regions namespace seeding from the initialize alias to initMembers, so a decoded save can establish it
    without a constructor.
### 1.0.2
  - Fixed issue with referencing CycloneMovement.
### 1.0.1
  - Created plugin extension namespace for REGIONS plugin extensions.
### 1.0.0
  - The initial release.