---
status: open
area: code-quality
---

# ABS: `Game_Event#page` null-event path must not dump whole maps to console

## Severity

**High** when triggered: logging `$dataMap.events` and `$gameMap._events` can freeze or stutter the client and floods memory in devtools.

## Gain

**High for a small fix.** Replace with a single structured warning (event id, map id, stack or guard) or a dev-only flag; keep hot path cheap.

## Source

- `src/plugins/abs/core/objects/Game_Event.js` — `Game_Event.prototype.page` when `this.event()` is falsy (lines ~162–179 region)

## Context

The branch exists to avoid crashing when an event is updated after teardown. The current `console.log` of entire map tables reads as leftover debug from chasing “that thing happened again.”

## Work

1. Remove full-structure logging; optionally log only numeric ids and `this._eventId` / `this._mapId` if any.
2. If this path is still reachable in normal play, add a minimal repro comment or test scenario in the PR body.
3. Consider whether `return null` callers tolerate null `page()` everywhere (audit call sites).

## Notes

- ABS review (non-Star); unrelated to `ext-star-completion.md`.
