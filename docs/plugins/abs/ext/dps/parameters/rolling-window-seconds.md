---
type: plugin-parameter
title: Rolling Window (seconds) Plugin Parameter
description: How far back the rolling rate looks, in seconds of combat time. Keep it shorter than a typical fight, or the rate becomes a smoothing filter instead.
tags: [abs-dps, parameter]
param:
  key: rollingWindowSeconds
  type: number
  min: 1
  max: 60
  text: Rolling Window (seconds)
  desc: How far back the rolling rate looks, in seconds of combat time. Keep it shorter than a typical fight, or the rate becomes a smoothing filter instead.
  default: 5
---

# Parameter: `rollingWindowSeconds`

How far back the rolling rate looks, in seconds of combat time. Keep it shorter than a typical fight, or the rate
becomes a smoothing filter instead.