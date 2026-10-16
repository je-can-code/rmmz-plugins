---
type: notetag
title: SDP Unlock
description: The tag making an item unlock an SDP upon use, in addition to whatever else it does.
tags: [sdp, tag, item, unlock]
---

# SDP Unlock

## Description

Ever wanted items used to unlock SDPs? Well now you can! By applying the necessary tags onto items in the database, you
too can have items that will function as SDP unlockers (in addition to whatever else they do).

## TAG USAGE

- Items only.

## TAG FORMAT

`<sdpUnlock:SDP_KEY>`
Where SDP_KEY is the unique string key for the SDP to unlock.

## TAG EXAMPLES

`<sdpUnlock:ORC_1>`
An item used with this tag on it will unlock the SDP with the key of "ORC_1" upon use- in addition to its other
effects.

`<sdpUnlock:GOB_4>`
An item used with this tag on it will unlock the SDP with the key of "GOB_4" upon use- in addition to its other
effects.