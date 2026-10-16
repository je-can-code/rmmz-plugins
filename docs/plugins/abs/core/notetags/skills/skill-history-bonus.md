---
type: notetag
title: Skill History Bonus
description: The tags applying a damage multiplier based on a battler's recent skill execution history.
tags: [abs, tag, skill, damage, history]
---

# Skill History Bonus

## Description

These tags apply a damage multiplier based on a battler's recent skill execution history.
Both tags scale damage by: 1 + (PCT * COUNT / 100).

COUNT_MODE controls what is counted from the history window:

```text
all           — total executions matching the type/skill filter
unique        — distinct skill ids matching the filter
streak        — consecutive executions from the most recent entry
                backward, stopping at the first non-matching entry
distinct_types — distinct skill type ids in the window (most useful
                with TYPE_ID = 0 for any type)
```

### Skill History Bonus (passive / equipment / state)

Reads from `getAllNotes()` sources. Fires on every attack by the bearer.
TYPE_ID = 0 matches any skill type (the "no filter" sentinel).

### This-Skill History Bonus (on a specific skill)

Reads from `this.item()` only. Fires exclusively when this skill is the action being resolved. History scope is limited
to this skill's own id.

## TAG USAGE

- Actors
- Classes
- Weapons
- Armor
- States
- Enemies
- Skills; `<thisSkillHistoryBonus>` goes on a specific skill only.

## TAG FORMAT

`<skillHistoryBonus:[TYPE_ID, WINDOW, PCT, COUNT_MODE]>`
Where TYPE_ID is the stypeId to filter on (0 = any type).
Where WINDOW is the lookback in seconds (must be <= plugin max window).
Where PCT is the integer percent bonus per unit of COUNT.
Where COUNT_MODE is: all | unique | streak | distinct_types

`<thisSkillHistoryBonus:[WINDOW, PCT, COUNT_MODE]>`
Where WINDOW is the lookback in seconds (must be <= plugin max window).
Where PCT is the integer percent bonus per unit of COUNT.
Where COUNT_MODE is: all | unique | streak | distinct_types

## TAG EXAMPLES

`<skillHistoryBonus:[0, 10, 5, unique]>`
Ghosty mastery — 5% per unique skill used in last 10 seconds.

`<skillHistoryBonus:[7, 5, 5, streak]>`
Berserker mastery — 5% per consecutive weapon-type execution (type 7).

`<thisSkillHistoryBonus:[3, 8, streak]>`
Taser — 8% more damage per consecutive cast of this skill in 3 seconds.