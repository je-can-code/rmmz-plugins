---
type: notetag
title: Event Passives
description: The event comment tag granting passive states to the battler spawned from a map event.
tags: [passive, tag, event, enemy]
---

# Event Passives

## Description

Have you ever wanted a map event to force a spawned enemy to have specific passive state ids- without needing to create
a duplicate enemy in the database? Well now you can! By applying the passive tag to an event comment, you too can inject
passive states onto that spawned battler.

## TAG USAGE

- Event comments

## TAG FORMAT

`<passive:[STATE_IDS]>`
Where STATE_IDS is a comma-delimited list of state ids to be applied.

## TAG EXAMPLES

`<passive:[10,11]>`
Applies passive states 10 and 11 to the battler spawned from this page.