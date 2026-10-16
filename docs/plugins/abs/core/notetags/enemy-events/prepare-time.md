---
type: notetag
title: Prepare Time
description: The tag defining how many frames an enemy without an Attack Speed trait waits before its first action.
tags: [abs, tag, enemy, ai, timing]
---

# Prepare Time

## Description

Every enemy has a "prepare" timer -- the number of frames they wait before taking their first action. This is
controlled by the "Attack Speed" trait in the database enemy editor. An enemy without that trait can set its prepare
time with this tag in its notes instead.

## NOTE ABOUT THE ATTACK SPEED TRAIT

When an enemy has both the trait and this tag, the trait wins and the tag is ignored.

## TAG USAGE

- Enemies only.

## TAG FORMAT

`<prepare:FRAMES>`
Where FRAMES is the number of frames to wait before first acting.

## TAG EXAMPLES

`<prepare:60>`
This enemy waits 60 frames before first acting, as long as it has no Attack Speed trait.