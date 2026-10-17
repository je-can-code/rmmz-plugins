---
type: notetag
title: No Cast Previews (Per Battler)
description: The tag disabling cast previews for every skill a battler executes.
tags: [abs, tag, enemy, event, cast, preview, hitbox]
---

# No Cast Previews (Per Battler)

## Description

Disables cast previews for every skill this battler executes.

Place this on an enemy (in the database or as an event comment) to make all of that enemy's skills fire without any
hitbox preview. Good for boss enemies whose telegraphs should come from animation and sound rather than a hitbox
overlay.

## TAG USAGE

- Enemies
- Event comments, on an enemy event.

## TAG FORMAT

`<noCastPreviews>`

## TAG EXAMPLES

`<noCastPreviews>`
All of this enemy's skills fire without any hitbox preview.