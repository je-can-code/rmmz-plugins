---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.1.1
  - A content-synced target's level reads in light blue on the rebuilt target frame from J-HUD-TargetFrame 2.0.0.
### 1.1.0
  - Routed the _levelSync namespace into its own save section, so an active sync session lands in
    systems/level-sync.json rather than in the system blob.
  - Moved the _levelSync namespace seeding from the initialize aliases to initMembers, so a decoded save can establish
    it without a constructor.
### 1.0.0
  - The initial release.