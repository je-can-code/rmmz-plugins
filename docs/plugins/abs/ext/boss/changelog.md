---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 1.0.1
  - The plugin metadata class no longer declares private members. Its base constructor reaches postInitialize before a
    derived class installs its own, so anything private was being touched on an object that did not yet have it, which
    threw during boot.
### 1.0.0
  - The initial release.