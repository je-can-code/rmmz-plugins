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
  - Fixed <castSpeedRate> actually matching <castTimePercent:...> instead of its own documented tag name, so it never
    worked as documented.
  - Fixed updateCastSpeedRate reading castSpeedFlat() instead of castSpeedRate(), feeding the rate modifier the wrong
    source value.
  - Corrected stale doc text for <baseCastTime>/<castTimeFlat>.
### 1.0.2
  - Raised minimum J-ABS version requirement to 4.7.0.
### 1.0.1
  - Raised minimum J-ABS version requirement to 4.6.0.
### 1.0.0
  - Initial release.