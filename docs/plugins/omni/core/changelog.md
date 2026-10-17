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
  - Removed the console.debug narrating each root pedia selection. The method is an extension point every pedia
    overrides, so it now says that instead.
### 1.1.0
  - Routed the _omni namespace into its own save section, so every omnipedia extension's data lands in systems/omni.json
    together rather than inside the party and system blobs.
  - Moved the _omni namespace seeding from the initialize alias to initMembers, so a decoded save can establish it
    without a constructor.
### 1.0.1
  - Updated JABS menu integration with help text.
### 1.0.0
  - Initial release.