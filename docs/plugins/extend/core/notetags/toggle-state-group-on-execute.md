---
type: notetag
title: Toggle State Group On Execute
description: The tag making a skill cycle its caster through a coupled group of states, one step per execution.
tags: [extend, tag, skill, state, toggle, stance, cycle]
---

# Toggle State Group On Execute

## Description

The [scalar toggle](toggle-state-on-execute.md) is fine for a single on/off flag, but it falls apart for a "stance A vs.
stance B" pair (or a longer cycle): tagging both states with `<toggleOnExecute>` flips each one independently, so if
anything outside this skill ever strips one of the two states out from under you, the pair can drift into both-active or
both-inactive and stay that way. This tag instead treats a whole list of states as one coupled group with exactly one
"active" member at a time, and self-repairs if that invariant is ever broken.

## NOTE ABOUT TRIGGERING

Same as `<toggleOnExecute>`: fires once at press-time, no chance roll, always triggers, and a skill may carry multiple
`<toggleGroupOnExecute>` tags to cycle several independent groups in one execution.

## NOTE ABOUT CYCLING

Within one group: if none of the listed states are active, the first one is added. If exactly one is active, it's
removed and the NEXT one in the list is added, wrapping back to the first after the last — so a longer list is a full
cycle, not just an A/B swap. If more than one is somehow active at once (state drift from some other effect), all of
them are removed and the group resyncs to the first entry rather than continuing to advance from a broken position.

## TAG USAGE

- Skills only.

## TAG FORMAT

`<toggleGroupOnExecute:[STATE_ID, STATE_ID, ...]>`
Where each STATE_ID is a member of the cycle, in the order they cycle through.

## TAG EXAMPLES

`<toggleGroupOnExecute:[12, 13]>`
A two-state stance swap: executing this skill flips from 12 to 13, or from 13 back to 12, always landing on exactly one
of the two.

`<toggleGroupOnExecute:[12, 13, 14]>`
A three-state cycle: 12 -> 13 -> 14 -> 12 -> ..., one step per execution.