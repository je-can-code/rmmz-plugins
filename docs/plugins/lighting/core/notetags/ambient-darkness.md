---
type: notetag
title: Ambient Darkness
description: The tag declaring how much light a map has lost, and what colour the dark it leaves behind is.
tags: [lighting, tag, map, ambient, darkness]
---

# Ambient Darkness

## Description

Put a tag in a MAP's note box (Map Properties -> Note). A map's note is the right home for this because a map has no
pages, so there is no page comment for it to live in instead.

## NOTE ABOUT WHEN THE LIGHTS COME ON

A map's tag says what somewhere is like ORDINARILY. For a room whose lights can be switched on, use the
[Lights On](../commands/lights-on.md) plugin command- it withdraws the map's own darkness rather than arguing with it.

Declaring "no darkness" over the top would do nothing at all, because darkness compounds: none of it, compounded with
what is already there, is exactly what is already there.

Lights On lasts until the player next arrives on the map. Anything that should outlive a transfer is a switch and a
page, the same as any other lasting change to a room.

## TAG USAGE

- Maps, in the map's note box.

## TAG FORMAT

`<ambient:[DARKNESS]>`
`<ambient:[DARKNESS, COLOR]>`
Where DARKNESS is how much light is gone, from 0 to 100.
Where COLOR is a hex colour for the dark itself (OPTIONAL).

## TAG EXAMPLES

`<ambient:[60]>`
This map has lost 60% of its light. Dim, but navigable.

`<ambient:[100]>`
This map is pitch black. Only declared lights are visible.

`<ambient:[85, #0a2a2a]>`
This map has lost 85% of its light, and what is left reads teal rather than grey. Useful when the dark should belong to
the place.