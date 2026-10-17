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
  - Routed the invalid skill-reward report through J-Base's new Diagnostics.
  - It was a console.log with no message and a bare conditional dumped beside it; it now names J-CMS-Skill and states
    which reward id was rejected.
### 1.1.0
  - Fixed long related-skill names overlapping the fixed-position required/current proficiency values; names now
    truncate with an ellipsis to fit the available column width.
  - Migrated HP/MP/TP cost labels from TextManager.longParam(id) to the parameter catalog's
    parameterLabel('hcr'/'mcr'/'tcr').
  - Replaced eval() with new Function() in the raw-damage preview.
### 1.0.1
  - Added HP skill cost display to the skill detail window (requires J-Resources).
  - Updated MP/TP cost display to reflect tag-based extra costs from J-Resources.
### 1.0.0
  - Initial release.