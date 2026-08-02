# JABS backlog (per-item)

Phase 3 and related work items live as **one markdown file each** under this directory.

## Layout

| Path | Contents |
|------|----------|
| [`unstarted/`](unstarted/) | Work not finished yet (`status: open`, or deferred / blocked items you still track here). |
| [`completed/`](completed/) | Shipped or abandoned-as-done items (`status: done`). Move the file here when closing it out. |
| This file | Conventions, template, and **unstarted inventory** tables below (active + deferred). |

New entries belong in **`unstarted/`**. When an item is finished, set `status: done` in its frontmatter, **remove its row** from the active (or deferred) inventory table below, and **move** the file into **`completed/`**. To park work without closing it, keep the file in `unstarted/` with `status: deferred` and move its row into the deferred table.

## File naming

Use a stable **kebab-case** slug: `team-parameterization.md`, not line numbers in the filename. Rename files only when the scope of the item changes enough to warrant a new identity.

## Frontmatter (optional)

YAML between `---` lines at the top is optional but encouraged for filtering and future tooling.

| Field | Values |
|-------|--------|
| `status` | `open`, `done`, `deferred`, `wontfix` |
| `area` | `architecture`, `feature`, `code-quality`, `ext-star`, `ext-pixel`, `completed` |

Body after frontmatter: title, source pointers, context, and work as in the template below.

## Template (copy into `unstarted/`)

```markdown
---
status: open
area: architecture
---

# Short title

## Source

- `path/to/file.js` (approximate lines or symbol names)

## Context

Why this exists; what is wrong or missing today.

## Work

Concrete steps or acceptance-style description.

## Notes

Optional: PR links, follow-ups, related backlog files.
```

## Unstarted inventory (active)

Items in [`unstarted/`](unstarted/) with **`status: open`** (or unset): **severity**, **gain**, **one-liner**. Update whenever you add, rename, complete, defer, or drop a backlog file.

