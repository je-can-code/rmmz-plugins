---
type: notetag
title: Range
description: The tags gating event pages or choices on an inclusive span of minutes, hours, days, months or years.
tags: [time, tag, event, choice, condition, range]
---

# Range

## Description

There are two parallel tag families- "Page" tags gate an entire event page condition; "Choice" tags gate a single
choice in a "Show Choices" branch. Both families share identical unit names and behavior, just swap "Page" for "Choice"
in the tag name.

## NOTE ABOUT EXACT VS RANGE

The [plain unit tags](exact-value.md) (`<minutePage>`, `<hourPage>`, etc.) match only that exact value. The "Range"
variants (`<minuteRangePage>`, `<hourRangePage>`, etc.) match an inclusive START-END span instead.

## TAG USAGE

- Event comments, on an event page (gates the whole page like a normal page condition).
- Event comments, in a "Show Choices" branch (gates a single choice).

## TAG FORMAT

`<minuteRangePage:START-END>`
`<minuteRangeChoice:START-END>`

`<hourRangePage:START-END>`
`<hourRangeChoice:START-END>`

`<dayRangePage:START-END>`
`<dayRangeChoice:START-END>`

`<monthRangePage:START-END>`
`<monthRangeChoice:START-END>`

`<yearRangePage:START-END>`
`<yearRangeChoice:START-END>`

## TAG EXAMPLES

`<hourRangePage:9-17>`
This event page is only active between hour 9 and hour 17, inclusive.