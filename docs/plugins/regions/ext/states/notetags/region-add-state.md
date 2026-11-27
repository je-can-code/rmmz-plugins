---
type: notetag
title: Region Add State
description: The tag making the tiles of a region id periodically apply a state to whoever is standing there.
tags: [regions-states, tag, map, region, state]
---

# Region Add State

## Description

Have you ever wanted to set some regionIds to apply states to characters on the map? Well now you can! By applying the
appropriate tags to the map properties, you too can have states repeatedly applied to various battlers on the map!

## NOTE ABOUT DUPLICATE TAGS

Duplicate tags are allowed, in that they will stack not in effectiveness, but instead in application. Having multiple
tags for the same region, and even the same stateId, will tell the plugin to simply attempt to apply the state multiple
times.

## NOTE ABOUT STATE APPLICATIONS

The CHANCE component of the tag as described below is the authored chance of applying the state. A region's state is one
the battler standing there gives itself, so that battler both rolls for the state and receives it, and the chance is
built up the way every state application's chance is, as
[State-Application Immunity & Resistance](../../../../abs/core/notetags/states/state-application-immunity-resistance.md)
describes:

```
1. The CHANCE, as a percent.
2. The battler's own State Rate traits for that state.
3. The battler's own <stateTypeResist> for each type the state carries.
```

A battler holds no luck over itself, so LUK leaves the chance where it is. A weakness raises the chance just as a
resistance lowers it: a battler with a State Rate of 1000% for a state can be certain to receive it from a tag under
100%.

The result is rounded to a whole percent and rolled with the battler's own fate, counted once, as
[On-Chance Roll Manipulation](../../../../abs/core/notetags/skills/on-chance-roll-manipulation-lucky-cursed-rolls.md)
describes: its battler-wide lucky and cursed rolls, since a region carries no skill, along with its `<veryLucky>`,
`<veryCursed>`, Accumulate Mode and Encore.

Every landing adds the state through `J-ABS`, exactly as any other application of it would, credited to the battler
standing there. The battler's immunities are checked on every landing, and a battler that does not carry the state yet
starts it fresh. A battler that already carries it, from an earlier landing or from anywhere else, has it reapplied by
the state's own reapply strategy, refreshed, extended or stacked, as
[Stack Type](../../../../abs/core/notetags/states/stack-type.md) describes.

## NOTE ABOUT ANIMATION IDS

It is important to note that large amounts of animations playing on the screen simultaneously is incredibly
non-performant. Do be cautious when slapping these tags on maps with the ANIMATION_ID value provided. It may be a good
idea to consider using low percentage of application when also using the ANIMATION_ID functionality so it does not
trigger constantly.

## TAG USAGE

- Maps, in the map's Properties.

## TAG FORMAT

`<regionAddState:[REGION_ID, STATE_ID, CHANCE?, ANIMATION_ID?]>`
Where REGION_ID is the region that can apply the state.
Where STATE_ID is the state being applied by the region.
Where CHANCE? is an 1-100 integer chance of applying the state.
(the CHANCE can be omitted and it will default to 100% application chance)
(if setting an animation id is desired, CHANCE cannot be omitted)
Where ANIMATION_ID? is the id of the animation to play upon application.
(the ANIMATION_ID can be omitted and it will default to no animation)

## TAG EXAMPLES

`<regionAddState:[1, 3, 25, 4]>`
A tile marked with the region id of 1, will apply state of id 3, with a (default) 25% chance of success. The animation
of id 4 will be played on the character upon application.

`<regionAddState:[1, 3, 25]>`
`<regionAddState:[1, 4, 30]>`
`<regionAddState:[1, 4, 50]>`
`<regionAddState:[2, 4, 100]>`
A tile marked with the region id of 1, will apply state 3 at 25% chance, will apply state 4 at 30% chance, and again
apply state 4 at a higher 50% chance.
A tile marked with the region id of 2 will apply state 4 at a 100% chance.
No animations will play upon application of any of these states.

`<regionAddState:[12, 40]>`
A tile marked with region id of 12 will apply state of id 40 with 100% chance while the player continues to stand upon
it.