---
type: notetag
title: Time Range
description: The tags gating event pages or choices on an hour:minute clock-time span within a single day.
tags: [time, tag, event, choice, condition, range]
---

# Time Range

## Description

Shortcut for gating on an hour:minute clock-time span within a single day (e.g. "9:00 to 17:30").

There are two parallel tag families- "Page" tags gate an entire event page condition; "Choice" tags gate a single
choice in a "Show Choices" branch. Both families share identical unit names and behavior, just swap "Page" for "Choice"
in the tag name.

## TAG USAGE

- Event comments, on an event page (gates the whole page like a normal page condition).
- Event comments, in a "Show Choices" branch (gates a single choice).

## TAG FORMAT

`<timeRangePage:HH:MM-HH:MM>`
`<timeRangeChoice:HH:MM-HH:MM>`

## TAG EXAMPLES

`<timeRangeChoice:9:00-17:30>`
This choice is only shown between 9:00am and 5:30pm.