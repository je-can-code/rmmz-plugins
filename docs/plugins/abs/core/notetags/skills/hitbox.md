---
type: notetag
title: Hitbox
description: The tag defining the shape of collision for a skill.
tags: [abs, tag, skill, hitbox, shape]
---

# Hitbox

## Description

The hitbox defines the shape of collision for this skill. The hitbox is always centered on the action event (with some
exceptions).

A skill with no hitbox tag collides as a circle, and its cast preview draws as one too.

### Circle

A circle that grows in size with greater radius.

### Rhombus

A diamond that grows in size with greater radius.

### Arc

A forward-facing wedge. Like a rhombus, but the back half is omitted. The width of the arc at its widest point is
controlled by the `<degrees: VAL>` tag (see [Degrees](degrees.md)). Defaults to 180 degrees if omitted.

### Square

An equal square, `2 × radius + 1` tiles to a side.

### Line

A line reaching forward from the action. The `<radius>` defines the line's length, and it is 1 tile wide unless
`<thickness>` says otherwise (see [Thickness](thickness.md)).

### Wall

A bar directly ahead of the action, `2 × radius + 1` tiles across and 1 tile deep unless `<thickness>` says otherwise.
Think of it as an inverted line hitbox.

### Cross

The combination of line and wall in one cross shape. The `<radius>` determines how far each arm of the cross reaches.

## NOTE ABOUT MULTIPLE PROJECTILES

If this skill has multiple projectiles, all share the same hitbox shape.

## TAG USAGE

- Skills

## TAG FORMAT

`<hitbox:circle>`

`<hitbox:rhombus>`

`<hitbox:arc>`

`<hitbox:square>`

`<hitbox:line>`

`<hitbox:wall>`

`<hitbox:cross>`

## TAG EXAMPLES

`<hitbox:circle>`
This skill's hitbox is a circle that grows in size with greater radius.