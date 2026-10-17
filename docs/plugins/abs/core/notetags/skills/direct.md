---
type: notetag
title: Direct
description: The tag making a skill lock onto the nearest valid target rather than firing a flying map projectile.
tags: [abs, tag, skill, targeting, direct]
---

# Direct

## Description

With the "direct" tag, the skill locks onto the nearest valid target within `<proximity:N>` rather than firing a flying
map projectile. The hitbox event is spawned at the resolved target's tile and stays there. The skill still obeys CAST
TIME, RADIUS, HITBOX, and other tags.

`<direct>` requires `<proximity:N>` on the same skill. Proximity defines the maximum range at which a target can be
locked onto.

Target selection priority (highest to lowest):

1. Opponent carrying the `<directStateTarget:N>` state (if configured).
2. Non-inanimate explicit target or last-hit within range.
3. Closest non-inanimate opponent found via proximity scan.
4. Inanimate fallback (explicit target or last-hit within range).

## NOTE ABOUT PARRYING

A "direct" skill can still be parried if all parry conditions are met.

## NOTE ABOUT DODGING

By default, a direct skill snapshots the target's position when the decision is made. If the target moves during the
cast window, the action will fire at where the target was, not where they are now. This gives a skilled player a window
to dodge by moving away during the cast. If you want to remove that window, use [`<directLock>`](direct-lock.md).

## NOTE ABOUT ACTION ID

A direct skill still spawns a real action-map event once a target resolves -- it is not a pure math-only effect. Always
pair it with an explicit `<actionId:EVENT_ID>` pointing at an event whose move route actually suits a direct skill (e.g.
"stays put"). Leaving this tag off silently defaults to event id 1 -- and whatever move route YOUR project has authored
at that id is what runs. In the sample/default project, event 1 is anchored back to the caster (a melee swing), so an
untagged direct skill there will visually AND spatially snap back to the caster on every cast regardless of how
correctly the target resolved -- see [Action Id](action-id.md).

## TAG USAGE

- Skills

## TAG FORMAT

`<direct>`

## TAG EXAMPLES

`<direct>`
This skill locks onto the nearest valid target within its `<proximity:N>` rather than firing a flying map projectile.