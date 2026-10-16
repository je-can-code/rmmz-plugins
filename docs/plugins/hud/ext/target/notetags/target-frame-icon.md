---
type: notetag
title: Target Frame Icon
description: The tag giving an enemy an icon ahead of its name in the target frame.
tags: [hud-target, tag, enemy, event, icon]
---

# Target Frame Icon

## Description

Have you ever wanted your JABS battlers to have an icon displayed in the target frame? Well now you can! By applying the
appropriate tags to either the enemy or the event that represents the enemy on the map, you too can have enemies with
flashy and meaningful icons in your target frame!

## NOTE ABOUT PRIORITY

If a tag exists on the enemy in the database AND on the event representing the same enemy, the event tag will take
priority and database tag will be ignored.

## NOTE ABOUT ICON PLACEMENT

The icon leads the target's name. If no target frame icon is available, the name simply starts where the icon would have
been.

## TAG USAGE

- Enemies
- Event comments, only applicable to JABS battlers.

## TAG FORMAT

`<targetFrameIcon:ICON_INDEX>`
Where ICON_INDEX is the icon index of the icon to display ahead of the enemy's name.

## TAG EXAMPLES

`<targetFrameIcon:25>`
When this enemy is struck on the map, the target frame will display an icon that matches the icon index of 25 ahead of
the enemy's name.