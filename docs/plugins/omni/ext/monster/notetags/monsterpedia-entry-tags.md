---
type: notetag
title: Monsterpedia Entry Tags
description: The tags customizing how an enemy appears, or whether it appears at all, in the Monsterpedia.
tags: [omni-monster, tag, enemy, monsterpedia, icon, description]
---

# Monsterpedia Entry Tags

## Description

A handful of tags customize how an enemy appears (or doesn't) in the Monsterpedia.

## TAG USAGE

- Enemies

## TAG FORMAT

`<hideFromMonsterpedia>`
Excludes this enemy entirely from the Monsterpedia entry list.

`<monsterFamilyIcon:ICON_INDEX>`
Sets the icon index representing this enemy's monster family/category in the Monsterpedia listing.

`<descriptionLine:TEXT>`
Adds one line of flavor-text description to this enemy's Monsterpedia detail view. Multiple tags on the same enemy each
add another line.

## TAG EXAMPLES

`<hideFromMonsterpedia>`
This enemy (a story-only or hidden boss, perhaps) never appears in the Monsterpedia listing.

`<monsterFamilyIcon:64>`
This enemy's family icon in the Monsterpedia listing is icon 64.

`<descriptionLine:A lumbering beast of the northern peaks.>`
`<descriptionLine:Known to hoard shiny objects.>`
This enemy's Monsterpedia detail view shows both lines of description, one per tag, in the order they appear on the
note.