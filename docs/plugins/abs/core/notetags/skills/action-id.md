---
type: notetag
title: Action Id
description: The tag associating a skill with an event on the action map.
tags: [abs, tag, skill, action, event]
---

# Action Id

## Description

Associate a skill with an event on the action map.

## NOTE ABOUT THE DEFAULT (no tag present)

Omitting this tag does not mean "no visual" -- it silently defaults to event id 1 on the action map. Whatever move route
THAT specific event happens to have will run regardless of how the skill's target got resolved, INCLUDING for
`<direct>`/`<directLock>` skills. Event id 1 has no special meaning to the engine itself -- it's just whatever event
your project happens to have authored at that id on your action map. In the sample/default project, event 1 is set up as
a melee swing anchored to the caster; if YOUR project's event 1 (or whatever id a skill defaults to) is likewise
caster-anchored, an untagged direct/ranged skill will visually -- and spatially, since collision checks against the
event's live position -- snap back to the caster every time, even though targeting resolved correctly. This looks
exactly like a targeting bug but isn't one; it's a missing `<actionId:N>`. Always set this tag explicitly on any skill
that isn't a plain melee swing, and check what move route your project's default-id event actually has before assuming
the targeting math is wrong.

## TAG USAGE

- Skills

## TAG FORMAT

`<actionId:EVENT_ID>`
Where EVENT_ID is the id of the event from the action map.

## TAG EXAMPLES

`<actionId:5>`
This skill is associated with the event of id 5 from the action map.