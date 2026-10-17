---
type: changelog
title: Changelog
description: The list of all version updates this plugin has gone through and major change points.
tags: [changes, versions]
---

# Changelog

All the versioning and history of changes live here.

## The Actual Changelog

### 2.1.0
  - The HUD is the clock and the phase on one line, and nothing else. The season and the full date are gone, the seconds
    with them - the alternating colon already says the clock is running. drawContent splits into named draws and the
    window sizes from a declared row count, so an extension can add a line. Added the clockIcon parameter.
### 2.0.0
  - BREAKING: the day/night look moved out to J-Lighting-Time. This plugin keeps the clock, the variables, the
    conditionals and the HUD, and paints nothing.
  - BREAKING: the phases are now Moontide, Dawn, Morning, Afternoon, Evening, Night.
  - The hours each one covers are unchanged; twilight was two times of day wearing one word, and night was sitting on
    the block it describes.
  - An overnight range like 18-5 now holds past midnight instead of ending there. setTime announces the change, so
    setting the clock while it is stopped repaints.
### 1.3.0
  - Time conditionals are resolved from TimeMapper.ConditionalKinds, an ordered list a plugin can register its own
    conditional into, rather than from a hardcoded pair of branches per tag.
### 1.2.2
  - Loading a save on a map tagged <noToneChange> keeps that map's tone. The tone was resolved only on transfer, and a
    load is not a transfer, so the screen reverted to the clock's ordinary tone until the player left and came back.
### 1.2.1
  - Fixed time choice conditionals not hiding branches inside called common events.
### 1.2.0
  - Added a day-of-week vocabulary to Time_Snapshot: DaysOfWeekName and DaysOfWeekId translate between names and ids
    (0-6 starting from Monday), and dayOfWeekId/dayOfWeekName derive which weekday a snapshot lands on.
  - The artificial calendar anchors day 1 of month 1 of year 0 as a Monday and cycles a seven-day week; real-time mode
    asks the real calendar.
### 1.1.3
  - Routed the season and time-of-day validation errors, the unrecognized TIME tag warning, and the fresh-clock notice
    through J-Base's new Diagnostics, so each names J-TIME in the console.
### 1.1.2
  - Stopped re-running the clock's member backfill after extracting a save.
  - Game_Time is registered as serializable, so its seed already runs on the bare instance before any saved field lands,
    making the second pass both redundant and dependent on every member being assigned defensively.
### 1.1.1
  - Fixed a map tagged <noToneChange> suppressing the tone change outright, so no tint was ever issued and the previous
    map's tone stayed painted on screen: walking into a cave at midnight kept it midnight-blue. The tag now resolves to
    a neutral target tone that the existing pipeline applies, and the map transfer hook recomputes the tone rather than
    only flagging one as due.
  - Fixed overnight time ranges, which had never worked. Date#addDays returns a new date instead of mutating, unlike
    addHours beside it, so discarding its result left every overnight range ending before it began.
### 1.1.0
  - Added time-gated event pages/choices: exact-value, range, composite clock-time, and full-date-range tag families
    (Page and Choice variants) for minute/hour/day/month/year/timeOfDay/seasonOfYear.
### 1.0.4
  - Fixed reversed check that only let time pass while blocked (oops!).
### 1.0.3
  - Adapted for updates to J-ABS-InputManager (input namespace).
### 1.0.2
  - Adapted input remappability update of J-ABS-InputManager.
  - Removed connection between J-MAP and J-TIME toggling (HUD).
  - Updated to support RMMZ v1.10.X base scripts (Scene_Splash).
### 1.0.1
  - Fixed issue with "hours per tick" not being respected.
### 1.0.0
  - J-TIME's initial release.