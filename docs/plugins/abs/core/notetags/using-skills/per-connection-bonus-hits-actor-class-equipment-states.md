---
type: notetag
title: Per-Connection Bonus Hits (Actor / Class / Equipment / States)
description: The tags adding battler-side bonus hits per connection, stacking with the executing skill's own bonus hits.
tags: [abs, tag, actor, class, weapon, armor, state, enemy, hits]
---

# Per-Connection Bonus Hits (Actor / Class / Equipment / States)

## Description

These stack with `<bonus-hits:VAL>` on the executing skill.

### Formula Variant

All three of the above accept a bracketed formula instead of a flat integer, evaluated with `a` bound to the battler
carrying the tag.

## NOTE ABOUT FLOORING

As with the [skill-note version](../skills/per-connection-bonus-hits-skill-note.md), the final combined total is floored
once at the end -- formulas do not need their own `floor()` wrapper.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies

## TAG FORMAT

`<bonus-hits-global:VAL>`
Adds VAL to the per-connection bonus for every JABS action.

`<bonus-hits-basic:VAL>`
Adds VAL only when the action is a basic attack (mainhand/offhand for actors, or the enemy's designated basic attack
skill).

`<bonus-hits-skill:VAL>`
Adds VAL only for non-basic skills.

`<bonus-hits-global:[FORMULA]>`
`<bonus-hits-basic:[FORMULA]>`
`<bonus-hits-skill:[FORMULA]>`
Where FORMULA is a JS-style expression (e.g. `<bonus-hits-basic:[a.luk / 10]>`).

## TAG EXAMPLES

`<bonus-hits-global:1>`
Adds 1 to the per-connection bonus for every JABS action.

`<bonus-hits-basic:[a.luk / 10]>`
Adds the carrying battler's luk divided by 10, only when the action is a basic attack.