# JABS database tags — editor-first authoring (JABS 5.0 data track)

## Source

### Runtime (notetag surface today)

- `src/plugins/abs/core/database/` — augmented DB types:
  - `RPG_Skill.js`, `RPG_Enemy.js` / `RPG_BaseBattler.js`, `RPG_State.js`
  - `RPG_Class.js`, `RPG_Item.js`, `RPG_UsableItem.js`, `RPG_EquipItem.js`, `RPG_TraitItem.js`
- `src/plugins/abs/core/_metadata/initialization.js` — `J.ABS.RegExp.*` tables; comment on `loadExternalConfig` as first step moving config **out of notes**
- ABS extensions add more tags (Juice, Shield, Ally AI, …) on skills, actors, classes

### Authoring tool (`jmz-data-editor`)

| Database | Board | JABS UI today |
|----------|-------|----------------|
| Enemies | ✅ EnemiesBoard | ✅ Rich — battler data, AI traits, roles, configs, team |
| Skills | ✅ SkillsBoard | ✅ Partial — `SkillJabsExtensionsPanel`, juice options |
| States | ✅ StatesBoard | ✅ Partial — `StateJabsExtension` |
| Weapons | ✅ WeaponsBoard | ❌ Base parity only; no JABS panels |
| Armors | ✅ ArmorsBoard | ❌ Base parity only |
| Items | ✅ ItemsBoard | ❌ Base parity only |
| Actors | ❌ No board | ❌ |
| Classes | ❌ No board | ❌ |
| Global JABS | ✅ JabsConfigBoard | ✅ Teams, juice profiles (`config.jabs.json`) |

### Related completed / partial work

- [`team-parameterization.md`](../completed/team-parameterization.md) — **global** team rules in `data/config.jabs.json` only; does **not** cover per-entity database tags.
- [`jabs-5-static-engine-external-data.md`](../unstarted/jabs-5-static-engine-external-data.md) — mentions external JSON but focuses on engine refactor + global config; **this item owns the eight database types**.

## Context

JABS gameplay data still lives primarily as **hundreds of `<jabs…>` / `<actionId:…>` / AI / battler tags** scattered across actor, enemy, class, item, skill, weapon, armor, and state notes in RMMZ JSON. That is:

- Tedious and error-prone in the RMMZ editor note box
- Hard to audit, diff, and validate
- Already bypassed in practice — Chef Adventure authoring runs through **`jmz-data-editor`**

**Official™ direction:** **`jmz-data-editor` is the sole supported authoring surface for JABS database data.** RMMZ’s native database UI is for vanilla fields only (or read-only inspection). Notes remain the **on-disk transport** into `data/*.json` for the engine (round-trip pattern enemies/skills already use) unless/until a sidecar merge layer is added.

`J.ABS.Helpers.loadExternalConfig` established the precedent for **global** config externalization (`config.jabs.json`). This epic completes the shift for **per-id database rows** across all eight types.

## Goals

1. **Policy** — document in CA / plugin docs: do not hand-edit JABS tags in RMMZ; use jmz-data-editor.
2. **Coverage** — every JABS tag family has a typed editor panel (or shared component) on the correct board.
3. **Parity** — editor parsers stay aligned with `J.ABS.RegExp` / `RPGManager` getters (single source of truth for tag names).
4. **Validation** — editor rejects invalid combinations; optional CI/doctor script flags orphan or unknown tags in CA data.
5. **Migration** — one-time inventory + CA data pass; legacy raw notes still hydrate until panels exist.

## Non-goals (initially)

- Removing notes from shipped JSON (RMMZ still loads `Skills.json` etc.).
- Moving per-skill rows into `config.jabs.json` blobs (wrong tool; keep row data on row boards).
- Third-party RMMZ plugin compatibility for note-box authoring.

## Work (phased)

### Phase 0 — tag inventory & schema
- Generate checklist from `src/plugins/abs/core/database/*.js` + extension DB augments: tag name, owning type(s), parser regex, editor panel status.
- Publish inventory in backlog Notes or `docs/` when executing.

### Phase 1 — missing boards
- **Actors board** — identity + JABS-relevant fields (ally AI mode, battler hooks on `RPG_Actor` / `Game_Actor` notes).
- **Classes board** — bonus hits scopes, skill transforms, ally AI class mode, other `RPG_Class` JABS getters.

### Phase 2 — equip / item JABS panels
- Weapons / armors / items: JABS panels mirroring `RPG_EquipItem` / `RPG_TraitItem` / usable item tags (bonus hits, transforms, direct skills, etc.).
- Reuse trait/skill pickers from existing boards.

### Phase 3 — deepen partial boards
- Skills: full tag parity (range, shape, knockback, cast, direct, projectiles, …) beyond current extensions panel.
- States: full `StateJabsExtension` parity with runtime `RPG_State` JABS getters.

### Phase 4 — validation & policy
- Editor save validators; optional `tools/audit-jabs-notes.mjs` for CI.
- Update `.junie/guidelines.md` / CA onboarding: **editor-only** for JABS database authoring.
- Cross-link JABS 5.0 release notes when engine static + save slice land.

## Optional future (defer)

- **Sidecar overlay files** (`data/jabs/skills.json`) merged at boot — only if note round-trip becomes a bottleneck; editor would still be authoritative writer.

## Notes

- **jmz-data-editor** repo work dominates; rmmz-plugins changes are parser parity + docs unless sidecars are chosen.
- Pairs with: `editor-enemies-ai-behavior-tab.md`, `editor-ux-unification.md`, `game-system-j-namespace-save-slice.md`, `jabs-5-static-engine-external-data.md`.
- Chef Adventure (`ca/`) is the pilot consumer; no expectation that generic RMMZ users edit JABS notes by hand.