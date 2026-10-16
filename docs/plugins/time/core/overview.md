---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [time, overview]
---

# Overview

This is a system that tracks time, either artificial or real, and manipulates various components of the game based on
the time.

Temporally Integrated Monitoring of Ecosystems- aka TIME.

This plugin enables a TIME system. The TIME system functions much like you'd expect: it tracks TIME. This TIME however,
is configurable in many ways that regular time is not.

There are two forms of time-keeping, real and artificial.

## Real time

Real time acts much like you'd expect: it reads the client's computer's time and updates every half of a second to keep
in sync with real time. All of the features surrounding this TIME system (relating to time of day or seasons) operate
the same as artificial, but based on real time.

## Artificial time

Artificial time acts similar to real time, but instead of reading the time from your computer, it starts at a
designated point that you specify and ticks ever forward. The rate at which time ticks forward defaults to 60 frames per
second, but you can reduce that if you want time to pass faster. Alternatively (or in addition to), you can also adjust
the amount of time that passes per "tock". A "tock" is defined as "on-increment", so for example, when the second
counter increments past 59 to 60, you would expect the minutes to go up by 1. That incrementing is a "tock", that is
defined by you. You can define how much that increment is for each unit of time: seconds, minutes, hours, days, months,
and years. I would encourage this be explored before tweaking the defaults.

## Variables

Unless disabled, both real and artificial TIME will track the various components of the current TIME in variables, to
allow for developing events revolving around TIME. You can specify in the plugin parameters which variables you want
these to be assigned to. If you do not want one or more of the TIME components tracked in variable, but do want to
leverage the functionality of variable assignment, then just assign the TIME components that you do not care about to
variable id of 0.

## Time of day

Additionally, this system tracks "time of day". "Time of Day" is defined as a block of time (measured in hours) that is
named.

There are six of these blocks of time that make up a day:

- Moontide (00:00am - 03:59am)
- Dawn (04:00am - 7:59am)
- Morning (08:00am - 11:59am)
- Afternoon (12:00pm - 15:59pm)
- Evening (16:00pm - 19:59pm)
- Night (20:00pm - 23:59pm)

Alongside the "time of day" functionality, there is also an optional "tone" adjustment to alter the screen tone based on
"time of day". The tone will change on the hour. This can be disabled entirely, or selectively with
[tags](notetags/maps/no-tone-change.md). Keep in mind that, understandably, this does not play nicely with manual
tone-changes from outside this system. If you intend to control the tone yourself, you should probably disable the
tone-change functionality for those maps.

## Season of year

Additionally, this system tracks the "season of the year". The "season of the year" is defined likely much how you
think it is: a block of time (measured in months) that is named.

- Spring (march, april, may)
- Summer (june, july, august)
- Autumn (september, october, november)
- Winter (december, january, february)

Nothing special happens as months progress, you as the developer can decide what to do when it is the summer months or
the winter months if you want.

## Time-gated event pages and choices

Ever wanted an event page (or a "Show Choices" branch) to only be active during a specific minute, hour, day, month,
year, time of day, season, or combination thereof? Well now you can! There are two parallel tag families- "Page" tags
gate an entire event page condition; "Choice" tags gate a single choice in a "Show Choices" branch. Both families share
identical unit names and behavior, just swap "Page" for "Choice" in the tag name.

## Commands

There are a number of plugin commands available to manipulate TIME:

### [Jump to time of day](commands/jump-to-time-of-day.md)

Jumping to a specific time of day may result in skipping a day. This will fast-forward to a particular time of day. If
that time of day has already passed (or it is currently that time of day), the system will proceed to the next day's
time of day. (common use case is sleeping at an inn till morning)

### [Set Time](commands/set-time.md)

This sets the time to a fixed point in time. This is not relative. You will likely need to be cautious when using this
particular command.

### [Fast Forward Time](commands/fast-forwardtime.md)

This fast-forwards time by a given amount.

### [Rewind Time](commands/rewind-time.md)

This rewinds time by a given amount.

### [Show TIME on Map](commands/show-map-time.md)

This toggles the TIME window to be visible on the map.

### [Hide TIME on Map](commands/hide-map-time.md)

This toggles the TIME window to be invisible on the map.

NOTE: TIME will still pass while the window is hidden.

### [Stop TIME](commands/stop-time.md)

This halts the flow of TIME.

NOTE: This is not compatible with "real" time. If you use this command with real time, it will pause the counting for
the duration and pick back up with the current time when TIME is unblocked.

### [Start TIME](commands/start-time.md)

This re-enables the flow of TIME.

NOTE: This is not compatible with "real" time. If you used the stop command to halt real time, when re-enabled, it will
pick up wherever it is currently which may result in skipping time.

### Unlock Screen Tone

This (re-)allows the TIME system to control screen tone.

NOTE: This does nothing if the plugin parameters are set to disable screen tone changing entirely.

### Lock Screen Tone

This locks the TIME system from controlling the screen tone.