---
type: notetag
title: Refresh Config Overrides
description: The tags overriding the refresh reapply settings for an individual state.
tags: [abs, tag, state, reapply, refresh]
---

# Refresh Config Overrides

## TAG USAGE

- States

## TAG FORMAT

`<stateRefreshDiminish:VAL>`
Frames shaved off each successive refresh (diminishing returns).

`<stateRefreshReset:VAL>`
Frames of quiet time after which diminish resets back to zero.

## TAG EXAMPLES

`<stateRefreshDiminish:60>`
60 frames are shaved off each successive refresh of this state.

`<stateRefreshReset:300>`
After 300 frames of quiet time, this state's diminish resets back to zero.