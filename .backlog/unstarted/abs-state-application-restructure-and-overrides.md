---
status: open
area: architecture
---

# ABS — state application restructure + skill-authored duration/stack overrides

## Source

- `src/plugins/abs/core/objects/Game_Battler.js` — `handleAddingJabsState`, `addNewState`, `resetStateCounts`, `addJabsState`
- `src/plugins/abs/core/models/JABS_State.js` — `handleApplyStateOnExpire`
- `src/plugins/extend/core/` — on-hit state effect pipeline
- Design session (2026-06-23): blade 2H beast lot needs Meat Tenderizer to stun for 4s, not the state's 1s default

## Context

The JABS state application pipeline has a structural problem that blocks clean extensibility: `addJabsState` is hooked onto **two** vanilla MZ methods — `addNewState` and `resetStateCounts` — both of which are called from `handleAddingJabsState`. This means `addJabsState` fires **twice** for every first-time state application. The second call always overwrites the first, making the `addNewState` hook permanently redundant.

The consequence is that there is no single JABS-owned seam in the call chain where extra data (like a skill-authored duration override) can be threaded cleanly. Fixing this requires moving `addJabsState` to where it logically belongs — called once, explicitly, from `handleAddingJabsState`.

With that structural fix in place, the override problem becomes straightforward: `handleAddingJabsState` gains optional params, `addJabsState` uses them, and a new `addStateWithOverrides` entry point calls the whole thing without touching vanilla signatures.

The immediate driver is the `<applyState:[STATE_ID, CHANCE, DURATION?, STACKS?]>` notetag for the extend plugin, which needs to apply a state to a target with a skill-specific duration and/or stack count instead of the state's database defaults. The attacker's `stateDurationFlat`/`Perc`/`Formula` boost tags should still apply on top of any skill-authored base duration.

## Work

### Part 1 — Structural cleanup

1. **Remove `addJabsState` from the `addNewState` extension hook** in `Game_Battler.js`. The call is always immediately overwritten by the `resetStateCounts` hook; it contributes nothing.
2. **Remove `addJabsState` from the `resetStateCounts` extension hook** in `Game_Battler.js`. Same reason — we're moving its home.
3. **Call `addJabsState` once, explicitly, at the bottom of `handleAddingJabsState`** in `Game_Battler.js`. This is the only fully JABS-owned method in the chain and the correct single seam.
4. **Fix `handleApplyStateOnExpire` in `JABS_State.js`** — change `this.battler.addNewState(nextStateId, this.source)` to `this.battler.addState(nextStateId, this.source)` so on-expire follow-up states route through the full JABS pipeline instead of bypassing `handleAddingJabsState` entirely.

### Part 2 — Override support

5. **Add optional `overrideDuration` and `overrideStacks` params to `handleAddingJabsState`** (both default to `null`). Thread them through to the `addJabsState` call added in step 3.
6. **Add optional `overrideDuration` and `overrideStacks` params to `addJabsState`**. When non-null, use them as the base duration / starting stacks instead of the state's `jabsStateDurationFrames` / `jabsStateStacksApplied`. The attacker's `getStateDurationBoost` still applies on top of `overrideDuration` — skill override replaces the state's base, not the full duration calculation.
7. **Add `addStateWithOverrides(stateId, attacker, overrideDuration, overrideStacks)` on `Game_Battler`**. Calls `handleAddingJabsState` directly with the overrides. No side channels, no vanilla method signatures touched.
8. **Add `<applyState:[STATE_ID, CHANCE, DURATION?, STACKS?]>` notetag** in the extend plugin (`initialization.js`, `_annotations.js`). DURATION and STACKS are optional; when absent the state's own data values are used.
9. **Process the tag on hit** in `Game_Action.applyOnHitStateEffects` (extend plugin `Game_Action.js`). Parse all `<applyState>` entries from `this.item()`, roll CHANCE through `shouldApplyState` (respects target resistances and luck), and call `target.addStateWithOverrides(stateId, subject, duration, stacks)` on success.

## Notes

- Part 1 is prerequisite for Part 2 — do not attempt Part 2 on the current architecture.
- `addNewState` and `resetStateCounts` vanilla extensions still call the original vanilla logic; only the `addJabsState` call is removed from them. The vanilla state tracking is unaffected.
- CHANCE in the `<applyState>` tag is an integer 0–100 passed to `shouldApplyState` as a decimal (÷100), matching the behavior of the RPGMaker database effects path — target resistances and luck apply.
- Duration override replaces `jabsStateDurationFrames` as the *base*; the attacker's duration-boost tags (`stateDurationFlat`, `stateDurationPerc`, `stateDurationFormula`) still stack on top. This keeps passive gear and traits relevant even when a skill authors a specific base duration.
