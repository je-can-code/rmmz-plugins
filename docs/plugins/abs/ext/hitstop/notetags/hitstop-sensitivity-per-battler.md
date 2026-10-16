---
type: notetag
title: Hitstop Sensitivity (Per Battler)
description: The tag scaling how much hitstop a battler experiences when they are the one being hit.
tags: [abs-hitstop, tag, actor, enemy, hitstop]
---

# Hitstop Sensitivity (Per Battler)

## Description

Scales how much hitstop a battler experiences when they are the one being hit. This is read from the TARGET's own
database data, not the skill.

## NOTE ABOUT THE DEFAULT SCALE

Without this tag, a battler defaults to 100% (no scaling).

## TAG USAGE

- Actors
- Enemies

## TAG FORMAT

`<hitstopScale:P%>`
Where P is the percent scale to apply against the resolved duration.

## TAG EXAMPLES

`<hitstopScale:50%>`
This battler experiences half the normal hitstop duration whenever they are hit- great for giving small/fast enemies a
snappier feel, or heavily armored bosses a duller, less-interruptible one.

`<hitstopScale:0%>`
This battler never experiences hitstop when hit, regardless of the attacking skill's own tags.