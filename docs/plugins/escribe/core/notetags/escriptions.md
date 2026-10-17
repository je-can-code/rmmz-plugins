---
type: notetag
title: Escriptions
description: The tags placing text and/or an icon over an event, optionally visible only while the player is near.
tags: [escribe, tag, event, text, icon, proximity]
---

# Escriptions

## Description

In order to utilize this functionality, add a comment to an event with one of the following tags below to create
text/icons that show up on the event.

## NOTE ABOUT PROXIMITY TAGS

Proximity tags are optional. If they are not added to the event alongside the text or icon tag, then the text/icon will
always be visible while the event is visible on the map.

## TAG USAGE

- Event comments, on an event.

## TAG FORMAT

`<text:EVENT_TEXT>`
Where EVENT_TEXT is whatever text you want to show on this event.

`<icon:ICON_INDEX>`
Where ICON_INDEX is the icon index of the icon to show on this event.

`<proximityText:DISTANCE>`
Where DISTANCE is the distance in tiles/squares that the player must be within in order to see the text on this event.
DISTANCE is required- to require the player stand directly on the event, use `<proximityText:0>` explicitly.

`<proximityIcon:DISTANCE>`
Where DISTANCE is the distance in tiles/squares that the player must be within in order to see the icon on this event.
DISTANCE is required- to require the player stand directly on the event, use `<proximityIcon:0>` explicitly.

## TAG EXAMPLES

`<text:Welcome>`
This event shows the text "Welcome" over it.

`<icon:12>`
This event shows the icon of index 12 over it.

`<proximityText:3>`
The text on this event is only visible while the player is within 3 tiles of it.

`<proximityIcon:0>`
The icon on this event is only visible while the player stands directly on it.