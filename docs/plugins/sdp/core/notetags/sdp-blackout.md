---
type: notetag
title: SDP Blackout
description: The tag switching off every panel an actor has ranked while the actor carries it.
tags: [sdp, tag, state]
---

# SDP Blackout

## Description

Switches off every panel an actor has ranked, for as long as the actor carries it. No core parameter, ex- or
sp-parameter, max TP or catalog-key bonus (critical damage, drops, shields, resources, proficiency, AP, SDP gain) is
granted until the source is gone. Ranks, points and unlocks are untouched, so nothing is lost, and ranking up during a
blackout still works: the new rank lights up with the rest when it ends.

## NOTE ABOUT HP, MP AND TP

Max HP, MP and TP shrink with everything else. The engine trims the current values to fit the moment the source lands,
and lifting it restores the maximums but never what was trimmed. That is deliberate: a blackout costs something.

## NOTE ABOUT MASTERIES

Masteries are learned skills, not panels, so a blackout leaves them on.

## TAG USAGE

- States
- Actors
- Classes
- Weapons
- Armors
- Skills

## TAG FORMAT

`<sdpBlackout>`

## TAG EXAMPLES

`<sdpBlackout>`
On a 15-second state, the afflicted actor fights on their base stats alone for those 15 seconds.