| Item | Severity | Gain | One-liner |
|------|----------|------|-----------|
| [sdp-progressive-mastery-ladder-refactor](unstarted/sdp-progressive-mastery-ladder-refactor.md) | Medium (not blocking data) | **High** progression integrity | Count-based subgroup mastery (10 maxes → capstone); optional ladder split + editor tab; respec-safe reconcile — ship after content pass OK. |
| [weapon-tier-hardness-damage-balance](unstarted/weapon-tier-hardness-damage-balance.md) | High when SDP central | High readability | Restore weapon/enemy relevance vs SDP via tier gates, hardness/pierce, or hybrid damage channels. |
| [cleanup-useless-typeof-slop](unstarted/cleanup-useless-typeof-slop.md) | Medium hygiene | **High** clarity + trust | Ban `typeof` in `src/plugins/**` (allowlist JsonMapper); delete function duck-typing; **hotfix build gate** so violations cannot ship. |
| [ca-food-recipes-crafting-redo](unstarted/ca-food-recipes-crafting-redo.md) | **High** design debt | **High** six-family playability | Redo meal list + `config.crafting.json`: family recipe books (not random Journal I/II/III), family ingredient drops/shops, arc-first `<food:TYPE>`. |
| [ca-protag-class-job-tree-system](unstarted/ca-protag-class-job-tree-system.md) | **High** design debt | **High** party build identity | SD3-style class/job trees (Jerald/Rupert + elementals) for **role skills**; SDP archetype panels need this or Medic/Cleric/etc. investment on 5/6 party members has no answer. **Not** blocking weapon **1–180** lots. |
| [cms-damage-formula-scaling-breakdown](unstarted/cms-damage-formula-scaling-breakdown.md) | Medium | **High** CMS clarity | Parse conventional `(a terms) − (b terms)` formulas → **Scaling / Mitigation** coefficient lines in J-CMS (+ optional editor preview); fallback to Raw Damage. |
| [abs-action-map-bootstrap-refactor](unstarted/abs-action-map-bootstrap-refactor.md) | Low | Medium clarity | Move `$actionMap` skill-master JSON off `globalThis` into a proper template loader / hoisted accessor. |
| [abs-debug-and-placeholder-logging](unstarted/abs-debug-and-placeholder-logging.md) | Low–medium | Low effort, medium polish | Remove `omg` / `did the thing` / vague warns; consistent `[JABS]` diagnostics or debug flags. |
| [abs-game-unit-inbattle-semantics](unstarted/abs-game-unit-inbattle-semantics.md) | Medium–high interop | Medium–high | `Game_Unit#inBattle` always true under ABS — document, narrow, or add explicit helper for plugins. |
| [abs-input-controller-registry](unstarted/abs-input-controller-registry.md) | Low–medium | Medium clarity | Drop `$jabsController1`; primary input via `JABS_InputAdapter.controllers` (co-op = more controllers, not numbered globals). |
| [abs-on-map-menu-scenes](unstarted/abs-on-map-menu-scenes.md) | High scope | **High** UX consistency | On-map equivalents for party/status/equip/skills (etc.) so full menu matches JABS quick-menu behavior and avoids off-map `Scene_Menu` return quirks. |
| [abs-spriteset-refresh-character-sprites-hardening](unstarted/abs-spriteset-refresh-character-sprites-hardening.md) | Medium if broken | **High** confidence | Prove or fix `refreshAllCharacterSprites` (party cycle, allies, followers) per author TODO. |
| [eslint-complexity-refactors](unstarted/eslint-complexity-refactors.md) | Low | Medium | Reduce/contain complexity hotspots (table-driven refactors) without behavior changes. |
| [cached-actions-map](unstarted/cached-actions-map.md) | Low–medium | Medium perf / clarity | Wire `JABS_Engine.cachedActions` Map for O(1) live-action lookup. |
| [ca-mods-boundary](unstarted/ca-mods-boundary.md) | Low–medium | Medium clarity | Policy for `__ca-mods` vs reusable plugins. |
| [convert-saved-prototype-models-to-modern-classes](unstarted/convert-saved-prototype-models-to-modern-classes.md) | Medium | Medium–high maintainability | Migrate save-persisted prototype constructors to `class` + `SerializableRegistry`; convert-on-touch, stable save shapes. |
| [abs-dot-slip-revamp](unstarted/abs-dot-slip-revamp.md) | Medium–high design debt | **High** debuffer + gear hooks | First-class DoT pipeline (not inverted regen slip); instance potency + amp tags for Ring-of-Melting / cast-channel plague — **before** piggybacking on P3-7 lasers. |
| [database-rpg-skill-augmentation-chain](unstarted/database-rpg-skill-augmentation-chain.md) | Medium | Medium | Document / dedupe seven `RPG_Skill` augmentation chains. |
| [editor-enemies-ai-behavior-tab](unstarted/editor-enemies-ai-behavior-tab.md) | Low–medium today, medium ongoing | **High** over content lifetime | Enemies board "AI Behavior" tab: curated archetypes (single-click trait/role presets) + text-only decision pipeline cards mirroring `JABS_EnemyAI.decideAction`; chip grid demoted to "show raw flags" reveal. |
| [editor-ux-unification](unstarted/editor-ux-unification.md) | Medium | **High** breadth across whole editor | `jmz-data-editor` design-system pass: `<BoardSectionCard>` (Phase 1 done) + normalized app-bar Save/Reload + per-board card migration (Crafting is the template), then a real Index dashboard. |
| [game-character-action-sprite-lifecycle](unstarted/game-character-action-sprite-lifecycle.md) | Medium | Medium | Action-sprite flags: `Game_Character` vs `JABS_Action` / Popups. |
| [game-enemies-factory-rename](unstarted/game-enemies-factory-rename.md) | Low | Medium clarity | Rename `$gameEnemies` / `Game_Enemies` to factory/prototype-cache semantics; not an actors mirror. |
| [game-system-j-namespace-save-slice](unstarted/game-system-j-namespace-save-slice.md) | Medium | **High** save hygiene | `$gameSystem._j._abs` persisted flags + map transient reset; prerequisite for static engine. |
| [save-system-codec-rewrite](unstarted/save-system-codec-rewrite.md) | **High** scope | **High** save integrity | Replace the `JsonEx` heap dump with codecs, scopes, and pretty JSON directories; 40% of every save is derivable cache. Absorbs the `_j` save-slice and TIME DTO items. |
| [jabs-engine-loot-action-director](unstarted/jabs-engine-loot-action-director.md) | Low–medium | Medium–high | Extract loot/action helpers from mega-`JABS_Engine`. |
| [plugin-initialization-namespace-split](unstarted/plugin-initialization-namespace-split.md) | Medium–high if regressed | **High** cross-ship hygiene | Split bootstrap into namespace vs init modules; audit `_pluginMetadata` model imports; 4.12.4 PR kept minimal `'refresh'` fix only. |
| [jabs-5-static-engine-external-data](unstarted/jabs-5-static-engine-external-data.md) | **High** scope | **High** architecture | JABS 5.0: static `JABS_Engine`, `$gameSystem._j._abs` save slice, full external JSON — breaking umbrella. |
| [jabs-database-tags-editor-first](unstarted/jabs-database-tags-editor-first.md) | **High** scope | **High** authoring | Official policy: jmz-data-editor only for JABS tags across 8 DB types; fill board gaps + parser parity. |
| [jafting-ext-socketing](unstarted/jafting-ext-socketing.md) | Medium (optional) | High build variety | Socket gems/runestones on JAFTING gear; save-safe models and scene hooks. |
| [jafting-heavy-scenes-decomposition](unstarted/jafting-heavy-scenes-decomposition.md) | Low player / medium dev | Medium | Split huge JAFTING scenes for complexity targets. |
| [log-map-log-channel-registry](unstarted/log-map-log-channel-registry.md) | Low–medium | Medium clarity | One global owner (`$mapLogs` / registry) for three `MapLogManager` channel instances — drop triple `$` bootstraps. |
| [pixel-angled-projectiles](unstarted/pixel-angled-projectiles.md) | Medium | **High** feel | Angled projectiles with Pixelistics + JABS. |
| [popups-merge-idle-combo-tracker](unstarted/popups-merge-idle-combo-tracker.md) | Low–medium | Medium | **v1.1:** expose combo streak counter / events from merge idle window semantics (HUD + plugins). |
| [repo-unit-testing](unstarted/repo-unit-testing.md) | Medium | **High** over time | Expand Vitest coverage where harness exists. |
| [team-overlays](unstarted/team-overlays.md) | Low today, high later | Medium–high | Optional overlay layer for charms/summons/auras without changing primary team id. |
| [time-save-data-vs-runtime-manager](unstarted/time-save-data-vs-runtime-manager.md) | Medium | Medium–high saves + clarity | Persist `Time_Snapshot`/DTO only; runtime `Game_Time` manager not written wholesale to save. |

