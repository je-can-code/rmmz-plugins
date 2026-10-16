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

### Circle

A circle that grows in size with greater radius.

### Rhombus

A diamond that grows in size with greater radius.

### Arc

A forward-facing wedge. Like a rhombus, but the back half is omitted. The width of the arc at its widest point is
controlled by the `<degrees: VAL>` tag (see [Degrees](degrees.md)). Defaults to 180 degrees if omitted.

### Square

An equal square. The `<radius>` defines the length of each side.

### Line

A single 1-tile-wide line. The `<radius>` defines the line's length.

### Wall

A single 1-tile-tall horizontal wall. The `<radius>` defines its width. Think of it as an inverted line hitbox.

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