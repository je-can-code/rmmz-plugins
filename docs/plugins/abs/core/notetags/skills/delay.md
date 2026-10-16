---
type: notetag
title: Delay
description: The tag allowing a skill to sit on the map for a duration before triggering.
tags: [abs, tag, skill, delay, trap]
---

# Delay

## Description

Allows a skill to sit on the map for a duration before triggering. Think time bombs or landmines. Set DURATION to -1 to
never detonate until touched.

## NOTE ABOUT INDEFINITE DELAY

If DURATION is -1, set TOUCHABLE to true, or the action will sit there forever and never trigger.

## TAG USAGE

- Skills

## TAG FORMAT

`<delay:[DURATION,TOUCHABLE,TRIGGER_RADIUS?]>`
Where DURATION is frames to exist before detonating.
Where TOUCHABLE is true/false for whether touching it triggers it.
Where TRIGGER_RADIUS (optional) is a tile radius used ONLY for touch-arming during the delay window. When omitted,
touch-triggering falls back to the action's normal hitbox. This lets the touch-trigger space be smaller (or larger) than
the eventual detonation/hitbox size- e.g. a mine that's only steppable-on within 1 tile, but explodes across a much
bigger AoE once it actually goes off.

## TAG EXAMPLES

`<delay:[300,true]>`
Sits on the map for 300 frames (~5 seconds). Any enemy who walks into it (within the action's normal hitbox) triggers
the action.

`<delay:[300,true,1]>`
Same as above, but only touch-arms within 1 tile- the detonation itself still uses whatever AoE the skill's own hitbox
tags define.