---
type: notetag
title: Alerting
description: The tags configuring how an enemy reacts to being struck from outside its sight and pursuit range.
tags: [abs, tag, enemy, event, ai, alert]
---

# Alerting

## Description

When an enemy is struck from outside of its sight/pursuit range, it enters an "alerted" state. While alerted, it gains
heightened sight and pursuit and navigates to where it believes the attacker is. Use this functionality, or else enemies
can be cheaply defeated with ranged skills from outside their range. There are a few tags to configure it.

## TAG USAGE

- Event comments, on an enemy event.
- Enemies, as a default for that enemy.

## TAG FORMAT

`<alertDuration:DURATION>`
Where DURATION is the number of frames to remain alerted.

`<alertedSightBoost:RADIUS_BOOST>`
Where RADIUS_BOOST is bonus sight gained while alerted.

`<alertedPursuitBoost:RADIUS_BOOST>`
Where RADIUS_BOOST is bonus pursuit gained while alerted.

## TAG EXAMPLES

`<alertDuration:300>`
This enemy remains alerted for 300 frames.

`<alertedSightBoost:2>`
While alerted, this enemy sees 2 tiles further than usual.

`<alertedPursuitBoost:3>`
While alerted, this enemy pursues 3 tiles further than usual.