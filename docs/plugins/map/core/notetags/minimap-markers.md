---
type: notetag
title: Minimap Markers
description: The tags revealing particular events on the minimap as a marker of a chosen category.
tags: [map, tag, event, minimap, marker]
---

# Minimap Markers

## Description

Have you ever wanted your minimap to reveal particular events as one of a few categories, like NPCs, loot, or
interactable objects? Well now you can! By adding the appropriate tags to the desired events inside a comment event
command, you too can have your minimap decorated with additional markers!

## NOTE ABOUT MARKER TYPES

There are multiple marker types that show up on the minimap, here is a brief description of all of them:

- Player

  The player is a teal plus-shape marker.
- Follower

  The followers of the player are sky-blue square markers.
- JABS Enemy (hostile)

  Does not show up at all if not using JABS. Rendered as a red diamond.
- JABS Enemy (inanimate)

  Enemy-backed but non-combative objects (pots, crates). Rendered as an orange diamond.
- NPC

  An NPC event marker is rendered as a bright purple circle shape.
- Loot

  A loot event marker is rendered as a bright green diamond shape.
- Interactable Object

  An object event marker is rendered as a yellow diamond shape.
- Teleport

  A hollow light-blue square. Stretches across a multi-tile teleport zone from `J-Pixelistics`'
  [`<areaEvent>`](../../../pixel/core/notetags/area-event.md) (see
  [Teleport zone size](../overview.md#teleport-zone-size)).
- Quest Offer

  A yellow square marking a quest available to accept.
- Quest Progress

  A blue diamond marking where to advance a quest's next objective.
- Quest Turn-In

  A green circle marking where to complete/turn in a quest.

## NOTE ABOUT MULTIPLE TAGS

If multiple marker tags are present on a single event, the last one found will be prioritized.

## TAG USAGE

- Event comments, on an event on the map.

## TAG FORMAT

`<minimap:MARKER_TYPE>`
`<mm:MARKER_TYPE>`
Where MARKER_TYPE is one of "`npc`", "`loot`", "`object`", "`teleport`", "`questOffer`", "`questProgress`", or
"`questTurnIn`" (without quotes).

## TAG EXAMPLES

`<minimap:npc>` or `<mm:npc>`
An event with this tag will show up as an NPC marker on the minimap.

`<minimap:loot>` or `<mm:loot>`
An event with this tag will show up as a loot marker on the minimap.

`<minimap:object>` or `<mm:object>`
An event with this tag will show up as an object marker on the minimap.

`<minimap:teleport>` or `<mm:teleport>`
An event with this tag will show up as a hollow-square teleport marker.