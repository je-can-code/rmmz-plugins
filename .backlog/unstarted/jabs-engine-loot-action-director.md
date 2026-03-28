---
status: open
area: architecture
---

# Loot and action helpers extracted from `JABS_Engine`

## Source

- `src/plugins/abs/core/managers/JABS_Engine.js` (helpers around line 2710; line may drift)

## Context

Several helper closures inside `JABS_Engine` were flagged for extraction into a reusable collaborator (e.g. `JABS_LootDirector` or `JABS_ActionDirector`).

## Work

Identify the helpers near that region, extract a named class or module-namespace object, and have `JABS_Engine` delegate to it without behavior changes.
