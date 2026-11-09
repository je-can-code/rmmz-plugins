---
type: notetag
title: No AP
description: The tag letting an enemy refuse the AP it would pay on defeat.
tags: [ap, tag, enemy, rewards]
---

# No AP

## Description

Stops an enemy from paying AP when defeated, whatever its [AP](ap.md) tag says, while every other reward it carries
is paid as usual. To refuse every reward at once, use J-ABS's `<noRewardPoints>` from its
[Reward Opt-Outs](../../../abs/core/notetags/enemy-events/reward-opt-outs.md) instead.

## TAG USAGE

- Enemies only.

## TAG FORMAT

`<no:ap>`

## TAG EXAMPLES

`<no:ap>`
Defeating this enemy pays its experience, gold and SDP points as usual, but no AP.