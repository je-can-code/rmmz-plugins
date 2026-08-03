---
status: done
area: architecture
---

# SDP progressive mastery ladder — count-based steps, optional ladder split, respec-safe reconcile

## Problem

Subgroup mastery today is **highest maxed panel tier wins**: max-rank **one** high-tier panel (e.g. `REB_10`) immediately grants that row’s wrapper skill (e.g. **1120 Wraithwall Eternal), skipping the intended decade climb and most strip stat taxes.

Design intent is different:

- Each **distinct panel max** in a subgroup advances mastery **one step** (1→2→…→10), regardless of **which** panel was maxed or drop order.
- **Capstone mastery** (tier 10 skill) should require **ten maxed panels** in that subgroup — a “complete the decade” moment, not a rare-drop jackpot.
- **`masterySkillId` is really “skill for step N on subgroup ladder”** — it happens to live on panel rows in `config.sdp.json` today, but runtime only needs **`subgroupKey` + tier step → skill**.
- Future **SDP respec** (reset panels, partial point refund) must **downgrade** mastery when `PanelRanking.maxed` clears — no separate mastery ledger that can drift.

**Not urgent for content authoring:** current nested `panel.mastery` shape is fine to smoke-test Beginning / Middle / End masteries (max a few panels in Map357 / debug). Ship data first; refactor mastery rules when convenient.

## Proposal

### 1. Runtime: progress-count mastery (J-SDP)

Replace `#resolveWinningMasteryPanel` “highest `subgroupTier` maxed” with:

| Input | Rule |
|---|---|
| **`progress`** | Count of maxed rankings whose panel **`grantsMasterySkill()`** (or `participates()`) and shares `subgroupKey`. |
| **Active skill** | Panel (or ladder step) where **`subgroupTier === progress`** — **not** the panel just maxed. |
| **Reconcile** | Keep existing forget-all / learn-winner loop in `SdpMasteryManager.reconcileSubgroupMastery` (idempotent full state). |

**Examples (Wraith / `undead-reborn`):**

- Max `REB_10` first → progress **1** → skill **1111**, not 1120.
- Ten distinct maxes → progress **10** → **1120**; UI “middle → capstone” reveal on last max.

**Hooks (unchanged call sites):** `PanelRanking.applySubgroupMastery` on max rank; `reconcileAllForActor` on map entry.

**Tests:** rewrite `test/plugins/sdp/sdp-mastery.test.js` (max t2-only → step 1 skill; t1+t2 → step 2; order-independent).

### 2. Config (phase A — minimal schema change)

Keep `mastery { subgroupKey, subgroupTier, masterySkillId }` on each panel row; boot already builds **`panelsBySubgroupKey`** sorted by tier. Resolver reads **`masterySkillId` from tier slot `progress`**, not from highest maxed panel.

Optional helper on metadata: `panelForMasteryStep(subgroupKey, step)` / expose boot **`tierBySubgroupKey`** map (built in `validateMasteryMetadata` today but not hoisted to `J.SDP.Metadata`).

### 3. Config + editor (phase B — optional, later)

Split mastery into a **first-class subgroup ladder** so authors edit skills once per subgroup, not per panel:

```json
"subgroups": [
  {
    "key": "undead-reborn",
    "name": "Reborn",
    "masterySteps": [
      { "tier": 1, "masterySkillId": 1111 },
      { "tier": 10, "masterySkillId": 1120 }
    ]
  }
]
```

Panels slim to **enrollment** only: `subgroupKey` + `subgroupTier` (decade slot / drop alignment); **`masterySkillId` removed from panel rows**.

| Layer | Owns |
|---|---|
| **Panel** | `key`, stats, progression, rewards, subgroup enrollment |
| **Mastery ladder** | tier → wrapper skill (Beginning / Middle / End act names live in skill/state data) |
| **Family** | Derived from subgroup (unchanged) |

**jmz-data-editor:** dedicated **Mastery** tab or subsection under Subgroups — 10-row skill picker per subgroup; panels tab drops per-row mastery skill field.

**Migration tool:** lift `(subgroupKey, subgroupTier, masterySkillId)` from existing panels → ladder; validate uniqueness.

