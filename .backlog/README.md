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
| [abs-debug-and-placeholder-logging](unstarted/abs-debug-and-placeholder-logging.md) | Low–medium | Low effort, medium polish | Remove `omg` / `did the thing` / vague warns; consistent `[JABS]` diagnostics or debug flags. |
| [abs-facing-validation-dry](unstarted/abs-facing-validation-dry.md) | Low–medium | Medium DRY | One helper for unsupported facing / dir8 validation shared by `JABS_Engine` and `Spriteset_Map`. |
| [abs-game-unit-inbattle-semantics](unstarted/abs-game-unit-inbattle-semantics.md) | Medium–high interop | Medium–high | `Game_Unit#inBattle` always true under ABS — document, narrow, or add explicit helper for plugins. |
| [abs-melee-hitbox-origin-offset](unstarted/abs-melee-hitbox-origin-offset.md) | Medium | **High** feel / honesty | Melee hitboxes should originate from torso/hand (offset) for both collision + visuals, not feet-origin. |
| [abs-spriteset-refresh-character-sprites-hardening](unstarted/abs-spriteset-refresh-character-sprites-hardening.md) | Medium if broken | **High** confidence | Prove or fix `refreshAllCharacterSprites` (party cycle, allies, followers) per author TODO. |
| [ally-ai-behavior-axes](unstarted/ally-ai-behavior-axes.md) | Medium design | High authoring clarity | Replace exclusive ally AI “modes” with composable behavior axes (toggles/sliders); optional presets; migrate legacy mode tags. |
| [eslint-complexity-refactors](unstarted/eslint-complexity-refactors.md) | Low | Medium | Reduce/contain complexity hotspots (table-driven refactors) without behavior changes. |
| [cached-actions-map](unstarted/cached-actions-map.md) | Low–medium | Medium perf / clarity | Wire `JABS_Engine.cachedActions` Map for O(1) live-action lookup. |
| [ca-mods-boundary](unstarted/ca-mods-boundary.md) | Low–medium | Medium clarity | Policy for `__ca-mods` vs reusable plugins. |
| [convert-saved-prototype-models-to-modern-classes](unstarted/convert-saved-prototype-models-to-modern-classes.md) | Medium | Medium–high maintainability | Migrate save-persisted prototype constructors to `class` + `SerializableRegistry`; convert-on-touch, stable save shapes. |
| [database-rpg-skill-augmentation-chain](unstarted/database-rpg-skill-augmentation-chain.md) | Medium | Medium | Document / dedupe seven `RPG_Skill` augmentation chains. |
| [game-character-action-sprite-lifecycle](unstarted/game-character-action-sprite-lifecycle.md) | Medium | Medium | Action-sprite flags: `Game_Character` vs `JABS_Action` / Popups. |
| [jabs-engine-loot-action-director](unstarted/jabs-engine-loot-action-director.md) | Low–medium | Medium–high | Extract loot/action helpers from mega-`JABS_Engine`. |
| [jafting-ext-salvage](unstarted/jafting-ext-salvage.md) | Medium–high (economy) | High for churn-heavy crafting | Salvage extension with recipe provenance stamps, partial material refunds, sell/discard id reclaim. |
| [jafting-ext-socketing](unstarted/jafting-ext-socketing.md) | Medium (optional) | High build variety | Socket gems/runestones on JAFTING gear; save-safe models and scene hooks. |
| [jafting-heavy-scenes-decomposition](unstarted/jafting-heavy-scenes-decomposition.md) | Low player / medium dev | Medium | Split huge JAFTING scenes for complexity targets. |
| [pixel-angled-projectiles](unstarted/pixel-angled-projectiles.md) | Medium | **High** feel | Angled projectiles with Pixelistics + JABS. |
| [pixel-per-enemy-hitbox-size](unstarted/pixel-per-enemy-hitbox-size.md) | Low–medium | Medium–high tuning | Per-enemy hitbox radius notetag + clamp rules. |
| [popups-combat-session-merge-coalesce](unstarted/popups-combat-session-merge-coalesce.md) | Medium | High UX polish | Merge combo hits + accumulate slip/regen pops; optional ally chip demotion. |
| [popups-merge-idle-combo-tracker](unstarted/popups-merge-idle-combo-tracker.md) | Low–medium | Medium | **v1.1:** expose combo streak counter / events from merge idle window semantics (HUD + plugins). |
| [repo-unit-testing](unstarted/repo-unit-testing.md) | Medium | **High** over time | Expand Vitest coverage where harness exists. |
| [team-overlays](unstarted/team-overlays.md) | Low today, high later | Medium–high | Optional overlay layer for charms/summons/auras without changing primary team id. |
| [weapon-tier-hardness-damage-balance](unstarted/weapon-tier-hardness-damage-balance.md) | High when SDP central | High readability | Restore weapon/enemy relevance vs SDP via tier gates, hardness/pierce, or hybrid damage channels. |

## Unstarted inventory (deferred)

Same shape; these use **`status: deferred`** in file frontmatter — explicitly not on the near-term roadmap.

| Item | Severity | Gain | One-liner |
|------|----------|------|-----------|
| [cross-plugin-prototype-hook-surface](unstarted/cross-plugin-prototype-hook-surface.md) | High maintainability | **High** | Inventory `JABS_Engine`, `Game_Action`, `Scene_Map`, `JABS_AiManager`, `Game_Unit`, etc. |
| [ext-star-completion](unstarted/ext-star-completion.md) | **High** if Star used | **High** feature unblock | Finish Star ABS flow (enemy spawn, missing map). |
| [game-action-battler-uuid-refactor](unstarted/game-action-battler-uuid-refactor.md) | **High** if casual | **High** if done right | UUID vs id/index for `Game_Action` on map + saves. |

**Completed** items live in [`completed/`](completed/). Remove rows here when closing an item out. Baselines: [`completed/jsonex-j-register-serialization-registry.md`](completed/jsonex-j-register-serialization-registry.md), [`completed/j-base-external-json-config-loader.md`](completed/j-base-external-json-config-loader.md), [`completed/abs-game-event-page-null-handling.md`](completed/abs-game-event-page-null-handling.md), [`completed/rmmz-engine-type-definitions-reconciliation.md`](completed/rmmz-engine-type-definitions-reconciliation.md). Recent feature closures: [`completed/ally-ai-combo-actions-review.md`](completed/ally-ai-combo-actions-review.md), [`completed/ally-dodge-skill-ai.md`](completed/ally-dodge-skill-ai.md), [`completed/j-otib-rewrite.md`](completed/j-otib-rewrite.md).
