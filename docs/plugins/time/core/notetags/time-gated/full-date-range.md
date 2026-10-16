---
type: notetag
title: Full Date Range
description: The tags gating event pages or choices on an inclusive span across a full calendar date and time.
tags: [time, tag, event, choice, condition, range]
---

# Full Date Range

## Description

The most precise gate: an inclusive span across a full calendar date+time. Seconds are always treated as 0 at the start
of the range and 59 at the end (seconds are not independently configurable here).

There are two parallel tag families- "Page" tags gate an entire event page condition; "Choice" tags gate a single
choice in a "Show Choices" branch. Both families share identical unit names and behavior, just swap "Page" for "Choice"
in the tag name.

## TAG USAGE

- Event comments, on an event page (gates the whole page like a normal page condition).
- Event comments, in a "Show Choices" branch (gates a single choice).

## TAG FORMAT

`<fullDateRangePage:[MINUTE,HOUR,DAY,MONTH,YEAR]-[MINUTE,HOUR,DAY,MONTH,YEAR]>`
`<fullDateRangeChoice:[MINUTE,HOUR,DAY,MONTH,YEAR]-[MINUTE,HOUR,DAY,MONTH,YEAR]>`

## TAG EXAMPLES

`<fullDateRangePage:[0,9,29,5,2021]-[0,17,29,5,2021]>`
This event page is only active from 9:00am to 5:00pm on day 29, month 5, year 2021- and nowhere else on the calendar.