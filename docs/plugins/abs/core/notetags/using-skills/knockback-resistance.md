---
type: notetag
title: Knockback Resistance
description: The tag reducing, by a percent, how far a battler is knocked back by incoming hits.
tags: [abs, tag, knockback, resistance]
---

# Knockback Resistance

## Description

Reduces how far a battler is knocked back by incoming hits, as a percent of the knockback. Tags from everything the
battler carries are summed, and a total of 100 or more makes the battler immune to knockback: it does not even hop in
place.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies

## TAG FORMAT

`<knockbackResist:VAL>`
Where VAL is the percent of incoming knockback to cancel.

## TAG EXAMPLES

`<knockbackResist:50>`
This battler is knocked back half as far by incoming hits.

`<knockbackResist:100>`
This battler is immune to knockback, and does not even hop in place.