---
type: notetag
title: Move Speed
description: The tag defining an enemy's move speed as any numeric value, such as 3.7.
tags: [abs, tag, enemy, event, movement]
---

# Move Speed

## Description

Sometimes you want an enemy to move between 3 and 4 movespeed, because 3 to 4 is literally a 2x jump. To assign a value
like 3.7, use this.

## NOTE ABOUT EVENT PAGE SPEED

This will override whatever the native RMMZ event page is set to.

## NOTE ABOUT BALANCE

A good balance is usually between 3.5 and 4.5 for move speed.

## TAG USAGE

- Event comments, on an enemy event.

## TAG FORMAT

`<moveSpeed:SPEED>`
Where SPEED is the numeric value to set as the move speed.

## TAG EXAMPLES

`<moveSpeed:3.7>`
This enemy's move speed is set to 3.7.