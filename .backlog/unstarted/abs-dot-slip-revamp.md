---
status: open
area: architecture
---

# JABS: damage-over-time (slip) model revamp

## Severity

**Medium–high** design debt — DoT today is "negative slip" on the same regen tick pipeline as HRG and
food trailing regen. It works, but it fights first-class debuffer identity, source attribution, and
any future **DoT amplification** hooks (cast-time channel bonuses, gear like a Ring of Melting, Brood
plague scaling, etc.).

## Gain

**High** if done before stacking more mastery hooks on top of slip:

- Clear separation: **regen** vs **DoT** (different tick policy, popups, shield interaction, logging).
- Per-instance DoT metadata on `JABS_State` (source skill, source battler, optional potency multiplier).
- A stable place for **`dotAmp` / `dotRate`**-style tags without overloading `makeDamageValue` or slip
  percent tags.
- Unblocks Brood / debuffer fantasies without polluting direct-damage hooks (e.g. P3-7 cast-time laser
  scaling stays direct-hit only).

## Source

- `src/plugins/abs/core/__models/JABS_Battler.js` — `processStateRegens`, `stateSlipHp/Mp/Tp`,
  `STATE_SLIP_PER_TICK_DIVISOR`, `applySlipEffect`, `onSlipRegenTick`
- `src/plugins/abs/core/database/RPG_State.js` — `jabsSlipHp*` / `jabsSlipMp*` / `jabsSlipTp*` getters
- `src/plugins/abs/core/__models/JABS_State.js` — `source` battler only (no skill id, no potency stamp)
- `src/plugins/abs/core/_metadata/_annotations.js` — SLIP DAMAGE cookbook (note: some tick-rate prose
  may lag runtime — verify against `STATE_SLIP_PER_TICK_DIVISOR` when redesigning)
- `src/plugins/abs/ext/shield/_metadata/_annotations.js` — slip damage explicitly **not** mitigated by
  shields today
- SDP design: Brood **Plague Swarm** — **P3-3 viral spread shipped + playtest verified** (`J-ABS` 4.12.4);
  `ca/docs/sdp/archetype-mapping.md`, `ca/docs/sdp/implementation-status.md` (state spread cookbook)

## Context

### What we have today

"DoT" is implemented as **slip damage**: state notetags (`<hpFlat>`, `<hpPercent>`, `<hpFormula>`, etc.)
that aggregate in `processStateRegens` and apply HP/MP/TP deltas on the same periodic loop as positive
regen. Poison is "lose HP over time" using the same machinery as "gain HP over time."

**Consequences:**

| Topic | Today |
|---|---|
| Pipeline | DoT ticks never pass through `Game_Action.makeDamageValue` |
| Source | `JABS_State.source` = applying battler; **no skill id**, no cast context |
| Amplifiers | No instance-level "this poison ticks at 2×" — only static state DB potency |
| Shields | Slip bypasses shield absorption (documented in Shield ext) |
| Popups | Per-state slip popups exist; semantics mix heal and harm on one channel |
| P3-7 cast time | **Correctly excluded** — `<castTimeDamageBonus>` is direct laser damage only |

### Why not piggyback DoT amp on cast-time damage bonus

P3-7 **Focusing Beam** (Lamia / Artillery) scales **`makeDamageValue`** by resolved `<castTime>` —
big channeled lasers. That is the right scope for v1.

Brood-style "15s channel → plague ticks harder" is a **different** fantasy and needs DoT instance
metadata stamped at **state application** time, not a side effect of direct damage multipliers.

Example gear fantasy deferred to this item:

- **Ring of Melting** — DoTs you apply tick at +100% (or +X% per negative state on target).
- **Cast channel → DoT potency** — optional stamp when a long-cast skill applies a state (separate tag
  family from `castTimeDamageBonus`).

### Relationship to other backlog / SDP items

- **P3-7** (cast-time direct damage) — ship independently; document "does not affect DoT."
- **P3-3** viral debuff propagation — ✅ shipped + verified (`J-ABS` 4.12.4). Spread calls `addState`
  with the original **source** battler; applies **base state** (no per-instance potency stamp yet).
  **`viralInheritsPotency`** (or similar) belongs in this DoT revamp if plague should copy stamped amps.
