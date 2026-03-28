# JABS Phase 3 Backlog

Items deferred from the Phase 2 TODO triage. Each entry includes the source file and line number where the original TODO lived, and a description of the intended work.

---

## Completed

### AI unification + trait/role expansion — `feature/jabs-ai-unification` (PR #29)
All work below is done and merged:
- `JABS_BattleMemory` moved to core, shared by enemies and allies
- Shared filter/decide/support methods lifted into `JABS_AI` base class
- `JABS_BattlerRole` model added (6 roles: leader, follower, guardian, ward, solo, sentinel)
- `JABS_EnemyAI` rewritten: switch(this) bug fixed, 4 new traits added (cleanser, buffer, tactical, berserker), coordination decoupled
- `JABS_AllyAI` de-duplicated against base class, two bugs fixed
- `JABS_AiManager` coordination routing moved out of AI into manager
- Sentinel role behavior implemented: sentinels disengage when their target leaves their home sight radius
- Guardian role behavior implemented: guardians retarget to protect nearby ward-role allies under attack
- Ward role is passive; no behavioral code runs on wards directly

---

## Architecture / Structural Refactoring

### `cachedActions` Map implementation
- **File:** `src/plugins/abs/core/managers/JABS_Engine.js`
- **Context:** `cachedActions = new Map()` is defined on `JABS_Engine` but never read. The intent was to key actions by UUID for O(1) lookup rather than array scanning.
- **Work:** Wire up `cachedActions` as the primary store for live actions; replace all array-based action lookups with Map gets/sets/deletes.

### `Game_Action` battler UUID refactor
- **File:** `src/plugins/abs/core/objects/Game_Action.js` (lines 11, 42)
- **Context:** Battlers are currently tracked by reference. The TODO asks whether UUIDs should be used instead to survive serialization boundaries.
- **Work:** Decide on UUID vs reference, update `Game_Action` accordingly, audit all serialized models that hold battler references.

### Parry logic extraction from `requestAnimation`
- **File:** `src/plugins/abs/core/objects/Game_Action.js` (line 318)
- **Context:** Parry detection is currently embedded inside `requestAnimation`. It should live in its own method.
- **Work:** Extract parry check into a dedicated `applyParryLogic` or similar method; call it from `requestAnimation`.

### `Game_Character` action sprite getter/setter cleanup
- **File:** `src/plugins/abs/core/objects/Game_Character.js` (lines 37, 202)
- **Context:** The getters/setters for `needsAdding` / `needsRemoving` were noted as candidates for removal, with responsibility shifted to the action object itself.
- **Work:** Evaluate whether `JABS_Action` should own sprite lifecycle flags; migrate and remove from `Game_Character` if appropriate.

### Loot and action helpers lifted to a dedicated manager
- **File:** `src/plugins/abs/core/managers/JABS_Engine.js` (line 2710)
- **Context:** Several helper closures inside `JABS_Engine` were flagged for extraction into a reusable manager (e.g. a `JABS_LootDirector` or `JABS_ActionDirector`).
- **Work:** Identify the specific helpers at and around line 2710, extract to a named collaborator class, have `JABS_Engine` delegate.

### Team parameterization (opposing / friendly)
- **File:** `src/plugins/abs/core/__models/JABS_Battler/_reference.js` (lines 518, 529)
- **Context:** "Opposing teams" and "friendly teams" are hardcoded as constants. The TODO asks for this to be data-driven so custom team configurations are possible.
- **Work:** Move team definitions into a configurable structure (plugin params or a registry); update all team-check call sites.

---

## Feature Work

### Ally dodge-skill AI
- **File:** `src/plugins/abs/ext/allyai/managers/JABS_AiManager.js` (line 443)
- **Context:** Allies cannot currently use dodge skills. The AI needs to evaluate when it is appropriate to dodge (e.g. low HP, incoming attack pattern).
- **Work:** Add dodge-skill usage to ally AI decision tree; test edge cases around dodge timing.

### Bonus hit type split (basic attack vs skill vs all)
- **File:** `src/plugins/abs/core/__models/JABS_Battler/_reference.js` (line 1548)
- **Context:** Bonus hits from equipment/states are currently pooled. The TODO asks to distinguish between bonus hits that apply only to basic attacks, only to skills, or to all actions.
- **Work:** Add separate notetag variants; split bonus hit accumulation into three buckets; apply the correct bucket per action type.

---

## Code Quality

### `Window_JabsRemapActions` review and improvement pass
- **File:** `src/plugins/abs/ext/input/windows/Window_JabsRemapActions.js`
- **Context:** This window was originally written by Junie. It works but the code quality was noted as poor. A full review pass with refactoring and cleanup is desired.
- **Work:** Review the full file; apply standard style, extract any repeated logic, improve readability.

---

## Incomplete Plugins (separate effort)

These are acknowledged as incomplete and should be tackled as their own dedicated PRs when ready.

### `ext/star` completion
- Dynamic enemy generation via a separate "enemy map" is partially implemented.
- `Game_Map.generateStarEnemy` contains confirmed broken logic (`$gameMap._events[index]` direct assignment).
- DataManager lacks an error throw when the required enemy map is missing.

### `ext/pixel` completion
- Pixel-perfect movement extension is partially implemented.
- Several internal methods have placeholder or stub logic.


