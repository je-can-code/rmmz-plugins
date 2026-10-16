---
type: notetag
title: Channel
description: The tags turning a skill into a vessel that repeatedly executes a child skill for a total duration.
tags: [abs, tag, skill, channel, casting]
---

# Channel

## Description

Turns this skill into a "vessel": instead of executing its own effects, it pays its own cost once, then repeatedly
executes a child skill every so many frames for a total duration.

A vessel skill's own damage/effects are never invoked- author it with no real effects of its own. The first execution of
SKILL_ID happens after the first tick interval elapses, not immediately when the channel begins.

## TAG USAGE

- Skills

## TAG FORMAT

`<channel:[SKILL_ID, TOTAL_DURATION]>`
Where SKILL_ID is the skill id to repeatedly execute.
Where TOTAL_DURATION is the number of frames the channel lasts.

`<channelTickSpeed:VAL>`
Optional. VAL is the number of frames between each repeated execution of SKILL_ID. Falls back to the plugin's configured
default channel tick speed when omitted.

`<onChannelComplete:[SKILL_ID, ...]>`
Optional. One or more skill ids to execute for free, once, immediately after the channel completes its full duration
uninterrupted. Resolved the same way the channel's own ticks are- does NOT fire if the channel is cut short by an
interrupt.

## TAG EXAMPLES

`<channel:[25, 180]>`
`<channelTickSpeed:30>`
`<onChannelComplete:[36]>`
Fires skill 25 every 30 frames for 180 frames (6 executions), then fires skill 36 once, for free, the instant the
channel completes- but only if nothing interrupted it first.