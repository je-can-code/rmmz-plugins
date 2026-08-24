# J-Popups-ABS (v1.1): combo streak tracker from merge idle window

## Target release

**J-Popups / J-Popups-ABS ~v1.1** — formalize what today is only **implicit**: merge accumulation uses a **per-victim silence budget** (`mergeIdleFlushFrames`) plus `lastCharacterMergeFrame` activity (`JABS_PopupMergeController`), which already behaves like an informal combo window.

## Severity

**Low–medium.** Gameplay works without it; this is **authoring + UI affordance** for chain counting, style bonuses, or HUD hooks.

## Gain

**Medium.** One coherent notion of “combo phase” shared between floats and systems that care about streak count (plugins, common events, HUD labels like **COMBO ×N**) instead of re-implementing timers elsewhere.

## Source

- `src/plugins/popups/ext/abs/managers/JABS_PopupMergeController.js` (`#touchCharacterMergeWindow`, `tickIdleFlush`, strike routing).
- `src/plugins/popups/ext/abs/_metadata/initialization.js` (`MergeParams.idleFlushFrames` ← plugin param `mergeIdleFlushFrames`).
- `src/plugins/popups/ext/abs/objects/Scene_Map.js` (idle tick cadence).

## Context

After removing global strike flush on `ComboChainCleared`, **strike merge release** is driven almost entirely by the **idle sliding window** per target battler. That is parallel to real combo semantics (“quiet gap ends the streak”) but **does not yet expose**:

- A **chain counter** or streak id.
- Optional **attacker-scoped** streak vs purely victim-local silence.
- **Emitter events** or API for “combo incremented / combo broken” for HUD or gameplay reactions.

## Work (acceptance sketch)

1. **Define** “combo streak” for ABS presentation: at minimum **increment on qualifying merged strikes** while the idle window keeps resetting; **finalize or reset** after idle expires (and optionally on death / map transfer — reuse existing flush paths).
2. **Expose** read-only or event hooks (`PopupEmitter` namespaced events, or a tiny `J.POPUPS.EXT.ABS.ComboStreak` façade) so Chef Adventure or extensions can show **COMBO ×N** without duplicating frame math.
3. **Parameters:** caps, whether slip/mitigation/reward touches extend the same streak as strikes or stay separate (policy knobs).
4. **Tests:** Vitest for streak math / idle boundaries where harness can simulate frame counts and merge ingress without full map scene.

## Notes

- Overlaps conceptually with `.backlog/unstarted/popups-combat-session-merge-coalesce.md` (broader merge/session UX); this item is **narrower**: **promote idle-merge timing into an explicit combo-tracker surface** for v1.1.
- Do **not** reintroduce global strike flush on JABS combo cooldown; streak boundaries should stay aligned with **merge idle + explicit rules**, not unrelated battlers’ skill slots.
