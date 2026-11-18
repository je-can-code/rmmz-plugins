---
completed: 2026-11-17
ship: J-SDP 4.10.0
---

# SDP blackout: `<sdpBlackout>` darkens every panel an actor has ranked

## Severity

**Medium.** Nothing is broken. Chef Adventure's final boss, Grudj, needs it: his scrambler machine's scramble carries
"a 15-second full SDP disable" (story canon), and Trainer Lord's postgame exam wants the same thing for a whole fight.

## Gain

A state (or any note source) can switch an actor's panels off without touching a single rank. Every panel bonus in the
ecosystem goes dark at once, because every one of them already flows through four J-SDP methods.

## Decided with Jeremy (2026-11-16)

- "Oh it's most certainly a real blackout. Yes it'll leave your HP/MP chunked but that is part of the pain!
  Incentivizes you to deal with it." So max HP, MP and TP shrink with everything else, RMMZ trims the current values
  to fit when the source lands, and nothing gives the trimmed part back when it lifts. **No protection for the bars.**
- "Masteries stay lit. They aren't on the SDP anymore, they are a part of you." Masteries are learned wrapper skills
  that grant passives through J-Passive; the blackout never touches them.
- The tag name `<sdpBlackout>` was proposed in chat and not objected to. `<no:sdp>` already exists (an enemy reward
  opt-out), which is why the name avoids that shape.

## Source

- `src/plugins/sdp/core/objects/Game_Actor.js`: `getAllSdpRankings` (returns the STORED `_j._sdp._ranks`, which
  `getOrCreateSdpRankByKey` also pushes into, so a blackout must never empty or replace it),
  `getSdpBonusForParameterKey`, `getSdpBonusForCoreParam`, `getSdpBonusForNonCoreParam`, `maxTpSdpBonuses`.
- `src/plugins/sdp/core/_metadata/initialization.js`: `J.SDP.RegExp`.
- Every consumer of panel bonuses reaches one of those four methods (read 2026-11-16): `sdpMultiplier` (sdr),
  `drops/core/objects/Game_Actor.js`, `resources/ext/abs/objects/Game_Battler.js` (lst, mst, tst),
  `abs/ext/shield/objects/Game_Battler.js` (sar, ser), `crit/core/objects/Game_Actor.js`,
  `prof/core/objects/Game_Actor.js`, `apt/core/objects/Game_BattlerBase.js` (apr),
  `_base/core/objects/Game_Battler.js` (har), `_base/core/models/SdpParameterBinding.js`,
  `_base/core/core/registerVanillaParameters.js` (maxTp).
- Readers that must keep the REAL rankings, and so stay on `getAllSdpRankings`: `getOrCreateSdpRankByKey`,
  `getTotalSdpRanks`, `getMasteryCount`, `getAllUnlockedSdps`, `SdpMasteryManager` (lines 20 and 155), the SDP scene
  and its windows, and saving.
- `RPGManager.checkForBooleanFromAllNotesByRegex(databaseDatas, structure)`: true when any source carries the tag.
  J-ABS reads `<noDamage>` the same way (`abs/core/objects/Game_Battler.js` `isImmuneToDamage`).
