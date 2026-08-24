---
completed: 2026-06-09
ship: J-Level-Sync (out/level/ext/J-Level-Sync.js)
---

# Content level sync — dungeon / trial encapsulation (FF14-style)

## Source

- `src/plugins/level/core/objects/Game_Battler.js` — `getLevel()`, unified `level` / `lvl` getter; base + balancer + note sources.
- `src/plugins/level/core/objects/Game_Actor.js` — `getBattlerBaseLevel()` → `_level`; `paramBase()` indexes class curve by `Math.floor(this.getLevel())`.
- `src/plugins/level/core/objects/Game_Enemy.js` — `getCachedLevelOverride()` replaces base level when JABS event override is present.
- `src/plugins/level/core/managers/JABS_AiManager.js` — `postConvertMutate`: event comment `<level:N>` → enemy override + Natural refresh.
- `src/plugins/level/core/objects/Game_Event.js` — `getLevelOverrides()` parses `<level:N>` from event page comments.
- `src/plugins/level/core/objects/Game_Action.js` — `LevelScaling.multiplier(subject.level, target.level)` on damage.
- `src/plugins/level/core/managers/LevelScaling.js` — combat + reward scope clamps.
- `src/plugins/_base/objects/Game_Party.js` — `setLevel()` / `averageActorLevel()` (**not** the right primitive for encapsulation — mutates saved EXP).
- `src/plugins/_base/objects/Game_Actor.js` — `setLevel()` → `changeExp()`; `onLevelUp` / `onLevelDown` → `onBattlerDataChange`.
- `src/plugins/natural/core/objects/Game_Actor.js` — permanent growth applied on real `levelUp()`; `paramBase` bonuses stack on synced curve.
- `src/plugins/apt/core/_models/JABS_Battler.js` — AP gain gated by `actor.level - enemy.level` when threshold enabled.
- `src/plugins/level/ext/flat/` — kill EXP keyed on level difference vs party average or killer level.
- `src/plugins/map/core/objects/Game_Map.js` — precedent for map-note policy (`BlockMinimap`).
- `ca/docs/walk/chapter1.md` — level **recommendations** per dungeon (Pearl Salt Mines ~7–9); no enforcement layer today.

## Context

Chef Adventure is an on-map ARPG (JABS). **Level is a primary balance lever**: class param curves, J-LevelMaster scaling on damage / EXP / gold, formula tags (`a.level`), APT thresholds, danger indicators, and flat EXP tables all read **`battler.level`**.

Today, dungeon pacing is communicated as **recommendations** ("this area is ~level 50") but nothing **encapsulates** the party inside that band. Overleveled players trivialize tuned content via class-curve stats and scaling multipliers; underleveled players face the inverse. Gear, SDP panels, and learned skills further widen the spread.

**Design goal (2026-06 discussion):** FF14-style **content level sync** — when entering instanced content (dungeon, trial, raid, boss arena), the party **fights as level X** for the duration of that encapsulation. Real progression (`_level`, saved EXP, inventory) is **unchanged** on exit. **Gear stays equipped** and keeps its flat stat contributions; authors accept that strong gear may still trivialize some encounters (level sync targets the **level lever**, not full gear ilvl clamping).

### What already exists (partial solutions)

| Mechanism | Scope | Limitation |
|-----------|-------|------------|
| `$gameParty.setLevel(n)` (J-Base) | All party members | **Permanent** — rewrites EXP via `changeExp()` |
| `$gameParty.averageActorLevel()` | Reward math only | Aggregate for EXP; does not change combat stats |
| Event `<level:N>` + enemy override | Per JABS map enemy | **Enemies only**; proven at `postConvertMutate` |
| Actor `<level:N>` on states/equipment | Modifier on `getLevel()` | Build expression, not content policy |
| Variable balancers (`actorBalanceVariable`) | Global offset | Not map-scoped; affects whole game while set |

**Gap:** no **ephemeral, map-scoped overlay** on **actor** `getLevel()` — the mirror of enemy `cachedLevelOverride`.

### Why the ecosystem is ready

J-LevelMaster centralized reads on **`Game_Battler.prototype.getLevel()`**. Most level-centric plugins consume **`actor.level`**, not raw `_level`. Injecting a temporary effective level at that getter (or immediately after the normal computation for actors only) propagates through combat scaling, `paramBase`, live formulas, HUD, APT, and flat EXP — without rewriting JABS.

Enemy-side encapsulation is already shipped; player-side is the missing half of a symmetric design.

---

## Terminology

