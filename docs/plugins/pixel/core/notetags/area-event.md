---
type: notetag
title: Area Event
description: The tag stretching an event's page into a rectangle of tiles, any of which counts as reaching the event.
tags: [pixel, tag, event, area]
---

# Area Event

## Description

An event normally stands on exactly one tile. A comment on one of its pages can stretch that into a rectangle, so
stepping onto any tile of it counts as reaching the event: one wide exit along a map's edge, rather than a row of
identical events.

An area belongs to the page that declares it, so a page without the tag covers one tile again. It changes where the
event counts as standing, never the size of its body.

## TAG USAGE

- Event comments, on a map event's page.

## TAG FORMAT

`<areaEvent:[WIDTH, HEIGHT]>`
Where WIDTH and HEIGHT are whole tiles, counted rightward and downward from the tile the event itself stands on. Both
must be at least 1.

## TAG EXAMPLES

`<areaEvent:[5, 1]>`
This page covers the event's own tile and the four to the right of it.