---
type: notetag
title: Enemy SDP Drops
description: The tag letting an enemy drop an SDP for unlocking across the party, at an integer percent chance.
tags: [sdp, tag, enemy, drop, jabs]
---

# Enemy SDP Drops

## Description

Ever want enemies to drop SDPs themselves for unlocking across the party? Well now you can! By applying the appropriate
tag to enemies in the database, you can have enemies drop any singular SDP at any integer percent chance you want them
to.

## NOTE ABOUT SDP DROPS AND JABS

This system was explicitly designed with JABS in mind. If you are not using JABS, you probably instead should just use
the [SDP Unlock](sdp-unlock.md) tag on an item that the enemy drops for similar functionality. This functionality will
dynamically generate the loot for the SDP being unlocked with no database backing and unlock it upon pickup- which would
be incompatible outside of JABS.

## TAG USAGE

- Enemies only.

## TAG FORMAT

`<sdpDropData:[SDP_KEY, DROP_CHANCE]>`
Where SDP_KEY is the unique string key for the SDP to unlock.
Where DROP_CHANCE is the 1-100 percent chance that the SDP will drop.

## TAG EXAMPLES

`<sdpDropData:[ORC_1, 5]>`
The enemy with this tag will drop an SDP with the key of "ORC_1" upon defeat 5% of the time.

`<sdpDropData:[GOB_4, 100]>`
The enemy with this tag will drop an SDP with the key of "GOB_4" upon defeat 100% of the time- aka guaranteed drop upon
defeat.