### 4. UI (J-SDP scene)

`Window_SdpMastery`:

- Show **`progress / maxSteps`** for hovered panel’s subgroup (needs actor context).
- Tier-10 panel preview: if `progress < 9`, hide capstone skill name / show “Complete the decade…”; transform copy when step 10 lands.

### 5. Respec (future consumer of this design)

No mastery save field. Respec API:

1. Reset `PanelRanking` (`currentRank`, **`maxed = false`** — today one-way).
2. Refund SDP points (`modSdpPoints`, `modAccumulatedSpentSdpPoints`).
3. **`SdpMasteryManager.reconcileSubgroupMastery`** (or `reconcileAllForActor`) for affected subgroups.

Progress drops → lower-tier skill learned, capstone forgotten automatically.

## Out of scope (this item)

- Drop gating (tier-10 enemies not in world yet — content pacing, not mastery code).
- Changing panel parameter authoring (`REB_*` strip, P4-1).
- Sin / non–1…10 subgroup ladder shapes (document exception when touching `deity-sin`).

## Work

### Phase A — runtime (ship when ready)

1. **`SdpMasteryManager`:** `countMaxedMasteryPanels(actor, subgroupKey)` + resolve winner by **`subgroupTier === progress`**.
2. **Optional:** hoist `tierBySubgroupKey` or `panelForMasteryStep` on `J.SDP.Metadata`.
3. **Tests:** progress-count cases + order independence + org tier with `masterySkillId: 0` does not inflate progress.
4. **Docs (ca):** `mastery-cheatsheet.md` — mastery unlock rule; note capstone requires 10 maxes.

### Phase B — ladder split + editor (eventually)

1. **Schema:** `masterySteps` on subgroup (or top-level `masteryLadders`); boot `masteryLadderBySubgroupKey`.
2. **Backward compat:** hydrate ladder from panel rows if ladder absent.
3. **jmz-data-editor:** Mastery tab; panel form enrollment-only.
4. **Migration script:** `chef-adventure/tools/migrate-sdp-mastery-ladder.mjs` (or under `rmmz-plugins/project/tools/`).

### Phase C — respec (separate backlog or follow-on)

1. `Game_Actor` / SDP scene: reset panel ranking + refund.
2. Always reconcile mastery after batch respec.

## Acceptance

- Maxing only `REB_10` grants **1111**, not 1120.
- Maxing **10 distinct** Wraith panels grants **1120**; maxing 9 never does.
- Order of maxing does not change final progress for a given count.
- `reconcileAllForActor` after save load matches live rank-up behavior.
- (Phase B) Editing tier-7 skill in one ladder row updates runtime step 7 without touching `REB_7` panel stats.

## Source

- `src/plugins/sdp/core/managers/SdpMasteryManager.js` — `#resolveWinningMasteryPanel`, `reconcileSubgroupMastery`
- `src/plugins/sdp/core/__models/PanelRanking.js` — `applySubgroupMastery`, `maxed` flag
- `src/plugins/sdp/core/_metadata/_pluginMetadata.js` — `validateMasteryMetadata`, `panelsBySubgroupKey`
- `src/plugins/sdp/core/windows/Window_SdpMastery.js`
- `test/plugins/sdp/sdp-mastery.test.js`
- `jmz-data-editor/app/src/presentation/boards/sdp/SdpBoard.tsx` — per-panel mastery fields today
- `ca/docs/sdp/mastery-cheatsheet.md` — three-act naming, capstone IDs

## Related

- [`sdp-panel-archetype-restructure.md`](sdp-panel-archetype-restructure.md) — panel stat identity (orthogonal)
- `ca/docs/sdp/work-items.md` — P4-2 mastery authoring
- Future SDP respec (not yet backlog — wire reconcile when added)

## Notes

- **Timing:** Do after family panel/mastery **data** passes if easier; current nested shape supports smoke tests (max multiple panels via Map357 / debug — extra taps only).
- **Panel ↔ ladder decoupling** is intentional: swapping `masterySkillId` between tier rows (or subgroups) should work mechanically once resolver uses ladder slots, not “panel you maxed.”
