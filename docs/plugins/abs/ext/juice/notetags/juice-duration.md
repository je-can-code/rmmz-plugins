---
type: notetag
title: Juice Duration
description: The tag overriding how many frames a skill's weapon swing animation lasts.
tags: [abs-juice, tag, skill, overlay, duration]
---

# Juice Duration

## Description

Overrides the swing animation duration in frames. When omitted, the global `weaponSwingFrames * 2` value from
[`config.jabs.json`](../overview.md#required-external-configuration) is used.

## TAG USAGE

- Skills

## TAG FORMAT

`<juiceDuration:N>`
Where N is the swing animation duration in frames.

## TAG EXAMPLES

`<juiceDuration:30>`
This skill's swing animation lasts 30 frames.