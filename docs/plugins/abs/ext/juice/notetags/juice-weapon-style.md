---
type: notetag
title: Juice Weapon Style
description: The tag selecting which tilt/swing multiplier row of the juice config a skill uses.
tags: [abs-juice, tag, skill, overlay, profile]
---

# Juice Weapon Style

## Description

Selects a multiplier row from the [`profiles`](../overview.md#field-reference) map in `config.jabs.json` → `juice`.
Keys are arbitrary identifiers (letters, digits, underscore, dash) and must already exist in the `profiles` map.

When omitted, inferred keys match the swing icon row: weapon rows use the string weapon type id (e.g. `wtypeId` 1 →
`"1"`); armor rows use `"a"` + armor type id (e.g. `atypeId` 4 → `"a4"`) so armor buckets never collide with weapon
type ids.

## TAG USAGE

- Skills

## TAG FORMAT

`<jabsJuiceWeaponStyle:key>`
Where key is the name of a row in the `profiles` map.

## TAG EXAMPLES

`<jabsJuiceWeaponStyle:heavy>`
This skill uses the `heavy` row of the `profiles` map.