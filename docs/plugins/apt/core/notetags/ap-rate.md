---
type: notetag
title: AP Rate
description: The tag for modifying the rate at which AP is gained.
tags: [ap, tag, modifier]
---

# AP Rate

## Description

Ever want an actor to earn AP faster (or slower) than everyone else?
Well now you can!
By applying the appropriate tag across the various database locations, you can boost or reduce how much AP that actor
actually banks from every gain.

## NOTE ABOUT INPUT VALUES

The format implies whole numbers like 30 (+30%), not actual multipliers like 1.3.

## NOTE ABOUT MULTIPLE TAGS

All matching tags across an actor's active note sources sum together before being applied as a single rate against the
raw AP amount- same pattern as `J-SDP`'s sdpMultiplier. 

## NOTE ABOUT SDP BONUSES

This also stacks with any SDP panel bonus for the "apr" parameter key, if `J-SDP` is loaded.


## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armors
- States

## TAG FORMAT

`<aptMultiplier:AMOUNT>`    (for positive)
`<aptMultiplier:-AMOUNT>`   (for negative)

## TAG EXAMPLES

`<aptMultiplier:25>`
An actor with something equipped/applied that has the above tag now gains 25% increased AP from every source.

`<aptMultiplier:80>`
`<aptMultiplier:-30>`
An actor with something equipped/applied that has both of the above tags now gains 50% increased AP (80 - 30 = 50).