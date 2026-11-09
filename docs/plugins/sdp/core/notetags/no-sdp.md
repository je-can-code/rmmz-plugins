---
type: notetag
title: No SDP
description: The tag letting an enemy refuse the SDP points it would pay on defeat.
tags: [sdp, tag, enemy, rewards]
---

# No SDP

## Description

Stops an enemy from paying SDP points when defeated, whatever its row says it pays, while every other reward it
carries is paid as usual. An SDP panel it drops is loot rather than points, so that still falls. To refuse every reward
at once, use J-ABS's `<noRewardPoints>` from its [Reward Opt-Outs](../../../abs/core/notetags/enemy-events/reward-opt-outs.md)
instead.

## TAG USAGE

- Enemies only.

## TAG FORMAT

`<no:sdp>`

## TAG EXAMPLES

`<no:sdp>`
Defeating this enemy pays its experience, gold and AP as usual, but no SDP points.