- **J-Passive-Conditional** — gates for "DoT amp while HP below X%" belong on passive states; the **tick
  math** still needs a DoT-aware pipeline.

## Design direction (proposal — refine before implementation)

### 1. First-class DoT channel

Split **regen slip** (positive sustain) from **harm slip** (DoT) at the processing layer, even if tags
remain backward-compatible initially:

- DoT ticks: own popup channel / log flavor, explicit `gainHp(-n)` attribution, hook surface for
  `onDotTick` / `dotAmp` evaluators.
- Regen ticks: unchanged policy for HRG-like sustain.

Migration path: existing negative slip tags continue to work; new `<dot:*>` tags (names TBD) preferred
for new content.

### 2. Instance metadata on `JABS_State`

Extend tracked state instances (JsonEx-safe fields + `SerializableRegistry`):

| Field | Purpose |
|---|---|
| `sourceSkillId` | Skill that applied the state (0 if unknown / ambient) |
| `sourceCastTimeFrames` | Resolved cast duration at apply time (0 if instant) |
| `dotPotencyRate` | Multiplier on tick damage (default 1.0; stamped by gear/mastery/tags) |

Stamp `dotPotencyRate` (and optional cast frames) in the **state application** path
(`Game_Action.applyStateEffect` / `handleAddingJabsState`), reading tags from applier notes at that
moment — not on every tick from scratch.

### 3. Amplification tag families (future, after revamp)

Keep separate from **`castTimeDamageBonus`** (direct damage):

| Tag | Scope | Effect |
|---|---|---|
| `<dotAmpRate:N>` | `getAllNotes()` on bearer | Multiply all DoTs **this battler applies** by `(1 + N/100)` |
| `<thisDotAmpRate:N>` | Skill note | Multiply DoT potency of states applied **by this skill** |
| `<castTimeDotPotency:N>` | Mastery / gear (optional) | Add `N` percent-per-second of **resolved cast time at apply** to DoT potency stamp |

Example: Ring of Melting → passive state with `<dotAmpRate:100>` (double DoT potency on application stamp).

### 4. Viral spread vs DoT potency (P3-3 shipped — revamp deferred)

**Runtime today (`J-ABS` 4.12.4):** spread applies **base state** via `addState(stateId, source)`;
no copy of future `dotPotencyRate` on the `JABS_State` instance.

**When this revamp lands:** optional `<viralInheritsPotency>` (name TBD) if spread should copy stamped
DoT amps; default stays base-state apply so one long cast cannot escalate plague DPS across the map.

### 5. Shield / guard interaction

Today slip ignores shields. Revisit during revamp:

- Option A: DoT remains unshielded (classic ARPG poison).
- Option B: DoT respects SER/shield for magic poison only.
- Document chosen policy in `_annotations.js`.

## Work

1. **Design doc pass** — confirm DoT tag names, migration, and **DoT amp** rules with Jeremy; P3-3 viral
   spread policy is documented in `ca/docs/sdp/implementation-status.md` (verified 2026-06-01).
2. **Audit** — inventory all slip/DoT call sites, popup paths, and CA states using negative slip
   (poison, bleed, plague candidates).
3. **Model** — extend `JABS_State` with instance fields; register serialization; stamp on apply.
4. **Pipeline** — split or branch `processStateRegens` so DoT ticks use potency multiplier and dedicated
   hooks; keep legacy negative slip working through compatibility shim if needed.
5. **Tags** — add amp/stamp tags + cookbook in `_annotations.js`; editor/parser parity in
   `jmz-data-editor` (follow `jabs-database-tags-editor-first` policy).
6. **Tests / playtest** — poison + regen on same battler, save/load, shield ext interaction. P3-3 spread:
   ✅ Vitest + CA Brood playtest (2026-06-01); slip/DoT interplay still belongs here after revamp.

## Notes

- **Do not** extend P3-7 `castTimeDamageBonus` to slip ticks — that hook is for direct map-action
  damage (Lamia laser). DoT amps land here after revamp.
- Annotations still mention "20 ticks at 4/sec" in places; runtime uses `STATE_SLIP_PER_TICK_DIVISOR`
  at 2 ticks/sec — reconcile during revamp so authored "per 5 seconds" matches player-visible DPS.
- CA food chain tail states may use slip-like tags; ensure revamp does not break food regen semantics
  (food uses state tags + expire chains, not this hook).
