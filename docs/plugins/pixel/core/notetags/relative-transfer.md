---
type: notetag
title: Relative Transfer
description: The tag landing a transfer from an area as far along its destination as the player crossed the area.
tags: [pixel, tag, event, area, transfer]
---

# Relative Transfer

## Description

A transfer from an area can remember where along it the player crossed, and land them just as far along on the other
side.

## NOTE ABOUT MATCHING OPENINGS

The two maps' openings should line up tile for tile. A landing that would fall off the destination map lands on its edge
instead, and a warning in the console names the transfer.

## TAG USAGE

- Event comments, on a map event's page, alongside [`<areaEvent>`](area-event.md).

## TAG FORMAT

`<relativeTransfer>`
Point the page's Transfer Player at where the event's own tile should land. Every other tile of the area lands the same
distance along, so walking off a wide edge arrives at the matching spot on the next map.

## TAG EXAMPLES

`<areaEvent:[20, 1]>`
`<relativeTransfer>`
Crossing eight tiles from the event lands the player eight tiles to the right of where the Transfer Player points.