---
type: notetag
title: Shield Priority
description: The tag ordering which of a battler's shields is consumed first.
tags: [abs-shield, tag, state, shield, priority]
---

# Shield Priority

## Description

Have you ever wanted to force your shields to be consumed in a particular order? Well now you can! By applying the
shield priority tag to the various shield states, you too can have deterministically controlled shield consumption!

## NOTE ABOUT DUPLICATE PRIORITY

If multiple shields have the same priority, then the timestamp at which they were applied will be deferred to as a
tie-breaker for determining which should come first.

## TAG USAGE

- States

## TAG FORMAT

`<shieldPriority:PRIORITY>`
Where PRIORITY is an integer that represents the priority of the shield state. Shield states with higher priority will
be consumed first.

## TAG EXAMPLES

`<shieldPriority:5>` (on stateA)
`<shieldPriority:10>` (on stateB)
`<shieldPriority:1>` (on stateC)
When afflicted with stateA, stateB, and stateC, the shields will be consumed in the order of priority, with stateB
consuming first, followed by stateA, and finally stateC (because 10 > 5 > 1).