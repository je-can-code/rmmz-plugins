---
type: plugin-parameter
title: Foot Touch Trigger Delay (frames) Plugin Parameter
description: After a map loads, suppress Player Touch / Event Touch on the tile under the player for this many frames (0 = off). Reduces spurious saves after load.
tags: [pixel, parameter]
param:
  key: footTouchEventDelayFrames
  parent: movementConfigs
  type: number
  min: 0
  max: 120
  text: Foot Touch Trigger Delay (frames)
  desc: After a map loads, suppress Player Touch / Event Touch on the tile under the player for this many frames (0 = off). Reduces spurious saves after load.
  default: 15
---

# Parameter: `footTouchEventDelayFrames`

After a map loads, suppress Player Touch / Event Touch on the tile under the player for this many frames (0 = off).
Reduces spurious saves after load.