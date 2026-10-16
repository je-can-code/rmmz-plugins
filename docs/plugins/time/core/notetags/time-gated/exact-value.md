---
type: notetag
title: Exact Value
description: The tags gating event pages or choices on one exact minute, hour, day, month, year, time of day or season.
tags: [time, tag, event, choice, condition]
---

# Exact Value

## Description

There are two parallel tag families- "Page" tags gate an entire event page condition; "Choice" tags gate a single
choice in a "Show Choices" branch. Both families share identical unit names and behavior, just swap "Page" for "Choice"
in the tag name.

## NOTE ABOUT EXACT VS RANGE

The plain unit tags (`<minutePage>`, `<hourPage>`, etc.) match only that exact value. The ["Range" variants](range.md)
(`<minuteRangePage>`, `<hourRangePage>`, etc.) match an inclusive START-END span instead.

## TAG USAGE

- Event comments, on an event page (gates the whole page like a normal page condition).
- Event comments, in a "Show Choices" branch (gates a single choice).

## TAG FORMAT

`<minutePage:MINUTE>`
`<minuteChoice:MINUTE>`

`<hourPage:HOUR>`
`<hourChoice:HOUR>`

`<dayPage:DAY>`
`<dayChoice:DAY>`

`<monthPage:MONTH>`
`<monthChoice:MONTH>`

`<yearPage:YEAR>`
`<yearChoice:YEAR>`

`<timeOfDayPage:TIME_OF_DAY>`
`<timeOfDayChoice:TIME_OF_DAY>`
Where TIME_OF_DAY is a 0-5 index or one of: moontide, dawn, morning, afternoon, evening, night.

`<seasonOfYearPage:SEASON>`
`<seasonOfYearChoice:SEASON>`
Where SEASON is a 0-3 index or one of: spring, summer, autumn, winter.

## TAG EXAMPLES

`<timeOfDayPage:morning>`
This event page is only active while TIME considers it currently morning.