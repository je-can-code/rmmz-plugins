---
type: plugin-command
title: Add/Remove party's SDP points Plugin Command
description: Adds or removes a designated amount of points from all members of the current party.
tags: [sdp, command]
command:
  key: Modify party SDP points
  text: Add/Remove party's SDP points
  desc: Adds or removes a designated amount of points from all members of the current party.
  args:
    - key: sdpPoints
      type: number
      min: -99999999
      desc: The number of points to modify by. Negative will remove points. Cannot go below 0.
---

# `Modify party SDP points`

Adds or removes a designated amount of points from all members of the current party.