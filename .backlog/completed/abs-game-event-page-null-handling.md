# ABS: `Game_Event#page` null-event path — logging hardening (+ optional root-cause follow-up)

## Shipped (logging)

Full-structure `console.log` of `$dataMap.events` / `$gameMap._events` (and similar) **removed** from `Game_Event.prototype.page` when `this.event()` is falsy. Replaced with **one** structured `console.warn`: fields read from `this` (e.g. `_eventId`, `_pageIndex`, tile `x`/`y`, `isJabsAction`, `jabsActionUuid`) plus **stack** for callsite tracing. `return null` unchanged.

**Performance / DevTools:** That removes pathological serialization of whole maps on that branch. **Treated as addressed** for shipped logging — no longer relying on a “DevTools locks up” story; in the field the trigger was **rare** (often once-and-done while chasing it). The fix is still the right shape: **cheap, scoped diagnostics** if the branch fires again or in a loop.

## Still open (later)

- **Root cause:** Whatever timing / teardown / action-event duplication can leave `this.event()` falsy during `page()` **may still exist** — needs **deeper investigation** (which paths, minimal repro, hardening if warranted).
- **Audit:** Confirm all callers tolerate `page()` returning `null` (ABS + beyond `_base`), if not already done.

## Source

- `src/plugins/abs/core/objects/Game_Event.js` — `Game_Event.prototype.page` when `this.event()` is falsy (aliased `page` setup region)

## Context

The branch exists to avoid crashing when an event is updated after teardown (or related bad timing). The old full-map `console.log` calls were leftover debug while chasing “that thing happened again,” not production-grade diagnostics.

## Work

1. ~~Remove full-structure logging; replace with scoped warning~~ **Done** (see Shipped).
2. If this path is still reachable in normal play, add a minimal repro in the PR body or here — **deferred** until root-cause pass.
3. `return null` caller audit — **deferred**.

## Notes

- ABS review (non-Star); unrelated to `ext-star-completion.md`.
