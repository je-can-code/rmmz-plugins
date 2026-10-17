---
type: notetag
title: Death Motion
description: The tags choosing how an enemy collapses when it is defeated, or suppressing the collapse entirely.
tags: [motion-abs, tag, enemy, state, death]
---

# Death Motion

## Description

There are three styles, and they are speeds as much as shapes:

- `swift`: a quick vertical squash. Trash mobs, gone in half a second.
- `moderate`: a topple, falling and fading. Something worth having fought.
- `slow`: a long shimmering sink. Something whose death is a moment.

## NOTE ABOUT WHICH ONE WINS

A battler's states are consulted first, and among several the one with the highest state PRIORITY as set in the editor
wins. Failing that, the enemy's own note. Failing that, the [configured default](../overview.md#death-pacing).

That order is what makes affixes work without authoring anything twice- affixes are states, so an elite version of an
ordinary creature dies harder purely because of what is stuck to it.

`<noDeathMotion>` outranks all of it, from either a state or the enemy. A boss that runs its own scripted collapse does
not want a generic one underneath, and definitely does not want its corpse held open for the extra frames.

## TAG USAGE

- Enemies
- States

## TAG FORMAT

`<deathMotion:STYLE>`
Where STYLE is one of the three above.

`<noDeathMotion>`
Suppresses the animation entirely, and the delay that comes with it.

## TAG EXAMPLES

`<deathMotion:slow>`
This enemy takes its time dying.

`<noDeathMotion>`
This enemy leaves the map the instant it is defeated, as it always did.