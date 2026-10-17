---
type: notetag
title: Dodge Invincibility
description: The tags making the player fully or partially invincible while dodging.
tags: [abs, tag, skill, dodge, invincibility, iframes]
---

# Dodge Invincibility

## Description

Makes the player fully invincible for the entire dodge duration.

For partial invincibility (i-frames), specify a start and end frame.

## NOTE ABOUT DODGE DURATION

If the iframes window extends beyond the dodge duration, only the overlapping frames are counted.

## TAG USAGE

- Skills, of the dodge skill type.

## TAG FORMAT

`<invincibleDodge>`

`<iframes:[START_FRAME, END_FRAME]>`
Where START_FRAME is when invincibility begins.
Where END_FRAME is when invincibility ends.

## TAG EXAMPLES

`<invincibleDodge>`
This dodge makes the player fully invincible for the entire dodge duration.

`<iframes:[5, 20]>`
Invincibility begins at frame 5 and ends at frame 20 of this dodge.