| Term | Meaning |
|------|---------|
| **Real level** | Saved `_level` / EXP on the actor; never mutated by sync |
| **Effective level** | Value returned by `getLevel()` while sync is active |
| **Content sync level** | The level X declared by a plugin command or map note |
| **Encapsulation** | Period during which sync is active (usually one trial or dungeon group) |
| **Cap-only sync** | `min(realLevel, X)` — overleveled players clamp down; underleveled stay at their real level. **Default.** |
| **Exact sync** | Every synced actor returns X regardless of real level (opt-in via uplevel flag) |

---

## Policy decisions (resolved)

### 1. Sync mode

- **Default (cap-only):** overleveled actors clamp to X; underleveled actors are unaffected.
- **Opt-in uplevel (exact):** enabled via `<levelSyncUp>` map tag paired with `<levelSync:N>`, or the `uplevel` boolean arg on the plugin command. Boosts underleveled actors to X as well.

Per-map note or plugin command argument controls which mode is active.

### 2. Party scope

All `$gameParty.members()` (battle + reserve) are synced. Mid-dungeon leader and bench swaps stay inside the bubble. Party size in CA is 6 (2 protags + 4 elementals).

### 3. What sync affects vs what it leaves alone

**Uses effective (synced) level:**

- `getLevel()` / `level` / `lvl` on actors while encapsulated
- Class `paramBase` curve (already reads `getLevel()`)
- `LevelScaling` combat + reward multipliers involving actors
- Formula evaluation where `a.level` is the synced actor
- HUD level display (with sync indicator — see UX)
- APT level-difference gate (actor side)
- J-Level-Flat kill rewards (killer / average party level)

**Explicitly unchanged (v1 non-goals):**

- Saved `_level`, EXP, or `setLevel()` side effects
- Equipment **flat** stats (`paramPlus` — weapon ATK, armor DEF, etc.)
- Learned skill list (level 90 kit remains available at synced 50 — known trivialization vector, accepted for v1)
- Permanent J-Natural growth already baked from real level-ups
- SDP panel investment (level-independent)
- Gear / state `<level:N>` modifier tags — **suppressed while encapsulated** (Option A: cleanest "you are level X" semantics)

**Known asymmetry (uplevel exact sync):** A real level-30 actor synced to 50 gets the class table at 50 but not the permanent Natural Growth a character who genuinely leveled 1→50 earned. Accepted for v1.

### 4. EXP inside the bubble

Default: **Normal** — kills award EXP using effective levels; real EXP accumulates toward real `_level`. Expose as plugin parameter (Normal / None / Reduced).

### 5. Session vs map-note priority

- **Session** (set by plugin command) is king — active session is never overridden or cancelled by a map note.
- **Map notes** activate sync only when no session is active.
- Map notes do **not** cancel an active session (even `<levelSync:0>` or no tag on a sub-map).
- Only the explicit `clearContentSync` plugin command ends a session.

Primary CA usage pattern: plugin command in a common event at trial entrance sets the session; matching clear command at exit ends it. Map notes are a convenience for standalone single-map areas with no session management.

### 6. Enemy parity

Not required for v1 — authors already place `<level:N>` on JABS events. Optional stretch: map note default enemy level when event has no override.

---

## Tag format (resolved)

```
<levelSync:N>            — activate cap-only sync at level N (N > 0)
<levelSyncUp>            — paired with <levelSync:N>; enables uplevel (exact sync)
```

Both tags are case-insensitive. `N` must be a positive integer greater than 0.

---

## Plugin commands (resolved)

Single command with args:

```
Command: setContentSync
  Args:
    level   {number}  — the sync level (required; > 0)
    uplevel {boolean} — if true, uplevel underleveled actors (default: false / cap-only)

Command: clearContentSync
  Args: none
```

---

## Proposed architecture

### Ship home

**J-Level extension** — `src/plugins/level/ext/sync/` → **`J-Level-Sync`**, `orderAfter J-LevelMaster`, `J.LEVEL.EXT.SYNC` namespace.

### State storage (ephemeral)

| Store | Field | Lifecycle |
|-------|-------|-----------|
| `$gameMap._j._level._contentSyncLevel` | `number \| null` | Parsed from map note on `Game_Map.setup`; null when no tag |
| `$gameMap._j._level._contentSyncUplevel` | `boolean` | Parsed from `<levelSyncUp>` on same setup |
| `$gameSystem._j._level._contentSyncSession` | `{ level, uplevel } \| null` | Set/cleared by plugin command; survives map transfers |

Session object lives on `$gameSystem` but is **not** intended as permanent save data — document that it clears on return to overworld via explicit plugin command.

### Read path (core hook)

Extend **`Game_Actor.prototype.getLevel`**:

