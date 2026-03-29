---
status: open
area: architecture
---

# `cachedActions` Map as primary action store

## Source

- `src/plugins/abs/core/managers/JABS_Engine.js`

## Context

`cachedActions = new Map()` exists on `JABS_Engine` but is unused. The intent is to key live actions by UUID for O(1) lookup instead of scanning arrays.

## Work

Wire `cachedActions` as the primary store for live actions; replace array-based action lookups with Map get/set/delete everywhere those actions are resolved.