- Tests: `test/plugins/sdp/core/objects/game-actor.test.js` (unit, a stub `Game_Actor`, `RPGManager` stubbed in
  `beforeAll`), `test/plugins/sdp/_component/game-actor-param-party.test.js` (real J-Base `Game_Battler` and
  `RPGManager`; J-Base's `getAllNotes` honours the test hook `actor.__testNoteSources`).

## Work

### 1. The tag

In `src/plugins/sdp/core/_metadata/initialization.js`, add to `J.SDP.RegExp`, after `NoSdp` and before the natural
growth comment:

```javascript
  /**
   * The declaration that switches off every panel an actor has ranked, for as long as the actor carries it.
   * Ranks, points and unlocks are untouched, so nothing is lost: every bonus a panel grants (core parameters, ex- and
   * sp-parameters, max TP, and every catalog key other plugins read) simply reads as nothing until the source is gone.
   * Max HP, MP and TP shrink with the rest, so the engine trims the current values to fit as the source lands, and
   * lifting it restores the maximums but never what was trimmed. Masteries are learned skills, not panels, and stay.
   *
   * <pre>
   * Structure:
   *  <sdpBlackout>
   *
   * Example:
   *  <sdpBlackout>
   *
   * Translation:
   *  While this is on the actor, none of their panels grants anything.
   * </pre>
   * @type {RegExp}
   */
  SdpBlackout: /<sdpBlackout>/i,
```

### 2. The seam

In `src/plugins/sdp/core/objects/Game_Actor.js`, directly after `getAllSdpRankings`:

```javascript
/**
 * Whether this actor's panels are switched off right now, through `<sdpBlackout>` on any of its own note sources
 * (in practice a state, such as a boss's scramble).<br/>
 * A blacked-out actor keeps every rank, point and unlock; the panels simply grant nothing until the source is gone.
 * @returns {boolean}
 */
Game_Actor.prototype.isSdpBlackedOut = function()
{
  return RPGManager.checkForBooleanFromAllNotesByRegex(this.getAllNotes(), J.SDP.RegExp.SdpBlackout) === true;
};

/**
 * The rankings whose panels are granting their bonuses right now: every ranking this actor has, or none at all while
 * the panels are blacked out.<br/>
 * Every panel bonus reads from here, while storage, menus and masteries read {@link #getAllSdpRankings}, so a
 * blackout never costs a rank.
 * @returns {PanelRanking[]}
 */
Game_Actor.prototype.getContributingSdpRankings = function()
{
  const rankings = this.getAllSdpRankings();

  // an actor with nothing ranked has nothing to switch off, and is spared the note scan.
  if (rankings.length === 0) return rankings;

  // a blackout switches every panel off at once; the stored ranks themselves are never touched.
  if (this.isSdpBlackedOut() === true) return [];

  return rankings;
};
```

### 3. The four readers

In the same file, each of the four bonus methods reads the contributing rankings instead of the stored ones. Nothing
else in them changes.

`getSdpBonusForParameterKey`, before:

```javascript
  if (!parameterKey) return 0;

  const panelRankings = this.getAllSdpRankings();
  if (!panelRankings.length) return 0;
```

after:

```javascript
  if (!parameterKey) return 0;

  // only panels that are switched on grant anything.
  const panelRankings = this.getContributingSdpRankings();
  if (!panelRankings.length) return 0;
```

`getSdpBonusForCoreParam`, before:

```javascript
  const parameterKey = ParameterKeys.bparamKey(paramId);
  const panelRankings = this.getAllSdpRankings();
  if (!panelRankings.length) return 0;
```

after:

```javascript
  const parameterKey = ParameterKeys.bparamKey(paramId);

  // only panels that are switched on grant anything.
  const panelRankings = this.getContributingSdpRankings();
  if (!panelRankings.length) return 0;
```

`getSdpBonusForNonCoreParam`, before:

```javascript
    : ParameterKeys.sparamKey(sparamId);
  const panelRankings = this.getAllSdpRankings();
  if (!panelRankings.length) return 0;
```

after:

```javascript
    : ParameterKeys.sparamKey(sparamId);

  // only panels that are switched on grant anything.
  const panelRankings = this.getContributingSdpRankings();
  if (!panelRankings.length) return 0;
```

`maxTpSdpBonuses`, before:

```javascript
  // grab the current rankings of panels for the party.
  const panelRankings = this.getAllSdpRankings();
```

after:

```javascript
  // grab the rankings whose panels are switched on; a blackout leaves none.
  const panelRankings = this.getContributingSdpRankings();
```

Nothing caches the flag. `getAllNotes()` is already cached per battler until its data changes, and each note's parse
is cached by `RPGManager`, so the check is a walk over cached entries, and it only runs for an actor that has ranked
something. This matches how `<noDamage>` and `<sdpMultiplier>` are read.

### 4. Unit tests, `test/plugins/sdp/core/objects/game-actor.test.js`

Setup changes in `beforeAll`: add `checkForBooleanFromAllNotesByRegex: vi.fn(() => false)` to the `RPGManager` stub,
and `SdpBlackout: /<sdpBlackout>/i` to `J.SDP.RegExp`. In `beforeEach`, reset it:
`RPGManager.checkForBooleanFromAllNotesByRegex.mockReturnValue(false)`.

New `describe('isSdpBlackedOut')`:

1. "is true when a note source carries the blackout": the stub returns `true`; expect `true`, and expect the stub to
   have been called with the actor's `getAllNotes()` result and `J.SDP.RegExp.SdpBlackout` (identity).
2. "is false when no note source carries it": the stub returns `false`; expect `false`.

New `describe('getContributingSdpRankings')`:

1. "hands back the stored rankings while the panels are on": push two rankings; expect the result to be the same
   array instance as `actor._j._sdp._ranks` (`toBe`), length 2.
2. "hands back nothing while blacked out, and leaves the stored ranks alone": push two rankings with `currentRank` 3
   and 5; the stub returns `true`; expect `[]`, and expect `actor._j._sdp._ranks` still to hold both, ranks 3 and 5.
3. "spares an actor with nothing ranked the note scan": no rankings; expect the result to be the stored (empty)
   array and the stub never to have been called.

One new `it` per reader, each a near-miss pair inside one test so the blackout is the only difference:

- `getSdpBonusForParameterKey`: "grants nothing while blacked out": panel `a` reporting 5 at rank 1; with the stub
  `false` expect 5; with it `true` expect 0.
- `getSdpBonusForCoreParam`: "grants nothing while blacked out": a flat `perRank: 10` parameter at rank 2 (20 on);
  with the stub `false` expect 20; `true`, 0.
- `getSdpBonusForNonCoreParam`: same shape with a flat `perRank: 10` at rank 2 (0.2 on); `true`, 0.
- `maxTpSdpBonuses`: a flat `mtp` `perRank: 5` at rank 4 (20 on); `true`, 0.
- `param`: base 100 (`baseParam.mockReturnValue(100)`), the flat +20 above; on: 120; blacked out: 100.

While in this file: "returns 0 when the SDP namespace is unavailable" (under `getSdpBonusForParameterKey`) passes only
because the actor has no rankings; the method has no `J.SDP` guard and must not grow one. Delete that test.

### 5. Component test, `test/plugins/sdp/_component/game-actor-param-party.test.js`

New `describe('sdpBlackout over the real note chain')`, using the file's existing MHP panel setup (`hookBaseMhp100`)
and a ranked MHP panel:

1. "switches the panel's max HP off while a source carries the tag, and back on after": read `param(0)` with
   `actor.__testNoteSources = []` (expect the panel-boosted value the file's MHP tests already pin), then
   `[{ note: '<sdpBlackout>' }]` (expect 100), then `[]` again (expect the boosted value), and expect
   `getAllSdpRankings()` to report the same rank throughout. Observe the boosted value on the first run, then pin it.

The HP trim itself is RMMZ's own `Game_BattlerBase.refresh` clamping `_hp` to `mhp` when a state is added; this
feature only lowers `mhp`. The trim is proven in the hall run below, not re-tested here.

### 6. Docs

- `docs/notetag-reference.md`, J-SDP section, after `<sdpBonusFormula:[FORMULA]>`:

  ~~~markdown
  ### `<sdpBlackout>`

  **Applies to:**
  Actors, Classes, Weapons, Armors, States (any of the actor's own note sources; in practice a state)

  **When:**
  for as long as the actor carries it

  **Effect:**
  switches off every panel the actor has ranked: no core parameter, ex- or sp-parameter, max TP or catalog-key
  bonus (critical damage, drops, shields, resources, proficiency, AP, SDP gain) is granted until the source is gone.
  Ranks, points and unlocks are untouched, so nothing is lost, and ranking up during a blackout still works; the new
  rank lights up with the rest. Max HP, MP and TP shrink with everything else, so the engine trims the current values
  to fit as the source lands, and lifting it restores the maximums but never what was trimmed. Masteries are learned
  skills rather than panels, and stay.

  ```
  <sdpBlackout>
  ```
  On a 15-second state, the afflicted actor fights on their base stats alone for those 15 seconds.

  **See also:** `<sdpMultiplier>`

  ---
  ~~~

- New book page `docs/plugins/sdp/core/notetags/sdp-blackout.md`, exactly (no trailing newline, like its siblings):

  ~~~markdown
  ---
  type: notetag
  title: SDP Blackout
  description: The tag switching off every panel an actor has ranked while the actor carries it.
  tags: [sdp, tag, state]
  ---

  # SDP Blackout

  ## Description

  Switches off every panel an actor has ranked, for as long as the actor carries it. No core parameter, ex- or
  sp-parameter, max TP or catalog-key bonus (critical damage, drops, shields, resources, proficiency, AP, SDP gain) is
  granted until the source is gone. Ranks, points and unlocks are untouched, so nothing is lost, and ranking up during a
  blackout still works: the new rank lights up with the rest when it ends.

  ## NOTE ABOUT HP, MP AND TP

  Max HP, MP and TP shrink with everything else. The engine trims the current values to fit the moment the source lands,
  and lifting it restores the maximums but never what was trimmed. That is deliberate: a blackout costs something.

  ## NOTE ABOUT MASTERIES

  Masteries are learned skills, not panels, so a blackout leaves them on.

  ## TAG USAGE

  - States
  - Actors
  - Classes
  - Weapons
  - Armors

  ## TAG FORMAT

  `<sdpBlackout>`

  ## TAG EXAMPLES

  `<sdpBlackout>`
  On a 15-second state, the afflicted actor fights on their base stats alone for those 15 seconds.
  ~~~
- `docs/plugins/sdp/core/index.md`: add `* [SDP Blackout](notetags/sdp-blackout.md) - The tag switching off every
  panel an actor has ranked while the actor carries it.` after the No SDP line.
- `docs/plugins/sdp/core/overview.md`, Notes list: add "A state (or any note source) carrying `<sdpBlackout>` switches
  an actor's panels off without costing a rank (see [SDP Blackout](notetags/sdp-blackout.md))."

### 7. PR time (not now)

J-SDP minor bump and its changelog entry; restamp `docs/plugins/sdp/core/overview.md`'s `version` after reading the
book.

### 8. Chef Adventure (part of Grudj's build, after the engine lands)

State "Scrambled": `<sdpBlackout>`, 15 seconds, negative, applied by the machine's Scramble with Paralyzed (state 4).
The hall run reads Jerald's `mhp`, `hp` and `atk` before, during and after: during, `mhp` and `atk` drop to their
panel-free values and `hp` is trimmed to the new `mhp`; after, `mhp` and `atk` are back and `hp` is not.

## Definition of done

- `grep -n "getContributingSdpRankings" src/plugins/sdp/core/objects/Game_Actor.js` shows the definition and the four
  readers; `grep -n "getAllSdpRankings" src/plugins/sdp/core/objects/Game_Actor.js` shows no bonus reader left on it.
- `bun run hotfix` green; coverage 100% on `src/plugins/sdp/core/objects/Game_Actor.js`.
- `bun run mutate src/plugins/sdp/core/objects/Game_Actor.js`: every survivor on the new lines explained.
- In CA's hall run, a Scrambled Jerald's `mhp` drops and his `hp` is trimmed, and both maxima return 15 seconds
  later with `hp` still trimmed.

## Notes

Built 2026-11-16. **Hall-proven the same day** (`ca/dist/playtest/grudj-hall-probe.js`, run 2): a Scrambled Jerald
with 10 ranks went from 8,156 max HP to 6,430 with his HP trimmed to it, and 15 s later his max was 8,156 again with
his HP still at 6,430, three times over. Every DoD item holds.

**Frame time, measured the same day: fine on a fresh build, not on a maxed one.** The timer here resolves 100 us, so
per-call figures come from 20,000-200,000-call loops, never single calls. The scan's cost is linear in note sources at
about 134-150 ns each.

- **Fresh build** (`ca/dist/playtest/blackout-frametime-probe.js` in its first form: the duo at 150 with 10 ranks,
  60 s of Grudj's hall). 8.0 scans per game frame (Jerald 3.5, Rupert 4.5), worst frame 143. Jerald had 18 note
  sources: 2.4 us a scan, ~0.02 ms a frame. The whole update loop averaged 3.6 ms a frame, headless.
- **Maxed build**, as Jeremy defined the stress test: every trunk and fork teachable of the actor's own tree, every
  weapon-proficiency reward open to them, and the final mastery of every SDP subgroup (the lower tiers are forgotten).
  Counted by `ca/dist/playtest/maxskills.js`: Jerald learns 307 (139 + 119 + 49), Rupert 310 (142 + 119 + 49); in game
  they then hold 390 and 393 skills (the extra ~80 each not broken down). The probes learned the 49 final masteries
  directly and ranked only TUT_1 and TUT_2, so with every panel ranked each stat read would walk ~300 rankings and
  cost more than the "without" column below; the scan's own cost would not change. Measured
  (`blackout-frametime-probe.js` maxed, then `max-build-probe.js`):

  | | Note sources | One scan | `param(atk)` with / without the scan |
  |---|---|---|---|
  | Jerald | 537 (390 skills, 142 states, 3 equips) | 80.9 us | 83.1 / 2.4 us |
  | Rupert | 656 (393 skills, 258 states, 3 equips) | 97.0 us | 103.0 / 3.2 us |

  In the fight the scan ran 58-62 times a frame (Jerald 25, Rupert 37), worst frame 4,946: about **5.6 ms a frame**,
  a third of a 16.7 ms frame, and a single worst frame near 0.45 s. **So the flag needs a cache before this ships.**
  The fix: a per-actor flag recomputed only when `getAllNotes()` hands back a new array (rebuilt on every data change,
  identical otherwise; actors rebuilt it 0.3 times a frame in the maxed fight). Keep it out of the save: a static
  `WeakMap` keyed by actor, not a field on the serialized `Game_Actor` (a stored notes array would persist database
  rows).
- **The maxed build is slow beyond the scan, cause unknown.** Measured in this rig only: over 20 s of the maxed fight
  the engine's scene update averaged 48 ms a frame and J-ABS's own `update` 42 ms, both still falling (59 at 6 s), the
  view ~2 ms. No scan-off run and no baseline at the same hook point yet. First thing to time: one notes rebuild at
  537 and 656 sources (it happens 0.3 times a frame).

**Cache BUILT at his 20:13 call** ("Yeah cache it. It's end game final boss so the player is bound to be stacked."),
**and rebuilt 2026-11-17 at his "initializing state in a getter/setter is not OK... fix the blackout cache then."** The
first version filled itself on the first read inside `isSdpBlackedOut()`; that is state initialized by a query, so it
went. Now `managers/SdpBlackoutCache.js` holds a private static `WeakMap` of actor → `{ notes, isBlackedOut }` whose
only writer is `record`, called from J-SDP's new alias of `Game_Actor.onBattlerDataChange`: the reading is taken there,
once per change, from `getAllNotes()` as it stands after J-Base let go of the old list (`hasSdpBlackoutNote`, the
scan). J-Base runs that hook at setup and for every actor after a load (`DataManager.invalidateLoadedBattlerCaches`),
so the reading is never older than the notes. `isSdpBlackedOut()` is a pure read: the reading while `isCurrentFor`
holds for the current list, otherwise (mid-cascade, when a plugin earlier in the alias chain reads a parameter before
J-SDP's hook has run) a direct scan that stores nothing. Tests: `sdp-blackout-cache.test.js` (never read, beside a
sibling read from the same list; current only for the very list; latest reading per actor, kept apart) and
`game-actor.test.js` (`hasSdpBlackoutNote` both ways; `isSdpBlackedOut` answers from the reading without scanning, and
scans twice across two reads once the list is new; the alias runs the original, then records). hotfix green (19,867),
100% on both files, mutation 4/4 on the cache and no survivor on `Game_Actor.js`'s new lines (its 11 are the older
guards).
**Measured at the maxed build** (`max-build-probe.js`): one check 0.020 us for Jerald and 0.015 us for Rupert (from
80.9 and 97.0 us); `param(atk)` 2.6 / 2.4 us with and without it for Jerald, 3.3 / 3.2 us for Rupert. The fight's
scene update read 45.5 ms a frame over 20 s (48.1 before), J-ABS's own 40.3 (42.4): the slowdown is elsewhere, and a
CPU profile the same evening found it in other plugins (J-Base's battler-wide cache wipe, J-Extend's extended-skill
rebuilds, J-Passive-Conditional's dispatch); none of it is this plan's.
