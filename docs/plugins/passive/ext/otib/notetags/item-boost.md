---
type: notetag
title: Item Boost
description: The tag making an item permanently grant passive states to the actor that consumes it.
tags: [passive-otib, tag, item, state, passive]
---

# Item Boost

## Description

To make an item grant permanent passive states when consumed, apply the following notetag to the item in the database.

## TAG USAGE

- Items, consumable, with the "All" or "Battle / Menu" occasion.

## TAG FORMAT

`<otib:[STATE_ID]>`
`<otib:[STATE_ID, STATE_ID, ...]>`
Where STATE_ID is the numeric id of a database State.
Multiple ids are supported; all will be unlocked on first consume.

## TAG EXAMPLES

`<otib:[42]>`
Consuming this item permanently grants State 42 as a passive.

`<otib:[42, 55]>`
Consuming this item permanently grants both State 42 and State 55.