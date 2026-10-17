---
type: notetag
title: SDP Multipliers
description: The tag for modifying the rate at which SDP points are gained.
tags: [sdp, tag, modifier]
---

# SDP Multipliers

## Description

Ever want allies to gain some percentage amount more (or less) of the SDP points earned from enemies? Well now you can!
By applying the appropriate tag to the various database locations applicable, you can gain a percentage bonus/penalty
amount of SDP points obtained!

## NOTE ABOUT INPUT VALUES

The format implies that you will be providing whole numbers and not actual multipliers, like 1.3 or something.

## NOTE ABOUT MULTIPLE TAGS

If multiple tags are present across the various database locations on a single actor, they will stack additively. SDP
points cannot be reduced below 0 for an actor, but they most certainly can receive negative amounts if the tags added up
like that.

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- States

## TAG FORMAT

`<sdpMultiplier:AMOUNT>`    (for positive)
`<sdpMultiplier:-AMOUNT>`   (for negative)

## TAG EXAMPLES

`<sdpMultiplier:25>`
An actor with something equipped/applied that has the above tag will now gain 25% increased SDP points.

`<sdpMultiplier:80>`
`<sdpMultiplier:-30>`
An actor with something equipped/applied that has both of the above tags will now gain 50% increased SDP points
(80 - 30 = 50).