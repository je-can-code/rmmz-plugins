---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [abs-time, overview]
version: "1.1.1"
---

# Overview

This plugin teaches the JABS respawn system to speak in appointments rather than durations. Core's
`<respawn:[seconds, N]>` counts playtime; the methods registered here consult the `J-TIME` calendar instead, so a
battler can come back "next morning" or "at the start of winter" rather than "in N seconds".

This plugin requires [JABS](../../core/overview.md). This plugin requires `J-TIME`. This plugin requires no plugin
parameter configuration.

## Details

All of [these methods](notetags/calendar-respawn-methods.md) ride the same `<respawn:[METHOD, PARAM]>` tag that core
owns, on enemies in the database or as comment overrides on individual placements. Every schedule resolves to the start
of the NEXT occurrence of the named moment, strictly after the moment of death- dying during the morning schedules
tomorrow's morning, not the one already underway.