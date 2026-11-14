---
type: notetag
title: Unparryable
description: The tag turning off implicit (passive) parry for a skill.
tags: [abs, tag, skill, parry]
---

# Unparryable

## Description

Turns off implicit (passive) parry for a skill. The defender's pressure roll can neither parry it outright nor turn it
into a glancing blow.

Explicit parry still works: a timed `<parry>` window negates the skill like any other hit, and a held `<guard>` still
reduces it. See [Guarding](guarding.md).

## TAG USAGE

- Skills

## TAG FORMAT

`<unparryable>`

## TAG EXAMPLES

`<unparryable>`
This skill is never passively parried or glanced; a timed parry still stops it.