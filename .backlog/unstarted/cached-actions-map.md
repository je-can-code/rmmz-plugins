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

## Definition of done

- [ ] `grep -rn 'cachedActions' src/plugins/` returns reads as well as the one declaration it
      returns today — the field is currently written nowhere and read nowhere
- [ ] no array scan remains for resolving a live action by uuid
- [ ] the PR records a before/after frame time from a fight with many simultaneous actions. The
      item's entire stated gain is a perf win, so a refactor that ships without a number has not
      demonstrated one
- [ ] in-game: fire a multi-hit skill, kill its target mid-flight, then transfer maps — no action
      renders after its owner is gone and none survive the transfer
- [ ] `bun run hotfix` green and coverage still 100%

## Notes

- See `jabs-engine-loot-action-director.md` — a extracted collaborator may own the Map instead of growing `JABS_Engine` fields further.
