# `cachedActions` Map as primary action store

## Source

- `src/plugins/abs/core/managers/JABS_Engine.js`

## Severity

**Low** until maps grow huge; **medium** perf upside for action-heavy fights.

## Gain

**Medium** — O(1) lookups vs array scans; pairs with loot/action director extraction.

## Context

`cachedActions = new Map()` exists on `JABS_Engine` but is unused (declared in `src/plugins/abs/core/managers/JABS_Engine.js` ~line 17; no other references in `src/plugins` as of audit). The intent is to key live actions by UUID for O(1) lookup instead of scanning arrays.

## Work

Wire `cachedActions` as the primary store for live actions; replace array-based action lookups with Map get/set/delete everywhere those actions are resolved. Profile hot paths in `JABS_Engine` update loops before/after to validate win.

## Notes

- See `jabs-engine-loot-action-director.md` — a extracted collaborator may own the Map instead of growing `JABS_Engine` fields further.
