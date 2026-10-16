---
type: notetag
title: Hiding Data
description: The tags hiding the target frame, or chosen data points of it, for specific enemies.
tags: [hud-target, tag, enemy, event, hide]
---

# Hiding Data

## Description

Have you ever wanted to hide certain data points for some enemies, but not ALL enemies? Well now you can! By applying
the appropriate tags to either the enemy or the event that represents an enemy on the map, you too can have the chosen
data points completely absent from the target frame when striking the tagged enemy!

Below you'll find 5 tags for hiding the various data points of the target frame, with the tag hopefully describing
accurately what they accomplish. Hiding the entire frame will take priority over any of the one elements. Hiding with
these tags via the event will take the highest priority over showing via tags in the event or the database. Generally
speaking, it is probably recommended to enable and show all data points, and then hide them selectively with the below
tags.

## TAG USAGE

- Enemies
- Event comments, only applicable to JABS battlers.

## TAG FORMAT

`<hideTargetFrame>`
Hides the target frame and all text and gauges.

`<hideTargetFrameText>`
Hides the subtext in the target frame.

`<hideTargetHpBar>`
Hides the HP gauge in the target frame.

`<hideTargetMpBar>`
Hides the MP gauge in the target frame.

`<hideTargetTpBar>`
Hides the TP gauge in the target frame.

## TAG EXAMPLES

`<hideTargetHpBar>`
This enemy's HP gauge is hidden in the target frame.