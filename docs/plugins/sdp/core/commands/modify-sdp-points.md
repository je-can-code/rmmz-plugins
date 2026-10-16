---
type: plugin-command
title: Add/Remove SDP points Plugin Command
description: Adds or removes a designated amount of points from an actor.
tags: [sdp, command]
command:
  key: Modify SDP points
  text: Add/Remove SDP points
  desc: Adds or removes a designated amount of points from an actor.
  args:
    - key: actorId
      type: actor
      desc: The actor to modify the points of.
    - key: sdpPoints
      type: number
      min: -99999999
      desc: The number of points to modify by. Negative will remove points. Cannot go below 0.
---

# `Modify SDP points`

Adds or removes a designated amount of points from an actor.