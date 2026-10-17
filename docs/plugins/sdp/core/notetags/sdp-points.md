---
type: notetag
title: SDP Points
description: The tag defining how many SDP points an enemy yields upon defeat, or an item grants or consumes when used.
tags: [sdp, tag, enemy, item, points]
---

# SDP Points

## Description

Ever wanted enemies to yield SDP points on defeat, or items that grant (or consume) SDP points when used? Well now you
can! By applying the same tag to either an enemy or an item, you too can define exactly how many SDP points that source
is worth.

## NOTE ABOUT ENEMIES

The value on an enemy is a straight reward yielded on defeat, same as exp or gold.

## NOTE ABOUT ITEMS

The value on an item is applied to the target actor when the item is used on them- an item can only ever affect actors
(using an SDP item on an enemy target does nothing), and only non-skill usable items are eligible. A negative VALUE
consumes points from the target instead of granting them.

## TAG USAGE

- Enemies
- Items

## TAG FORMAT

`<sdpPoints:VALUE>`
Where VALUE is the integer number of SDP points yielded (enemies) or granted/consumed (items). Can be negative on items.

## TAG EXAMPLES

`<sdpPoints:250>`
This enemy yields 250 SDP points upon defeat.

`<sdpPoints:100>`
Using this item on an actor grants them 100 SDP points.

`<sdpPoints:-50>`
Using this item on an actor consumes 50 of their SDP points.