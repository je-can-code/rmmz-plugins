---
type: notetag
title: Target Frame Text
description: The tag giving an enemy an extra line of text in the target frame.
tags: [hud-target, tag, enemy, event, text]
---

# Target Frame Text

## Description

Have you ever wanted your JABS battlers to have an extra line of text that gives some sort of context to that particular
enemy? Well now you can! By applying the appropriate tags to either the enemy or the event that represents the enemy on
the map, you too can have meaningful text in your target frame!

## NOTE ABOUT PRIORITY

If a tag exists on the enemy in the database AND on the event representing the same enemy, the event tag will take
priority and database tag will be ignored.

## NOTE ABOUT GAUGE PLACEMENT

If no target frame text is available, the gauges will automatically move up slightly to prevent it from looking strange
with the extra space (if you are using the gauges).

## TAG USAGE

- Enemies
- Event comments, only applicable to JABS battlers.

## TAG FORMAT

`<targetFrameText:TEXT>`
Where TEXT is the extra line of text to display for this enemy.

## TAG EXAMPLES

`<targetFrameText:I'm the coolest ghosty ever.>`
When this enemy is struck on the map, the target frame will display the above provided text of "I'm the coolest ghosty
ever." between the name and the gauges (if present).