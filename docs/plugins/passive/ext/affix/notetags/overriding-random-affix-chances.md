---
type: notetag
title: Overriding Random Affix Chances
description: The tags overriding the percent chance a prefix or suffix rolls, for one enemy or for one spawn point.
tags: [passive-affix, tag, enemy, event, affix, rng, chance]
---

# Overriding Random Affix Chances

## Description

Have you ever wanted a particular enemy (or a single spawn point on the map) to have a much higher (or lower) chance of
rolling an affix? Well now you can! By applying these chance tags to an enemy note or event comment, you too can
override the percent chance for that slot.

## NOTE ABOUT MULTIPLE TAGS

Multiple chance tags on an event page are allowed; the last one wins.

## NOTE ABOUT PRECEDENCE

Event comment chance overrides take priority over enemy note overrides.

## TAG USAGE

- Enemies
- Event comments, on the page that spawns the enemy.

## TAG FORMAT

`<passive-affix-prefix-chance:PERCENT>`
`<passive-affix-suffix-chance:PERCENT>`
Where PERCENT is 0–100 (decimals allowed).

## TAG EXAMPLES

`<passive-affix-prefix-chance:100>`
Always rolls a prefix (unless blocked or overridden by explicit `<passive:[...]>`).

`<passive-affix-suffix-chance:12.5>`
Rolls a suffix roughly 12.5% of the time.