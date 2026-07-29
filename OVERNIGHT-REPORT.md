# Overnight test pass — 2026-07-27 → 2026-07-28

**Baseline HEAD:** `53518f21bacefd705a6942c3b4d8b0f7bd48293d`
**Branch:** `feat/testplay-rebalancing-fixing`
**Commits made:** none, by instruction. Everything below is uncommitted working-tree change.

## Baseline (with `abs/ext/star` newly excluded)

```
Statements   : 90.80% ( 31282/34451 )
Branches     : 87.13% ( 12304/14121 )
Functions    : 92.39% (  6754/ 7310 )
Lines        : 91.16% ( 29279/32117 )
Test files   : 663    Tests: 10403 (all passing)
```

## Targets

| # | Plugin | Uncov stmts | Status |
|---|--------|------------:|--------|
| 1 | omni/core | 20 | pending |
| 2 | pixel/ext/abs | 342 | pending |
| 3 | extend/core | 180 | pending |
| 4 | hud/ext/quest | 21 | pending |
| 5 | popups/ext/sdp | 8 | pending |
| 6 | popups/core | 133 | pending |
| 7 | extend/ext/abs | 6 | pending |
| 8 | level/ext/sync | 39 | pending |
| 9 | apt/ext/typed | 85 | pending |

## Config change

- `vitest.config.js` — added `'**/src/plugins/abs/ext/star/**'` to the coverage `exclude` list, per your
  request. Commented as a temporary silence to be deleted when the plugin is finished, not a permanent
  exemption. This is why the baseline reads 90.80% where the earlier run read 90.24%: star's 214
  permanently-dead statements left the denominator.

---

# FINDINGS — all six resolved 2026-07-28

## F1. RESOLVED 2026-07-28 — was substantially overstated; one real site, now fixed

**Status: FIXED.** Read this correction before the original claim, which was wrong.

**What I originally reported:** that 5 of 11 JABS action-build call sites bypass skill extension,
because they use `Game_Action#setItemObject` (which applies no overlay) rather than `#setSkill`
(which does).

**Why that was wrong:** `setItemObject` is not where extension is decided — what matters is how the
*skill object handed to it* was obtained. Four of the five sites already resolve through an
extension-aware path before calling it:

| Site | How the skill is obtained | Extended? |
|------|---------------------------|-----------|
| `JABS_AI.js:125` | `user.getSkill(skillId)` | yes |
| `JABS_AI.js:417` | `healerBattler.skill(skillId)` | yes |
| `JABS_AI.js:451` | `healerBattler.skill(skillId)` | yes |
| `JABS_AI.js:469` | `healerBattler.skill(skillId)` | yes |
| `JABS_EnemyAI.js:534` | `$dataSkills[skillId]` | **no** |

`JABS_Battler#getSkill` delegates to `getBattler().skill(skillId)`, and `extend/core` overwrites
`Game_Battler#skill` to route through `OverlayManager.getExtendedSkill`. So the mechanism I named was
the wrong one, and the real count was 1, not 5.

**The one real site**, in `filterSkillsHealerPriority`'s ranking loop: the raw `$dataSkills[skillId]`
lookup returns the un-extended row, so a caster carrying an overlay for a heal would rank its options
using the base formula and then execute the overlaid one.