1. Resolve active sync: session → map note → null.
2. If null, perform existing computation unchanged.
3. If non-null:
   - **Cap-only (default):** `Math.min(computedLevel, syncLevel)`
   - **Uplevel (exact):** return `syncLevel` directly (suppresses equipment `<level:N>` tags)

Re-entrancy safe with existing `_isComputingGetLevel` guard in `Game_Battler.getLevel`.

### Write path (activation / deactivation)

- **`Game_Map.setup`:** parse `<levelSync:N>` and `<levelSyncUp>` from map notes; store on map; refresh party stats if no active session.
- **Plugin commands:** `setContentSync` (sets session), `clearContentSync` (clears session + refreshes party).
- **On deactivate:** refresh party (`onBattlerDataChange` / Natural `refreshAllParameterBuffs` if loaded) so stats and HUD restore immediately.

Mirror enemy override refresh pattern:

```javascript
// precedent: JABS_AiManager.postConvertMutate after enemy override
if (J.NATURAL) battler.refreshAllParameterBuffs();
```

### UX / HUD

- Wherever level is rendered (HUD party frame, HUD target frame, main menu status, etc.), colorize the level text and render a "synced" icon alongside it when sync is active.
- **Synced icon index** defaults to **75** — exposed as a plugin parameter so authors can override.
- Plugin parameter gate: if icon index is 0, suppress the icon entirely (author opt-out).
- Phase 1 scope: HUD party frame + target frame. Main menu status deferred to Phase 2 (requires CMS augmentation).

---

## Work

### Phase 1 — Core runtime (ship blocker for CA trials)

1. **Scaffold** `J-Level-Sync` extension ship (`entry.js`, metadata, vite config, `plugins.js` slot after Level Master).
2. **`Game_Map` setup** — parse `<levelSync:N>` and `<levelSyncUp>` into `$gameMap._j._level` members; unit tests for note parsing.
3. **`Game_System` session** — session object on `$gameSystem._j._level._contentSyncSession`; `setContentSync` / `clearContentSync` plugin commands.
4. **`Game_Actor.getLevel` overlay** — cap-only + uplevel modes; actor-only; re-entrancy safe.
5. **Party refresh** on map setup (when no active session) and on session set/clear.
6. **HUD sync indicator** — augment HUD party frame and target frame level rendering: colorized text + icon index from plugin parameter (default 75).
7. **`_annotations.js`** — author-facing help: tags, commands, policy tables, CA examples, non-goals.
8. **Tests** (`test/plugins/level/ext/sync/`):
   - cap-only: real 90 → effective 50, real 30 → 30
   - uplevel (exact): real 90 → 50, real 30 → 50
   - `paramBase` uses synced level
   - equipment `<level:N>` tags suppressed in uplevel mode
   - no mutation of `_level` / EXP after encapsulation
   - session survives map transfer; map note does not override active session
   - `clearContentSync` restores real effective levels
9. **`bun run hotfix`** — lint, verify:ships, copy to `project/` + CA.

### Phase 2 — Game integration (Chef Adventure)

1. **Design doc stub** in `ca/docs/` — encapsulation policy for trials vs open world; cross-link walk level recommendations.
2. **Pilot map:** one trial or dungeon with `<levelSync:N>` (or session command at entrance NPC) aligned to existing recommendation text.
3. **Event script pattern** for multi-map instances (session set at entrance NPC, clear at exit crystal).
4. **Main menu / CMS status** sync indicator (real level secondary line if indicator enabled).
5. **Balance pass:** confirm overlevel + BiS gear still feels acceptable; tune enemy `<level:N>` + sync level together.

### Phase 3 — Optional stretch

1. Map-default enemy level (auto-override when event comment absent).
2. EXP mode parameter (None / Reduced) wired through JABS reward path.
3. Skill visibility gate above sync tier (large scope — separate backlog item if needed).
4. **jmz-data-editor** — map note field on Maps board for sync level (defer until tag stable).

---

## Acceptance criteria

1. Entering a map tagged `<levelSync:50>` (no active session) causes all party actors to report `level === 50` (cap) or `min(real, 50)` per mode for combat, scaling, and `paramBase`.
2. A session set via `setContentSync` survives map transfers and is not overridden by map notes.
3. Transferring to a map without sync (and no active session) restores real effective levels with no save mutation.
4. Real `_level` and EXP before and after a full dungeon run are identical (unless Normal EXP mode granted gains).
5. Enemy `<level:N>` overrides continue to work unchanged.
6. Plugin commands `setContentSync` / `clearContentSync` start and end session sync correctly.
7. Synced icon (default index 75) appears beside level text in HUD party and target frames while sync is active; absent when inactive.
8. Vitest coverage for cap/uplevel modes, session priority, and no-exp-mutation invariant.
9. Documented author guidance in `_annotations.js` reflects all policy decisions above.