### `cachedActions` Map implementation
- **File:** `src/plugins/abs/core/managers/JABS_Engine.js`
- **Context:** `cachedActions = new Map()` is defined on `JABS_Engine` but never read. The intent was to key actions by UUID for O(1) lookup rather than array scanning.
- **Work:** Wire up `cachedActions` as the primary store for live actions; replace all array-based action lookups with Map gets/sets/deletes.

### `Game_Action` battler UUID refactor
- **File:** `src/plugins/abs/core/objects/Game_Action.js` (lines 11, 42)
- **Context:** Battlers are currently tracked by reference. The TODO asks whether UUIDs should be used instead to survive serialization boundaries.
- **Work:** Decide on UUID vs reference, update `Game_Action` accordingly, audit all serialized models that hold battler references.

### Parry logic extraction from `requestAnimation`
- **File:** `src/plugins/abs/core/objects/Game_Action.js` (line 318)
- **Context:** Parry detection is currently embedded inside `requestAnimation`. It should live in its own method.
- **Work:** Extract parry check into a dedicated `applyParryLogic` or similar method; call it from `requestAnimation`.

### `Game_Character` action sprite getter/setter cleanup
- **File:** `src/plugins/abs/core/objects/Game_Character.js` (lines 37, 202)
- **Context:** The getters/setters for `needsAdding` / `needsRemoving` were noted as candidates for removal, with responsibility shifted to the action object itself.
- **Work:** Evaluate whether `JABS_Action` should own sprite lifecycle flags; migrate and remove from `Game_Character` if appropriate.

### Loot and action helpers lifted to a dedicated manager
- **File:** `src/plugins/abs/core/managers/JABS_Engine.js` (line 2710)
- **Context:** Several helper closures inside `JABS_Engine` were flagged for extraction into a reusable manager (e.g. a `JABS_LootDirector` or `JABS_ActionDirector`).
- **Work:** Identify the specific helpers at and around line 2710, extract to a named collaborator class, have `JABS_Engine` delegate.

### Team parameterization (opposing / friendly)
- **File:** `src/plugins/abs/core/__models/JABS_Battler/_reference.js` (lines 518, 529)
- **Context:** "Opposing teams" and "friendly teams" are hardcoded as constants. The TODO asks for this to be data-driven so custom team configurations are possible.
- **Work:** Move team definitions into a configurable structure (plugin params or a registry); update all team-check call sites.

### `showBalloon` abstraction on engage
- **File:** `src/plugins/abs/core/__models/JABS_Battler/_reference.js` (line 790)
- **Context:** `showBalloon(J.ABS.Balloons.Exclamation)` is called inline on engage. The TODO asks for an abstract method so subclasses or extensions can override balloon behavior.
- **Work:** Extract to `onEngage()` virtual method; call it from the engage path.

### Disengage balloon as a configurable feature
- **File:** `src/plugins/abs/core/__models/JABS_Battler/_reference.js` (was line 818, now removed)
- **Context:** A `showBalloon(Frustration)` on disengage was originally present but commented out after user feedback. The intent is to make this a full plugin-param-controlled feature (show balloon on disengage: on/off, which balloon to show).
- **Work:** Add plugin parameter to JABS core for disengage balloon toggle and balloon id; call conditionally in `disengageTarget`.

### `JABS_EnemyAI` unified return types
- **File:** `src/plugins/abs/core/__models/JABS_EnemyAI.js` (line 267)
- **Context:** Some AI decision methods return a single skill while others return a collection. The TODO asks to unify to always return a collection (even if length 1).
- **Work:** Audit all `JABS_EnemyAI` decision methods; normalize return types; update all call sites.

---

## Feature Work

### Ally dodge-skill AI
- **File:** `src/plugins/abs/ext/allyai/managers/JABS_AiManager.js` (line 443)
- **Context:** Allies cannot currently use dodge skills. The AI needs to evaluate when it is appropriate to dodge (e.g. low HP, incoming attack pattern).
- **Work:** Add dodge-skill usage to ally AI decision tree; test edge cases around dodge timing.

### Bonus hit type split (basic attack vs skill vs all)
- **File:** `src/plugins/abs/core/__models/JABS_Battler/_reference.js` (line 1548)
- **Context:** Bonus hits from equipment/states are currently pooled. The TODO asks to distinguish between bonus hits that apply only to basic attacks, only to skills, or to all actions.
- **Work:** Add separate notetag variants; split bonus hit accumulation into three buckets; apply the correct bucket per action type.

---

## Code Quality

### `Window_JabsRemapActions` review and improvement pass
- **File:** `src/plugins/abs/ext/input/windows/Window_JabsRemapActions.js`
- **Context:** This window was originally written by Junie. It works but the code quality was noted as poor. A full review pass with refactoring and cleanup is desired.
- **Work:** Review the full file; apply standard style, extract any repeated logic, improve readability.

---

## Incomplete Plugins (separate effort)

These are acknowledged as incomplete and should be tackled as their own dedicated PRs when ready.

### `ext/star` completion
- Dynamic enemy generation via a separate "enemy map" is partially implemented.
- `Game_Map.generateStarEnemy` contains confirmed broken logic (`$gameMap._events[index]` direct assignment).
- DataManager lacks an error throw when the required enemy map is missing.

### `ext/pixel` completion
- Pixel-perfect movement extension is partially implemented.
- Several internal methods have placeholder or stub logic.