**The fix** (JE's call, 2026-07-28):

```diff
- const skill = $dataSkills[skillId];
+ const skill = user.getSkill(skillId);
```

This also brings the line in line with the codebase convention of resolving through the battler rather
than indexing the database directly, and matches the sibling call at `JABS_EnemyAI.js:328`.

**Live impact in CA: none that I can demonstrate.** I initially claimed otherwise and was wrong on both
examples I cited:

- Skills 189-194 (including "Heal", 194) are targeting-system test data, not real content — per JE.
- "Mystic Focus" (124), extended by "Fractal Aura" (127), *is* an HP-recovery skill, but no class
  learns it and no enemy carries it as an action, so nothing routes it through healer ranking today.

So this is a latent correctness fix, not a behaviour change to expect in play.

**Tests:** two added in `test/plugins/abs/core/models/jabs-enemy-ai.test.js` under
`filterSkillsHealerPriority() skill-ranking loop` — one proving the ranking follows the
extension-resolved skill, one proving an unextended skill ranks identically either way. The shared
`buildBattler` stub's `getSkill` was also corrected: it previously ignored its `skillId` argument and
returned a fixed object, which could not stand in for real resolution.

**Still open, not touched:** RMMZ's own `Scene_ItemBase` (inherited by `Scene_Skill`) calls
`setItemObject(this.item())` in four places, passing a *skill* in the skill menu. Menu-used skills
therefore still skip their overlays. That is engine-side rather than JABS-side, and a separate decision
from the one made here.

**Other raw database reads I noticed but did not touch** (out of scope for this fix):
`JABS_GlobalCooldown.js:75`, `JABS_SkillSlot.js:573`, and `JABS_Battler.js:2475/2492/2509`. The
`JABS_Battler` three only read `stypeId`, which extension explicitly does not override, so they are
harmless. The other two are worth a look when you are next in those files.

## F2. RESOLVED 2026-07-28 — dead retreat hysteresis removed

**Status: FIXED** (JE: "just remove it. The way it works now is more than sufficient.")

`src/plugins/pixel/ext/abs/objects/JABS_Battler.js` — deleted the nine-line block that defined a 0.25
tile hysteresis and returned when `currentDistance >= closeDistance + hysteresis`. That condition was
unreachable: the guard above it already returns unless `isClose(currentDistance)` is true, and
`isClose` is `distance <= closeDistance`, so the hysteresis comparison could never hold.

Removing it changes no behaviour — it only deletes a comment that described a policy the code never
applied. `JABS_Battler.js` went from 99.68% to **100% statement coverage** as a result, since the dead
line was the only uncovered statement in the file.

## F3. RESOLVED 2026-07-28 — dead guards removed, duplicate implementations collapsed

**Status: FIXED** (JE: "Nuke the guards. collapse the implementations and share where applicable.")

### What was wrong

Two dead guards, in two near-duplicate copies of the same method:

```js
const party = [ player ].concat(followers);
const selfIsParty = party.includes(this);
if (selfIsParty === false)
{
  if (player !== this && ...)          // dead: `this` cannot be the player here
  followers.forEach(f =>
  {
    if (f === this) return;            // dead: `this` cannot be a follower here
```

`party` is built from `player` and `followers`, and the block only runs when `this` is in neither. Both
guards were unreachable, in both `pixel/core` and `pixel/ext/abs`.

Confirmed empirically against the real vendored engine: `Game_Followers.setup()` populates `_data`
exclusively with `Game_Follower` instances, nothing in `src/plugins/**` overrides `setup` or pushes
into `_data`, and no follower can escape the party check.

### The party-cycling quirk was real, but elsewhere

`abs/ext/allyai/managers/JABS_Engine.js` carries the actual fix, commented *"grab the current data for
removing after to prevent duplicate players"* — an ex-leader's **JABS_Battler** staying registered as
the player-battler after a cycle. That is battler registration inside `JABS_AiManager`, not the
`Game_Followers._data` array, and the collision guards could never have helped: they compare
characters, the duplication was among battlers.

### Why the two implementations existed

Only the geometry differed:

- **core** compared square footprints centred on raw `x`/`y`, ignoring collision pivots entirely.
- **ext** compared pivot-anchored rectangles built from `getCollisionPivotX/Y` and `_pixelHitbox`.

Core's pivot-blindness happened to be harmless *only* because every participating character overrides
`getCollisionPivotY` to the same `0.70` (`Game_Player`, `Game_Follower`, `Game_Event` in pixel/core), so
the offsets cancelled on both sides of the comparison. The moment a character carries a different pivot
— exactly what `pixel/ext/abs`'s `Game_Event.getCollisionPivotY` does for feet-anchored enemy hitboxes
— core's version is wrong. That is why the ext override existed.

So the ext version was never a variant: it is the general case, and core's was a special case of it that
agreed by coincidence.

### What changed

`pixel/core/objects/Game_CharacterBase.js` now owns one pivot-aware implementation, split into three
reusable pieces:

- `getCollisionCandidates()` — the candidate gathering both copies shared verbatim
- `getCollisionAabbAt(logicalX, logicalY, halfRadius)` — the pivot-anchored footprint builder
- `collisionAabbsOverlap(a, b)` — module-scoped rectangle overlap test
- `isCharacterCollisionAt()` — now six lines composing the above

`pixel/ext/abs/objects/Game_CharacterBase.js` deletes its entire `isCharacterCollisionAt` override
(**236 → 89 lines**). The ext's per-`Game_Event` `_pixelHitbox` / `getCollisionPivotY` /
`getEffectiveRadius` overrides now flow into the shared implementation through ordinary polymorphism,
which is what they were always meant to do.

`pixel/ext/abs/objects/Game_Event.js` — `getPixelAbsHitboxTileAabb` was computing the identical
rectangle by hand; it now delegates to `getCollisionAabbAt` (17 lines → 6).

**Behaviour is unchanged.** For uniform pivots the two geometries are algebraically identical
(`|(px + p) − (cx + p)| = |px − cx|`), and the only non-uniform pivots in the codebase are the ext's
own, which already used the surviving implementation. The deliberate "extra defense" JABS-action skip
inside the probe loop was preserved.

**Net:** 261 deletions against 106 insertions across the refactor, and
`pixel/ext/abs/objects/Game_CharacterBase.js` went from 98.70%/97.67% to **100%/100%** coverage — the
dead guards were precisely its uncovered branches.

### Still worth a look, untouched

`pixel/core/objects/Game_CharacterBase.js` and its ext sibling still both define
`isOverlappingSolidTiles`, and the ext version genuinely differs (it branches on
`hasCustomPixelHitbox`). That one is a real override, not a duplicate, so it was left alone.

## F4. RESOLVED 2026-07-28 — dangling extension ids now fail loudly and consistently

**Status: FIXED** (JE: "Let it crash loudly... that's a data error and there shouldn't be silent fallback.")

Previously a missing database row behaved two different ways: it threw an opaque
`TypeError: Cannot read properties of undefined (reading '_clone')` when overlays existed, and returned
`undefined` silently when they did not.

`OverlayManager` now routes every database read through one guard:

```js
static #requireDatabaseEntry(entry, kind, id)
{
  if (!entry)
  {
    throw new Error(`Extension targets a ${kind} id that does not exist: ${id}. Check your <extend:> data.`);
  }

  return entry;
}
```

Applied at all four points a row is fetched — `getExtendedSkill`, `getExtendedState`, and both private
`#getExtended*` helpers — so the casterless path no longer silently returns nothing either. The error
names the id, which the old TypeError did not.

Six tests cover it in `overlay-manager-resolution.test.js`: with overlays, without overlays, and with
no caster/battler at all, for both skills and states.

**Worth watching during playtest:** this is the resolution path behind every `battler.skill(id)` call,
so any code probing an id that does not exist will now crash rather than degrade. That is the intent,
but it is a wider surface than the extension case alone. `JABS_Battler#getSkill` already guards falsy
ids, and skill slots use `0` for empty, which the pre-existing `skillId <= 0` check rejects first.

### F4 follow-up: where the loud crash can actually surface (audited 2026-07-28)

JE's prediction — *"it will surface anywhere we're trying to call directly instead of from a
`battler.skill(...)` execution"* — is correct. There are exactly four direct callers of the resolution
entry points outside `Game_Battler` itself:

| Caller | Guards a falsy id? | Notes |
|---|---|---|
| `extend/core/objects/Game_Battler.js:16,28` | n/a | the canonical path (`skill()` / `state()`) |
| `extend/core/objects/Game_Action.js:24` | yes, via `this.subject()` | the plugin's own integration point |
| `cms/ext/skill/windows/Window_SkillDetail.js:72` | `if (!this._skillId) return null` | deliberate, see below |
| `extend/ext/sks/windows/Window_SkillEquipDetail.js:17` | `if (!this._skillId) return null` | deliberate, see below |

**The two window callers are not accidents.** `battler.skill(id)` does not exist in vanilla RMMZ —
`extend/core/objects/Game_Battler.js` creates it. So a window that must still render when J-Extend is
absent cannot route through it; `Window_SkillDetail` even falls back to `$dataSkills[this._skillId]`
behind a `J.EXTEND &&` check. Calling `OverlayManager` directly is the correct shape there, and neither
window needs changing.

Both guard falsy ids, so neither can crash on an empty slot. They can only trip the new guard on a
truthy id with no database row behind it — which is precisely the data error the guard exists to catch.

**Pre-flight against CA's data: clean.** Checked every `<extend:[...]>` target in `Skills.json` and
`States.json`, every skill a class learns, and every skill an enemy acts with, across 2600 skills and
1600 states: **no dangling ids**. Booting the game will not trip the guard.

**One residual risk, unverified:** a save file holding a skill or state id that was later deleted from
the database would now crash on load rather than degrade. `chef-adventure/save/*.rmmzsave` is not
plain zlib-framed so I could not decompress it to check. Loading each existing save once after
`bun run hotfix` is the cheap way to find out — and if one does crash, it is reporting a real
inconsistency between that save and the current database, which is the intended behaviour.


## F5. RESOLVED 2026-07-28 — JsonMapper strips the quotes RMMZ leaves on list entries

**Status: FIXED** (JE: "Strip the fucking quotes out of the list in JsonMapper.")

`JsonMapper.parseString` now peels one matching pair of surrounding double quotes before interpreting
a token, via a new `unquoteString` helper:

```
'["physical","7"]'  ->  [ 'physical', 7 ]      (was [ '"physical"', '"7"' ])
'["true","false"]'  ->  [ true, false ]        (was [ '"true"', '"false"' ])
```

Stripping happens at interpretation time rather than in the array splitter, so a quoted token resolves
to its real type — a quoted number becomes a number, a quoted boolean becomes a boolean. Only a
*matching* pair is peeled, so unbalanced or interior quotes are left alone.

**Blast radius, measured rather than assumed.** I diffed old-vs-new parsing across every list-shaped J
plugin parameter in CA's `plugins.js`, then traced each consumer:

| Parameter | Parsed by | Affected? |
|---|---|---|
| `j/abs/J-ABS [elementalIconData]` | `JSON.parse` via `TranslateElementalIcons` | no |
| `j/abs/J-ABS [globalCooldownSkillTypes]` | `JSON.parse` in `_pluginMetadata` | no |
| `j/sks [equippable-skill-type-ids]` | `JSON.parse` | no |
| `j/regions [globalDenyRegions]` | `JSON.parse` via `translateRegionIds` | no |

Every one of them bypasses `JsonMapper` and calls `JSON.parse` on the raw string directly. The only
production consumer of `JsonMapper.parseObject` on a *list* parameter is
`apt/ext/typed`'s `excludedAlignmentElements`, which CA currently has set to `"[]"`.

The remaining `parseObject` call sites parse **note tags and event comments**
(`_base/objects/Game_Event.js`, `omni/ext/quest`, `message/core`, `pixel/ext/abs`'s hitbox tags), where
values are hand-authored and unquoted. Scanned all 383 files in `chef-adventure/data/` for a note tag
carrying a quoted value: **zero hits**.

So nothing in CA parses differently today. The fix unblocks `excludedAlignmentElements` the moment it
is populated, and unblocks any future list parameter routed through `JsonMapper`.

Eleven tests added in `json-mapper.test.js` covering the quoted-list cases and `unquoteString`'s edges
(unbalanced quotes, lone quote, empty string, doubly-encoded, interior quotes).

## F6. RESOLVED 2026-07-28 — inference thresholds converted from percent points to rate factors

**Status: FIXED** (JE: "Divide by 100 is the common pattern I use so that I can write comfortably in my
tags, because writing 0.75 when i mean 75% is dumb.")

`apt/ext/typed/_metadata/_pluginMetadata.js` now divides both thresholds by 100, matching the
percent-point convention already used in `crit/core`'s `#parsePercentFactorOr` and throughout `diff`,
`drops`, and `elem`:

```js
this.ResistThreshold = JsonMapper.parseObject(p['resistThreshold']) / 100;
this.SlayerWeaknessThreshold = JsonMapper.parseObject(p['slayerWeaknessThreshold']) / 100;
```

**`ImplicitEnemyElementPercent` was deliberately left alone** — it is already divided at its use site
(`apt/ext/typed/managers/JABS_Engine.js`: `Math.ceil(baseActualAp * implicitEnemyPct / 100)`), so
converting it here would have double-divided it.

Verified against CA's real configuration (`resistThreshold: "75"`, `slayerWeaknessThreshold: "125"`):

```
resistThreshold  75  -> 0.75
slayerThreshold 125  -> 1.25

  rate 0.25  -> alignment: true   taxonomy: false
  rate 0.5   -> alignment: true   taxonomy: false
  rate 0.75  -> alignment: false  taxonomy: false
  rate 1.0   -> alignment: false  taxonomy: false
  rate 1.25  -> alignment: false  taxonomy: false
  rate 1.5   -> alignment: false  taxonomy: true
  rate 2.0   -> alignment: false  taxonomy: true
```

Which is the documented rule set. Before the fix, `rate < 75` was true for every element and
`rate > 125` was true for none — so every enemy would have registered as aligned to every non-prefixed
element and as no taxonomy at all.

---

# CLEANUP CANDIDATES — not touched, no behaviour at stake

`OverlayManager.js` lines 795, 876-877, 968 are the only remaining uncovered branches, and all four are
unreachable defensive fallbacks of the kind your guidelines call out:

- `:795` — `(note.split(/[\r\n]+/) || [])`. `String#split` always returns an array; the `|| []` is dead.
- `:876-877` — `(line.match(/</g) || []).length`. Reached only after `:869` has already confirmed the
  line both starts with `<` and ends with `>`, so neither match can be null.
- `:968` — `if (mergedOrder.includes(key) === false)` inside `appendKey`. Each key is appended at most
  once by construction, so the "already present" side never runs.

Deleting them would be a readability improvement, not a fix, so I left them alone.

---
## 4-9. Remaining targets — ALL DONE

| Plugin | Stmts before | Stmts after | Branch before | Branch after |
|---|---:|---:|---:|---:|
| `omni/core` | 39.39% | **100.00%** | 71.43% | **100.00%** |
| `pixel/ext/abs` | 49.03% | **99.70%** | 35.64% | **99.20%** |
| `extend/core` | 72.05% | **99.69%** | 49.44% | **98.50%** |
| `hud/ext/quest` | 55.32% | **100.00%** | 63.64% | **100.00%** |
| `popups/ext/sdp` | 57.89% | **100.00%** | 0.00% | **100.00%** |
| `popups/core` | 62.22% | **100.00%** | 52.07% | **100.00%** |
| `extend/ext/abs` | 62.50% | **100.00%** | 100.00% | **100.00%** |
| `level/ext/sync` | 66.38% | **100.00%** | 55.17% | **100.00%** |
| `apt/ext/typed` | 66.93% | **100.00%** | 65.31% | **96.94%** |

**Whole codebase:** 90.80% → **93.21%** statements, 87.13% → **90.55%** branches,
92.39% → **93.85%** functions. Test count 10,403 → **11,020** (617 new tests, 23 new files).
Suite runs in ~14s. `bun run lint` is clean.

New fixtures / fixture additions:
- `test/plugins/omni/_component/fixtures/install-omni-host-globals.js` (new — omni had none)
- `setPluginContextToJHudQuest` added to the hud fixture
- `setPluginContextToJPopupsSdp` added to the popups fixture
- `setPluginContextToJExtendAbs` added to the extend fixture

---

# CLEANUP CANDIDATES (second batch) — not touched

- `src/plugins/apt/ext/typed/database/RPG_Enemy.js:156-166` — the uniquify pass is dead. Each element
  id is pushed at most once, because the `prefixed === false` and `prefixed === true` blocks are
  mutually exclusive and the loop visits each id once. `seen` can never report a hit.
- `src/plugins/pixel/ext/abs/objects/JABS_Battler.js:405` — the final `else if (dir === LEFT)` has an
  implicit else that cannot run; the `directions` array is a local literal containing exactly the eight
  handled codes.

---

# HOW TO REVIEW THIS

1. Everything is uncommitted, on `feat/testplay-rebalancing-fixing`, baselined at `53518f21`.
   **Zero commits made.** This file (`OVERNIGHT-REPORT.md`, repo root) is untracked and is mine —
   move or delete it whenever you like.
2. **Production files changed (8):**
   - `_base/_utilities/JsonMapper.js` — strips quotes off JSON-encoded list entries (F5)
   - `abs/core/models/JABS_EnemyAI.js` — healer ranking resolves skills through the battler (F1)
   - `apt/ext/typed/_metadata/_pluginMetadata.js` — thresholds converted to rate factors (F6)
   - `extend/core/managers/OverlayManager.js` — success-rate operator (X1) + loud dangling-id guard (F4)
   - `pixel/core/objects/Game_CharacterBase.js` — single shared collision implementation (F3)
   - `pixel/ext/abs/objects/Game_CharacterBase.js` — duplicate override deleted (F3)
   - `pixel/ext/abs/objects/Game_Event.js` — AABB builder now delegates (F3)
   - `pixel/ext/abs/objects/JABS_Battler.js` — dead retreat hysteresis removed (F2)

   Plus `vitest.config.js` for the star exclude you asked for.
3. Everything else under `test/` is new tests and four fixture additions. The CA repo was not touched
   at all — `git status` there is clean.
4. **All six findings (F1-F6) are resolved.** Nothing is left waiting on a decision.

## ⚠️ Neither production fix is in the game yet

`bun run test` runs `build:all && vitest run`, so `out/` carries both fixes and all 78 plugins build
cleanly against them. But `build:all` does **not** copy anything outward — the shipped copies are still
the pre-fix versions:

```
out/extend/J-Extend.js                                          -> &&   (fixed)
project/js/plugins/extend/J-Extend.js                           -> ||   (stale)
../ca/chef-adventure/js/plugins/j/extend/J-Extend.js            -> ||   (stale)
```

The same applies to `J-ABS.js` for the F1 fix.

**Run `bun run hotfix` to propagate it** (that chain ends in `copy:to-all`). I deliberately did not run
it overnight, because it writes built files into the CA repo and that is an outward-facing change I did
not want to make while you were asleep. If you revert X1 instead, no rebuild is needed — the shipped
copies are already the pre-fix version.
