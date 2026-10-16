---
type: notetag
title: Toggle State On Execute
description: The tag making a skill flip a state on or off on its caster each time it executes, for stance skills.
tags: [extend, tag, skill, state, toggle, stance]
---

# Toggle State On Execute

## Description

Have you ever wanted a "stance" skill — one that flips a state on when it's off, and flips it off when it's on, using
the same skill both ways? This tag does exactly that: it fires once when the skill executes (not per-hit), checks
whether the caster currently has the tagged state, and toggles it.

## NOTE ABOUT TIMING

This fires once at press-time, the same as the [on-cast self-state tags](state-reaction-effects.md) — it does not
require (or care about) a successful hit against a target.

## NOTE ABOUT CHANCE

There is no chance roll; this always triggers when the skill executes.

## NOTE ABOUT MULTIPLE TAGS

A skill may carry multiple `<toggleOnExecute>` tags to flip several states in a single execution. Each STATE_ID is
evaluated independently: if the caster has it, it's removed; if not, it's added.

## TAG USAGE

- Skills only.

## TAG FORMAT

`<toggleOnExecute:STATE_ID>`
Where STATE_ID is the id of the state to toggle on the caster.

## TAG EXAMPLES

`<toggleOnExecute:12>`
Executing this skill removes state id 12 from the caster if they have it, or adds it if they don't — toggling a stance
on/off with one skill.

`<toggleOnExecute:12>`
`<toggleOnExecute:13>`
Executing this skill independently toggles both state id 12 and state id 13.