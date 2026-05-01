---
status: open
area: feature
---

# J-Popups: session merge for combos and slip accumulation

## Severity

**Medium.** Pure UX/readability — combat stays playable without this; large-party ABS fights become noisy fast.

## Gain

**High polish for Chef Adventure–scale battles.** Fewer simultaneous floats preserves readable feedback (hits that matter, heals on you) instead of number soup.

## Source

- **Enqueue / flush:** `src/plugins/popups/core/managers/TextPopManager.js`
- **Queue + sprite drain:** `src/plugins/popups/core/objects/Game_Character.js`, `src/plugins/popups/core/sprites/Sprite_Character.js` (`createIncomingTextPops`, `createIncomingTextPop`)
- **Combat pops:** `src/plugins/popups/ext/abs/managers/JABS_PopupManager.js` (`showAttackPop`, `buildDamagePop`, `showSlipPop`)
- **Slip ticks:** `src/plugins/popups/ext/abs/objects/JABS_Battler.js` (`onSlipRegenTick`)
- **Popup model:** `src/plugins/popups/core/_models/Map_TextPop.js` (`LayoutRings`, `Types`)

## Context

Map popups are queued per event (`Game_Character.addTextPop`) and drained once per `Sprite_Character` frame into `Sprite_Damage` sprites. There is **no** built-in coalescing: every slip tick, every combo hit, and every ally chip spawns its own popup.

Slip/regen from states fires often (e.g. multiple ticks per second). Combo chains can apply several hits per second to the same target. Six actors plus followers multiply simultaneous floats. Players rarely parse individual tick numbers for slip; combo hits are often perceived as **one pressure phase**, not N independent accountant lines.

Today slip visuals are distinguished from strike damage mainly by **`layoutRing`** (`SlipDamage` / `Regen` vs `EnemyDamage`); `showSlipPop` still uses standard HP/MP/TP `popupType`. Any merge rules must key off **rings and resource**, not only `Map_TextPop.Types`.

## Problem statement

1. **Strike spam:** Consecutive hits that belong to one logical combo session still emit one popup per resolution.
2. **Slip spam:** While a DoT/regen state runs, each tick can enqueue another popup — readable totals drift toward noise.
3. **Optional (stretch):** Demote or threshold **non-leader ally** chip damage pops using `Game_Character#getJabsBattler` + `JABS_Battler#isPlayer` / follower semantics — same pipeline, separate policy knobs.

## Recommended solution

**Treat merge as a presentation policy layered on the existing queue**, not a rewrite of `Sprite_Damage`.

### A — Slip / regen accumulation (first vertical slice)

- Maintain a **per-target (Game_Character) accumulator** keyed by **target + slip channel**, where channel is at minimum `{ layoutRing, resource type }` and preferably **`stateId` or instance** when multiple overlapping DoTs must not blend incorrectly.
- Each tick **adds** to the bucket instead of unconditionally calling `TextPopManager.show`; **flush** one popup on an interval, when the bucket value changes display, or when the contributing **state ends** (listen via existing battler/state lifecycle hooks — exact hook depends on where slip removal is visible).
- Prefer **replacing a pending queued pop** before sprite creation over spawning many sprites and updating bitmaps live (lower risk).

### B — Combo strike merge (growing number)

- Requires an ABS-side definition of **combo session**: e.g. same attacker → same target within **N frames**, until combo counter resets or skill phase ends. **JABS must expose or infer session boundaries** — Popups alone cannot know “this hit is still the same combo.”
- While session open, **merge compatible hits** into one running total (`Map_TextPop` value refresh). Merge keys must include **critical**, **elemental styling**, and **layout ring** so weak/resist suffixes and crit cadence do not lie.
- Optional: on session end, **finalize** with one burst animation or carry crit styling on last segment only.

### C — Architecture split

- **`J.POPUPS` core:** generic helpers (`coalesceQueue`, merge keys, optional WeakMap state on characters) + plugin parameters (thresholds, enable flags).
- **`J-Popups-ABS`:** battler-aware policies (ally vs player, slip state keys), wires parameters, calls helpers from `TextPopManager` / `JABS_PopupManager` / flush site — avoids hard coupling ABS concepts into Popups core.

### Testing / acceptance

- Vitest coverage for queue merge behavior where `test/plugins/popups/` already exercises `Game_Character` text pops.
- Manual: multi-actor map + poison state + basic combo — visible popup count drops without losing total damage readability.

## Notes

- Related UX discussion: floating text as feedback channel vs noise cap (tiering / merge / settings: minimal vs full) — parameters should leave room for a future **combat numbers** preset.
- Related backlog: `textpop-builder-extension-placement.md` (ownership of builders); `game-character-action-sprite-lifecycle.md` (character vs action flags).
