---
type: notetag
title: Hitbox Reveal
description: The tag setting how close the player must be for an enemy battler to reveal its hitbox outline.
tags: [pixel-abs, tag, enemy, event, hitbox, outline]
---

# Hitbox Reveal

## Description

Enemy battlers can optionally reveal a faint hitbox outline when the player is nearby, using the same battler AABB model
as combat collision.

Apply reveal range in either place:

- enemy note
- event comments on the battler page

If both exist, the event comment wins. If neither exists, the plugin parameter default is used.

## NOTE ABOUT A DEFAULT RANGE OF 0

If the default range is 0, then proximity-based outlines are disabled unless the always-active plugin parameter is
enabled.

## TAG USAGE

- Event comments, on the battler page.
- Enemies, as a default for that enemy.

## TAG FORMAT

`<hitboxReveal:N>`
Reveal this battler's hitbox outline while the player is within N tiles.

## TAG EXAMPLES

`<hitboxReveal:4.5>`
The outline is visible when the player is within 4.5 tiles.