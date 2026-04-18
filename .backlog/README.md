# JABS backlog (per-item)

Phase 3 and related work items live as **one markdown file each** under this directory.

## Layout

| Path | Contents |
|------|----------|
| [`unstarted/`](unstarted/) | Work not finished yet (`status: open`, or deferred / blocked items you still track here). |
| [`completed/`](completed/) | Shipped or abandoned-as-done items (`status: done`). Move the file here when closing it out. |
| This file | Conventions, template, and **unstarted inventory** table below. |

New entries belong in **`unstarted/`**. When an item is finished, set `status: done` in its frontmatter, **remove its row** from the inventory table below, and **move** the file into **`completed/`**.

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

## Unstarted inventory

Summary of every open item in [`unstarted/`](unstarted/): **severity**, **gain**, **one-liner**. Update this table whenever you add, rename, complete, or drop a backlog file.

| Item | Severity | Gain | One-liner |
|------|----------|------|-----------|
| [abs-debug-and-placeholder-logging](unstarted/abs-debug-and-placeholder-logging.md) | Low–medium | Low effort, medium polish | Remove `omg` / `did the thing` / vague warns; consistent `[JABS]` diagnostics or debug flags. |
| [abs-facing-validation-dry](unstarted/abs-facing-validation-dry.md) | Low–medium | Medium DRY | One helper for unsupported facing / dir8 validation shared by `JABS_Engine` and `Spriteset_Map`. |
| [abs-game-event-page-null-handling](unstarted/abs-game-event-page-null-handling.md) | **High** if hit | **High** for small fix | Stop logging entire `$dataMap.events` / `$gameMap._events` on null `Game_Event#event()`; safe minimal logging. |
| [abs-game-unit-inbattle-semantics](unstarted/abs-game-unit-inbattle-semantics.md) | Medium–high interop | Medium–high | `Game_Unit#inBattle` always true under ABS — document, narrow, or add explicit helper for plugins. |
| [abs-global-cooldown-implementation](unstarted/abs-global-cooldown-implementation.md) | Low until used | Medium–high pacing | Implement global cooldown slot behavior promised in `J.ABS.Globals.GlobalCooldownKey` JSDoc. |
| [abs-skill-slot-combo-fallback](unstarted/abs-skill-slot-combo-fallback.md) | **High** correctness | **High** trust | `getSlotComboId` must not silently return `1` when the slot key is missing. |
| [abs-spriteset-refresh-character-sprites-hardening](unstarted/abs-spriteset-refresh-character-sprites-hardening.md) | Medium if broken | **High** confidence | Prove or fix `refreshAllCharacterSprites` (party cycle, allies, followers) per author TODO. |
| [ally-dodge-skill-ai](unstarted/ally-dodge-skill-ai.md) | Low–medium (balance) | Medium–high combat feel | Allies never evaluate dodge skills; extend ally AI to use them with sane cooldowns. |
| [boolean-notetag-regex-audit](unstarted/boolean-notetag-regex-audit.md) | **High** if wrong | **Very high** correctness | Dedicated sweep of `checkForBooleanFromNoteByRegex` + negatively named tags. |
| [bonus-hit-type-split](unstarted/bonus-hit-type-split.md) | Medium (balance) | Medium–high for designers | Split bonus-hit pools for basic vs skill vs all actions. |
| [build-tools-linting](unstarted/build-tools-linting.md) | Medium | **Very high** once CI enforces | ESLint, annotation validation, dead-code warnings, build sanity. |
| [cached-actions-map](unstarted/cached-actions-map.md) | Low–medium | Medium perf / clarity | Wire `JABS_Engine.cachedActions` Map for O(1) live-action lookup. |
| [ca-mods-boundary](unstarted/ca-mods-boundary.md) | Low–medium | Medium clarity | Policy for `__ca-mods` vs reusable plugins. |
| [cross-plugin-prototype-hook-surface](unstarted/cross-plugin-prototype-hook-surface.md) | High maintainability | **High** | Inventory `JABS_Engine`, `Game_Action`, `Scene_Map`, `JABS_AiManager`, `Game_Unit`, etc. |
| [database-rpg-skill-augmentation-chain](unstarted/database-rpg-skill-augmentation-chain.md) | Medium | Medium | Document / dedupe seven `RPG_Skill` augmentation chains. |
| [enemy-elite-states-notetag-extension](unstarted/enemy-elite-states-notetag-extension.md) | Medium | **High** tuning | Tier stats on named enemies; elite/boss passive states as knobs; configurable enemy notetag + spawn wiring. |
| [flat-exp-per-level-reward-system](unstarted/flat-exp-per-level-reward-system.md) | **High** (progression) | **Very high** | Flat EXP per level (e.g. 1000); baseline + DB bonus; delta switch; tier %; LevelMaster policy; JABS `gainBasicRewards`; retire reward `LevelScaling` overlap; data migration. |
| [ext-star-completion](unstarted/ext-star-completion.md) | **High** if Star used | **High** feature unblock | Finish Star ABS flow (enemy spawn, missing map). |
| [game-action-battler-uuid-refactor](unstarted/game-action-battler-uuid-refactor.md) | **High** if casual | **High** if done right | UUID vs id/index for `Game_Action` on map + saves. |
| [game-character-action-sprite-lifecycle](unstarted/game-character-action-sprite-lifecycle.md) | Medium | Medium | Action-sprite flags: `Game_Character` vs `JABS_Action` / Popups. |
| [j-base-external-json-config-loader](unstarted/j-base-external-json-config-loader.md) | Medium | **High** DRY | Central J-Base JSON file load + parse + errors. |
| [jabs-engine-loot-action-director](unstarted/jabs-engine-loot-action-director.md) | Low–medium | Medium–high | Extract loot/action helpers from mega-`JABS_Engine`. |
| [jafting-freestyle-implementation](unstarted/jafting-freestyle-implementation.md) | Low | Feature-dependent | Real freestyle ext or remove template scaffolding. |
| [jafting-heavy-scenes-decomposition](unstarted/jafting-heavy-scenes-decomposition.md) | Low player / medium dev | Medium | Split huge JAFTING scenes for complexity targets. |
| [j-otib-rewrite](unstarted/j-otib-rewrite.md) | Low until OTIB matters | **High** after rewrite | Passive core+ext; OTIB ext + states + UI + optional DiaLog; defer legacy patches. |
| [jsonex-j-register-serialization-registry](unstarted/jsonex-j-register-serialization-registry.md) | Medium–high long-term | **Very high** | `J.register` + `JsonEx` registry in J-Base. |
| [pixel-angled-projectiles](unstarted/pixel-angled-projectiles.md) | Medium | **High** feel | Angled projectiles with Pixelistics + JABS. |
| [pixel-per-enemy-hitbox-size](unstarted/pixel-per-enemy-hitbox-size.md) | Low–medium | Medium–high tuning | Per-enemy hitbox radius notetag + clamp rules. |
| [proficiency-actor-conditionals-map-todo](unstarted/proficiency-actor-conditionals-map-todo.md) | Medium large rosters | Low effort, clarity | Drop hardcoded actor 1–6 map in Proficiency metadata. |
| [repo-unit-testing](unstarted/repo-unit-testing.md) | Medium | **High** over time | Expand Vitest coverage where harness exists. |
| [sdp-plugin-revisit](unstarted/sdp-plugin-revisit.md) | Medium | **High** consistency | SDP hygiene: JSON helper, scenes, tests. |
| [style-optional-chaining-drift](unstarted/style-optional-chaining-drift.md) | Low / medium style | Low effort | Remove `?.` drift; ESLint enforcement. |
| [team-parameterization](unstarted/team-parameterization.md) | Medium multi-faction | **High** extensibility | Data-driven friendly/opposing teams. |
| [textpop-builder-extension-placement](unstarted/textpop-builder-extension-placement.md) | Medium | Medium–high architecture | `TextPopBuilder` extensions under Popups ownership. |

**Completed** items: move to [`completed/`](completed/) and delete their row from the table above.
