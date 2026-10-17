---
type: notetag
title: Action Poses
description: The tag swapping a battler's character sprite to a suffixed pose sheet for a while when it takes action.
tags: [abs-poses, tag, skill, item, sprite, pose]
---

# Action Poses

## Description

Ever want to have your characters visually perform actions on the map when doing things like attacking or casting a
spell? Well now you can! By applying the appropriate tags across the various database locations, you too can have
pseudo-animated character sprites when taking action!

## NOTE ABOUT TESTING

This is not a highly tested feature of JABS and may not work as intended.

## TAG USAGE

- Skills
- Items

## TAG FORMAT

`<poseSuffix:[SUFFIX,INDEX,DURATION]>`
Where SUFFIX is the suffix of the filename you want to swap out for.
Where INDEX is the index in the character file to become.
Where DURATION is the amount of frames to remain in this pose.

## TAG EXAMPLES

`<poseSuffix:[-spell,0,25]>`
As an example, if the character using the skill was a player with a character sprite named `Actor1`, the above tag
would look for `Actor1-spell` and swap to the 0th index (the upper left-most character) for 25 frames (which is about a
half second).