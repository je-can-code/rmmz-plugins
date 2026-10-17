---
type: notetag
title: Passive Motion
description: The tag declaring a motion on a state granted as a passive, which is J-Motion's own tag.
tags: [motion-passive, tag, passive, state, sprite, animation]
---

# Passive Motion

## Description

There is no tag of this plugin's own. Write [`J-Motion`'s](../../../core/notetags/motion.md) tag, as shown below. The
whole plugin is one more place the `<motion:...>` tag is honoured.

## TAG USAGE

- States, when they are being granted as passives.

## TAG FORMAT

`<motion:[TYPE]>`
`<motion:[TYPE, PARAM, ...]>`

## TAG EXAMPLES

`<motion:[scale,150]>`
A creature carrying this passive is half again its usual size. Useful on an affix, where the size IS the warning.

`<motion:[throb,80,0,0,0,90]>`
A creature carrying this passive pulses red, continuously, for as long as it has the passive.