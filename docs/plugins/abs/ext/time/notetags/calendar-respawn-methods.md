---
type: notetag
title: Calendar Respawn Methods
description: The respawn methods that time a defeated battler's return by the J-TIME clock and calendar.
tags: [abs-time, tag, respawn, enemy, event, calendar]
---

# Calendar Respawn Methods

## Description

Everything prefixed "next-" names a moment on the calendar and waits for that moment to come around again, strictly
after the battler fell. Anything without the prefix is a plain duration. That split is why the prefix is there: an
author reading a tag in an event comment can tell which kind of statement they are looking at without going to find
the documentation.

### `game-minutes`

A duration measured on the game clock rather than on playtime, which is what core's `[seconds, N]` measures.

### `next-time`

The next time the clock reads a given HMM/HHMM.

### `next-time-of-day`

The next time a time of day begins.

Valid values: `moontide`, `dawn`, `morning`, `afternoon`, `evening`, `night`. The phases tile the day in four-hour
blocks starting at midnight, so this is `next-time` restricted to the six hours they begin on.

### `next-day-of-week`

Midnight on the next occurrence of a weekday.

The artificial calendar cycles a seven-day week anchored so that day 1 of month 1 of year 0 is a Monday.

### `next-month`

The first midnight of the next occurrence of a month.

### `next-season`

The first midnight of the next occurrence of a season.

Seasons begin in months 3, 6, 9, and 12 respectively.

## TAG USAGE

- Enemies
- Event comments, as overrides on individual placements.

## TAG FORMAT

`<respawn:[game-minutes, PARAM]>`
Where PARAM is the number of in-game minutes.

`<respawn:[next-time, PARAM]>`
Where PARAM is a given HMM/HHMM.

`<respawn:[next-time-of-day, PARAM]>`
Where PARAM is a time of day.

`<respawn:[next-day-of-week, PARAM]>`
Where PARAM is a weekday.

`<respawn:[next-month, PARAM]>`
Where PARAM is a month.

`<respawn:[next-season, PARAM]>`
Where PARAM is a season.

## TAG EXAMPLES

`<respawn:[game-minutes, 30]>`
Thirty in-game minutes, so it runs at whatever rate the clock is configured for and freezes whenever the clock is
blocked.

`<respawn:[next-time, 830]>`
830 means 8:30am; 1430 means 2:30pm. Falling at 6am schedules 8:30 the same morning; falling at 9am schedules 8:30 the
next one.

`<respawn:[next-time-of-day, morning]>`
The next time morning begins.

`<respawn:[next-day-of-week, monday]>`
Midnight on the next Monday.

`<respawn:[next-month, 3]>`
The first midnight of the next occurrence of month 3.

`<respawn:[next-season, winter]>`
The first midnight of the next occurrence of winter.