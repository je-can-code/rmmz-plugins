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
  - BREAKING: next-time-of-day now takes moontide for the small hours and night for the late evening, following the
    phase rename in J-TIME.
### 1.1.0
  - BREAKING: calendar methods gained a next- prefix. time-of-day, day-of-week, month and season are now
    next-time-of-day, next-day-of-week, next-month and next-season. Anything without the prefix is a plain duration.
  - Added next-time, for an arbitrary HHMM clock time.
  - Retired next-day, which alone jumped a day unconditionally.
### 1.0.0
  - The initial release.