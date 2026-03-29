---
status: open
area: feature
---

# Bonus hit type split (basic vs skill vs all)

## Source

- `src/plugins/abs/core/__models/JABS_Battler/_reference.js` (bonus hit accumulation; line numbers drift)

## Context

Bonus hits from equipment and states are pooled. Designers want hits that apply only to basic attacks, only to skills, or to all actions.

## Work

Add distinct notetag (or param) variants; accumulate into three buckets; apply the correct bucket when resolving each action type.
