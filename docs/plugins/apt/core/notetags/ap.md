---
type: notetag
title: AP
description: The tag defining how many points a source yields upon defeat.
tags: [ap, tag, source]
---

# AP

## Description

Ever want to gain AP so that you could learn all those skills that various sources teach.
Well now you can!
By applying the appropriate tags onto enemies, you too can gain AP when chopping up enemies.

## NOTE ABOUT LEVEL DIFFERENCE

This only applies if using the `J-LevelMaster` and `J-ABS` plugins.
There is a limit by default that prevents AP from being gained when the actor level is too far above the enemy level.
This is a plugin parameter for your convenience. If you set the plugin parameter to -1, the functionality will be
disabled.

## TAG USAGE

- Enemies only.

## TAG FORMAT

`<ap:AMOUNT>`
Where AMOUNT is the amount of AP to be gained.

## TAG EXAMPLES

`<ap:6>`
This enemy will yield 6 AP upon defeat.