## Unstarted inventory (deferred)

Same shape; these use **`status: deferred`** in file frontmatter — explicitly not on the near-term roadmap.

| Item | Severity | Gain | One-liner |
|------|----------|------|-----------|
| [cross-plugin-prototype-hook-surface](unstarted/cross-plugin-prototype-hook-surface.md) | High maintainability | **High** | Inventory `JABS_Engine`, `Game_Action`, `Scene_Map`, `JABS_AiManager`, `Game_Unit`, etc. |
| [ext-star-completion](unstarted/ext-star-completion.md) | **High** if Star used | **High** feature unblock | Finish Star ABS flow (enemy spawn, missing map). |
| [game-action-battler-uuid-refactor](unstarted/game-action-battler-uuid-refactor.md) | **High** if casual | **High** if done right | UUID vs id/index for `Game_Action` on map + saves. |

**Completed** items live in [`completed/`](completed/). Remove rows here when closing an item out.

**Architecture / tooling baselines:** [`monorepo-vite-esm-plugin-migration.md`](completed/monorepo-vite-esm-plugin-migration.md), [`monorepo-vite-esm-migration-inventory.md`](completed/monorepo-vite-esm-migration-inventory.md), [`plugin-template-vite-scaffold.md`](completed/plugin-template-vite-scaffold.md), [`build-tools-linting.md`](completed/build-tools-linting.md), [`jsonex-j-register-serialization-registry.md`](completed/jsonex-j-register-serialization-registry.md), [`j-base-external-json-config-loader.md`](completed/j-base-external-json-config-loader.md), [`rmmz-engine-type-definitions-reconciliation.md`](completed/rmmz-engine-type-definitions-reconciliation.md).

**Recent feature closures:** [`ca-food-group-chain-system.md`](completed/ca-food-group-chain-system.md), [`level-content-sync-encapsulation.md`](completed/level-content-sync-encapsulation.md), [`ally-ai-behavior-axes.md`](completed/ally-ai-behavior-axes.md), [`pixel-per-enemy-hitbox-size.md`](completed/pixel-per-enemy-hitbox-size.md), [`generic-skill-transform-resolution.md`](completed/generic-skill-transform-resolution.md), [`ally-ai-combo-actions-review.md`](completed/ally-ai-combo-actions-review.md), [`ally-dodge-skill-ai.md`](completed/ally-dodge-skill-ai.md), [`j-otib-rewrite.md`](completed/j-otib-rewrite.md), [`editor-weapons-board.md`](completed/editor-weapons-board.md), [`editor-armors-board.md`](completed/editor-armors-board.md), [`editor-items-board.md`](completed/editor-items-board.md).