---

## Interactions with other plugins

| Plugin | Interaction |
|--------|-------------|
| **J-LevelMaster** | Required base; scaling + `getLevel` contract |
| **J-Level-Flat** | Kill EXP uses effective level — confirm desired behavior under Normal EXP mode |
| **J-Natural** | Permanent growth stays; class curve follows sync; refresh on toggle |
| **J-APT** | Threshold uses effective actor level |
| **J-SDP** | Unaffected (panel stats) |
| **J-ABS** | No core changes required if `getLevel` hook is sufficient; verify danger indicator + reward choke points |
| **J-HUD Party / Target** | Sync indicator added in Phase 1 |
| **J-CAMods** | No change |

---

## Anti-patterns

- **`$gameParty.setLevel()` inside dungeon enter** — permanently rewrites progression; wrong tool.
- **Global `$gameVariables` level balancer** as a hack — affects overworld while set; use session sync instead.
- **Mutating `_level` directly** — breaks EXP integrity and level-up hooks.
- **Syncing only battle members** without documenting bench edge case — reserve member swap breaks encounter tuning.

---

## Notes

- Related: [`inanimate-enemies-no-exp-sdp-rewards.md`](inanimate-enemies-no-exp-sdp-rewards.md) (EXP policy on map objects); [`flat-exp-per-level-reward-system.md`](../completed/flat-exp-per-level-reward-system.md) (completed — reward tables); [`ca-protag-class-job-tree-system.md`](ca-protag-class-job-tree-system.md) (class unlocks may use level criteria — sync must **not** satisfy real-level gates outside instance).
- FF14 also scales **gear ilvl** down in synced content — explicitly **out of scope v1** per design discussion; revisit as `level-sync-gear-scaling` if trivialization becomes a problem.
- Skill kit at synced level (hide high-tier skills) is a **separate feature** if needed — do not block Phase 1 on it.
- Party size **6** (2 protags + 4 elementals): sync all members so elemental swaps respect instance level.

---

## Completion notes (2026-06-09)

Phase 1 shipped as `J-Level-Sync` (`src/plugins/level/ext/sync/`). All Phase 1 acceptance criteria met and verified in-game.

### What shipped

- `Game_Actor.getLevel()` overlay — cap-only (`Math.min`) and uplevel (exact) modes; real `_level` and EXP never touched.
- `Game_System` session (`setContentSync` / `clearContentSync` plugin commands) survives map transfers.
- `Game_Map.setup` parses `<levelSync:N>` and `<levelSyncUp>` from map notes; map-note sync never overrides an active session.
- `Game_Map.initialize` alias ensures `_j._levelSync` state exists before `setup()` — required because `getLevel()` is called during J-Natural growth init on new game before any map is loaded.
- Party-wide refresh (`onBattlerDataChange` + `refreshAllParameterBuffs` if J-Natural loaded) fires on session set/clear and on map setup when no session is active.
- HUD party frame (`Sprite_ActorValue`) — level parameter shows `050 (101)` format (synced level + real level in parens) with a blue-tinted outline and a `Sprite_Icon` child sprite (icon index from plugin parameter, default 75) that shows/hides each tick based on sync state.
- HUD target frame (`Window_TargetFrame`) — sync icon + blue colorize prepended to level string via `drawTextEx` escape codes.
- 12 Vitest tests covering cap-only, uplevel, session priority, map-note fallback, `_level` immutability, and EXP gate.

### Non-obvious implementation decisions

- **`PLUGIN_NAME` must match the output filename exactly** (`'J-Level-Sync'`, not `'J-LEVEL-Sync'`) — RMMZ keys `PluginManager.registerCommand` by the JS filename, not an internal name.
- **`Sprite_Icon` child sprite pattern** used for the HUD icon (not `bitmap.blt`) — positioned at `x = -ImageManager.iconWidth` so it sits left of the text origin without widening the bitmap.
- **`getActorValue()` override** for the `SYNCED (REAL)` display format — cleaner than restructuring `createBitmap`; reads `actor._level` directly for the real value since `getLevel()` would return the synced value.
- **EXP gate** (`syncAffectsExp = false` default): `getLevelForExp()` returns `_level` directly, preserving J-Level-Flat's level-difference EXP policy.

### Phase 2 / stretch still open

- Main menu / CMS sync indicator (deferred — requires CMS augmentation).
- Map-default enemy level auto-override.
- EXP mode parameter (None / Reduced).
- jmz-data-editor map note field for sync level.
