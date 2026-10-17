---
type: notetag
title: Direct State Target
description: The tag defining the state that marks the priority target of a direct skill.
tags: [abs, tag, skill, targeting, direct, state]
---

# Direct State Target

## Description

When present on a `<direct>` skill, the targeting system will prioritize any opponent within `<proximity:N>` that is
currently afflicted with the specified state ID above all other targeting candidates.

This is designed for combo chains where the opening hit applies a "mark" state to the target, and subsequent hits in the
chain should snap to that marked target rather than the nearest foe. As long as the state is active and the target is
within proximity, the chain stays locked.

If the state expires, the target moves beyond proximity, or the state is cleansed, the skill falls through to the normal
priority chain.

## NOTE ABOUT REQUIREMENTS

Requires `<direct>` and `<proximity:N>` on the same skill.

## NOTE ABOUT RANGE

Proximity is always enforced. A marked target beyond range is not eligible.

## TAG USAGE

- Skills, on a `<direct>` skill.

## TAG FORMAT

`<directStateTarget:STATE_ID>`
Where STATE_ID is the ID of the state that marks the priority target.

## TAG EXAMPLES

`<directStateTarget:14>`
The state of id 14 marks the priority target for this skill.