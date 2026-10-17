---
type: notetag
title: Direct Lock
description: The tag making a direct skill lock onto the target's live position at the moment the skill fires.
tags: [abs, tag, skill, targeting, direct]
---

# Direct Lock

## Description

Similar to `<direct>`, but locks onto the target's live position at the moment the skill fires rather than when it was
decided. This removes the dodge window -- the action will always originate right on top of the target regardless of how
far they moved during the cast.

Use this for skills that should feel guaranteed and inescapable, like a debuff that snaps to the target even if they
teleport mid-cast.

## NOTE ABOUT WHAT IS AND IS NOT AVOIDABLE

The placement is what cannot be dodged, not the aftermath. The hitbox drops onto wherever the target stands at the
instant of firing, and then stays on that tile for the rest of the action's `<duration:N>`. A target that keeps moving
cannot escape the drop, but can absolutely walk out of a lingering zone before it finishes ticking -- which is what
makes this the right tag for telegraphed ground effects. Give the skill no `<duration:N>` and it resolves in a single
burst instead, which is what you want for something that should simply always connect.

## NOTE ABOUT PRECEDENCE

`<directLock>` and `<direct>` are mutually exclusive. If both are present on a skill, `<directLock>` takes precedence.

## NOTE ABOUT ACTION ID

Same pitfall as [`<direct>`](direct.md) -- set `<actionId:N>` explicitly, or an untagged skill defaults to event 1 and
inherits whatever move route it has (see [Action Id](action-id.md)).

## TAG USAGE

- Skills

## TAG FORMAT

`<directLock>`

## TAG EXAMPLES

`<directLock>`
This skill locks onto the target's live position at the moment the skill fires rather than when it was decided.