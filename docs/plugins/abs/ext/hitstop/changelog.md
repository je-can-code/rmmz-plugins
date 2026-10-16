---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.0.3
  - Wrote real help docs for <hitstop>, <noHitstop>, <hitstopScale>; the help text was still boilerplate placeholder
    text despite the tags already being implemented. Removed leftover unused scaffold params.
  - Fixed screen-shake anti-spam cooldown reading a key that was never written to, so the cooldown never actually
    blocked anything; both read and write now go through one JABS_HitstopRuntime static field.
  - Reset hitstop state (frozen frames, flurry windows) on save load so stale combat state never carries over.
  - Removed the JsonEx Map-restore workaround now that JsonEx natively round-trips Map instances (see J-Base changelog).
### 1.0.2
  - Raised minimum J-ABS version requirement to 4.7.0.
### 1.0.1
  - Raised minimum J-ABS version requirement to 4.6.0.
### 1.0.0
  - The initial release.