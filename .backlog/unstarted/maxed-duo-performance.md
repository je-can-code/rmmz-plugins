# Maxed-duo performance: the data-change cascade, J-Extend's rebuilds, J-Passive-Conditional's per-tick dispatch

## Severity

High for Chef Adventure's endgame. A duo that has mastered everything (the final boss is fought by exactly this
duo) costs J-ABS's own update about 32 ms a frame in plain combat and 40-50 ms under a boss's opening, measured
headless on Jeremy's machine. A whole frame on a freshly built level-150 duo cost 3.6 ms. Logic alone at that size
caps the game at about 20-30 frames a second before anything is drawn.

## Gain

The measured costs are structural, not the size of any one formula: work that runs once per data change, or once
per frame per rule pass, and scales with the number of note sources (537 for a maxed Jerald, 656 for a maxed
Rupert). Each fix below removes a multiplier rather than shaving a constant, so a stacked endgame build stops
being a performance cliff and runs like a fresh one plus its own real work.

## Decided with Jeremy (2026-11-16 and 11-17)

- **The stress test is a fully maxed duo** (his 15:04): "Assume they master every trunk and every fork of their
  respective actors, and also mastered every SDP (hence learned the final instance of every SDP mastery passive),
  plus their weapon skills of course."
- **The blackout check was cached first** (his 20:13): "Yeah cache it. It's end game final boss so the player is
  bound to be stacked." Done in the blackout plan (`SdpBlackoutCache`); not part of this item.
- **This investigation came after it** (20:13): "We can look into 'why so slow on maxed duo' after we solve the
  prior two." Then (21:02): "Yeah go ahead and write it up with all the details in your head."
- **After the boss pass, in its own PR** (his, 2026-11-17 06:11): "I think we don't need to fix performance in the
  boss pass, I'll do that after the boss pass is done."
- **No state initialized inside a getter or setter** (his, 06:12): "initializing state in a getter/setter is not
  OK." So nothing in this plan computes a cache from inside its accessor, whatever older code does; step 4 coalesces
  by deferring the notification instead.
- **The caster-wide `<applyState>` finding** at the end of this file (his, 06:11): "take note of the applyState vs
  thisApplyState, because thats probably an easy problem to fix if we have the numbers." The numbers are there.
- **The shadowed data-change hooks ride in this PR** (his, 2026-11-17 09:09): "performance bugs can go in a separate
  PR (including the shadowing bug)." See the section of that name near the end of this file.

## How it was measured

All tools live in `ca/dist/playtest/` (gitignored, kept on disk).

- **The build.** `maxskills.js` counts the maxed kit from data and writes `maxskills.json`: class `<aptitude>`
  teachables of the actor's own trunks and forks (classes 2-11 Jerald, 14-23 Rupert), every proficiency
  `conditionals` reward whose `actorIds` include the actor, and the highest-tier `masterySkillId` of every SDP
  subgroup (`SdpMasteryManager` forgets the lower tiers; 49 of 50 subgroups have one). Jerald learns 307
  (139 + 119 + 49), Rupert 310 (142 + 119 + 49); in game they hold 390 and 393 skills and 537 and 656 note sources.
  The probes learn the 49 masteries directly and rank only `TUT_1` and `TUT_2`, so every panel ranked through the
  real path would make each stat read heavier still.
- **Timers.** `max-build-probe.js` and `maxed-profile-probe.js` wrap `SceneManager.updateScene` (the bot's own
  per-frame work excluded), `Scene_Map.updateMain`, `JABS_Engine.update` and `Scene_Base.updateChildren`, and count
  notes rebuilds (`getNotesSources`), actor data changes (the outermost `Game_Actor.onBattlerDataChange`) and every
  stack gained (`JABS_Engine.stackJabsState`, with who applied it and through which skill).
- **CPU profiles.** NW.js keeps Node's `inspector` inert (its session callbacks never fire), so profiles come over
  the DevTools protocol: add `--remote-debugging-port=9333` to `chromium-args` in the frozen copy
  (`/tmp/ca-playtest/game/package.json`; run without `--fresh`, which restores it, and put it back after), run
  `maxed-profile-probe.js`, which logs `PROFILE WINDOW START` and `PROFILE WINDOW END`, and run
  `bun cdp-profile.js 9333` beside it. Readers: `profile-read.js` (self and total by function, with the callers of
  the hottest bodies), `profile-split.js` (an exclusive split between the cascade and the dispatch, the cascade's
  triggers, J-Extend's miss share), `profile-totals.js` (total under named functions), `profile-chains.js` (the
  callers above a function's outermost frame).
- **Saved profiles.** `maxed-duo-2026-11-16.cpuprofile` (seconds 5-15 of Grudj's hall, under the opening scramble)
  and `maxed-duo-combat-2026-11-16.cpuprofile` (seconds 18-28, plain combat).
- **Caveats.** Headless, software-rendered; the timers measure logic only. The profiler adds ~5-20%. Each window is
  ten seconds of one fight. Total-time shares overlap (a function counts wherever it sits on the stack); the
  exclusive split below does not.

## What the profiles say

Unprofiled timers, plain combat (18-28 s): scene 33.2 ms a frame, map logic 31.9, J-ABS's update 31.8, view 1.3;
0.17 notes rebuilds a frame; 103 actor data changes in 600 frames.

| Time with the function on the stack | Plain combat | Under the scramble |
|---|---|---|
| `Game_Actor.onBattlerDataChange` (the cascade) | 41.6% | 51.2% |
| `AutoRuleManager.tryDispatch` (J-Passive-Conditional) | 30.0% | 34.1% |
| `JABS_Battler.updatePassiveRuleReconcile` | 25.9% | 23.7% |
| `Game_Battler.getNotesSources` (notes rebuild) | 24.4% | 30.5% |
| `Game_Battler.naturalParamBuff` (J-NaturalGrowth) | 11.4% | 13.8% |
| `Game_Battler.onHeal` | 10.9% | 23.2% |
| `OverlayManager.getExtendedSkill` (J-Extend) | 7.8% | 29.3% |
| `Game_Battler.refreshBonusHits` | 5.7% | 8.6% |

- **Exclusive split** (plain / scramble): cascade only 39.7% / 43.3%, dispatch only 28.0% / 26.2%, both 2.0% / 7.9%,
  neither 30.4% / 22.7%. The two are separate costs.
- **J-Extend is all misses:** 97% of `getExtendedSkill`'s time is its cache-miss callback (J-Extend.js:499 in the
  bundle), so it is rebuilding, not looking up.
- **Self time** sits in four `RPGManager` note readers (scramble: `getArraysFromNotesByRegex` 19.0%,
  `getArrayFromNotesByRegex` 14.1%, `getResultFromNoteByRegex` 12.3%, `getStringsFromNoteByRegex` 9.5%; plain
  combat ~45% between them). Nothing is sampled beneath them (no `split`, no `RegExp`), which leans toward the
  per-call overhead of cached lookups at enormous call counts rather than real parsing; inlining makes that a lean.
- **What fires the cascade** (plain combat): stack gains through `handleJabsStateUpdate → stackJabsState →
  applyStackGain → incrementStacks` 18.2%; J-Passive's `refreshPassiveStates` 11.8%; `onStateAdded` 5.2%;
  `eraseState` 5.2%; stack losses 1.2%. Under the scramble the stack gains were 26.8%.
- **Who drives the dispatch** (plain combat): the reconcile's per-tick passes (about 3.9 s of the 4.9 s under
  `tryDispatch`, stand rules included), then heals and MP gains through `onHeal` (0.7 s).
- **Stacks gained in ten seconds of plain combat:** Accelerate 44 (Rupert, through Quadfurcation's four
  projectiles: Adrenaline Surge's `<onHitSelfState:[140, ...]>`), Instant Cast Ready 22 (Rupert, Time Collapse's
  `<onCastSelfState:[143, 100]>` on Wordplay), Stunned 29 on Rupert (17 from his own Spore Bloom, 12 from Jerald),
  Heat Intolerant, Wings Clipped, Shell Cracked and Empty Aura 10 each on Rupert from his own Spore Bloom (see the
  finding at the end), Rooted Stance V 10 each on both.

## Source

- `src/plugins/_base/core/objects/Game_Battler.js:259-282` (`onBattlerDataChange`: nulls the notes, trait-object,
  all-traits, max-TP-bonus, equipment-contribution and HAR caches, then `JCache.invalidateAllForBattler(this)`).
- `src/plugins/_base/core/core/JCache.js:62` (`invalidateAllForBattler`: every battler-scoped `JCache`, among them
  `OverlayManager`'s `overlay:caster-skill` and `overlay:battler-state` and `RPGManager`'s eval cache).
- The twelve aliases of `onBattlerDataChange` (all eager):
  - `natural/core/objects/Game_Actor.js:22` → `Game_Battler.refreshAllParameterBuffs` (`natural/core/objects/
    Game_Battler.js:430`): clears both buff tables, then for every naturally bound parameter evaluates its buff-plus
    and buff-rate formulas over `getAllNotes()` (`naturalParamBuff`, 503).
  - `abs/core/objects/Game_Actor.js:80-111`: nulls the vision and projectile caches, then `refreshBonusHits`
    (`abs/core/objects/Game_Battler.js:1836`, over `allStates()`, the actor, equips, class), `refreshCdr`,
    `refreshPer`, `refreshPositiveRolls`, `refreshNegativeRolls`, `refreshEncoreRepeats`, `jabsRefresh`.
  - `abs/ext/speed/objects/Game_Actor.js:7` (`refreshSpeedBoosts`), `abs/ext/shield/objects/Game_Battler.js:84`
    (nulls), `level/core/objects/Game_Actor.js:43` (`updateRealMaxLevel`, `refreshLevel`),
    `sks/core/objects/Game_Actor.js:65` (null, `pruneStaleSlots`), `resources/core/objects/Game_Battler.js:110`
    (`refreshHcr`), `apt/core/objects/Game_Actor.js:81` (null), `prof/core/objects/Game_Actor.js:399`
    (`updateBonusSkillProficiencyGains`, a note sum), `lighting/core/objects/Game_Actor.js:13`
    (`refreshCarriedLight`), and the enemy-side twins in level, abs, speed and natural.
- `src/plugins/abs/core/models/JABS_State.js:466-490` (`incrementStacks` calls `battler.onBattlerDataChange()` on
  every stack actually gained, "so parameter caches (like msb) refresh").
- `src/plugins/abs/core/objects/Game_Battler.js:1066-1106` (`states()` represents stacks as duplicates: for every
  state with N stacks it pushes N-1 fresh `state._clone()` copies, on every call). This is why a stack change is a
  real change to note sources and traits, and why it reaches the full cascade.
- `src/plugins/extend/core/managers/OverlayManager.js:98-187` (`getExtendedSkill`; a miss walks every id in
  `caster.skillIds()`, trait-added skills included, reading `isExtension`, then `getExtensionTypes` and
  `getExtensions`), `205-290` (`getExtendedState`, the same over `battler.allStateIds()` with stack duplicates),
  `299-320` (`#getExtendedSkill` clones the base and folds the overlays in).
- `src/plugins/extend/core/database/RPG_Base.js:11-42` (`isExtension` is two `RPGManager` lookups per access).
- `src/plugins/extend/core/objects/Game_Actor.js:12-19` (`skills()` maps every skill through `skill(id)`, so the
  first `skills()` after a data change rebuilds every extended skill: O(n²) in known skills, ~152k candidate checks
  at 390 by arithmetic, plus a `skillIds()` per miss).
- `src/plugins/passive/ext/conditional/managers/JABS_Battler.js:57-88` (`updatePassiveRuleReconcile`, every J-ABS
  tick per battler: the throttled drift timer, then eleven unthrottled passes: time, enemies and allies nearby,
  the two aura managers, auto-execute time and nearby, and both stand passes).
- `src/plugins/passive/ext/conditional/managers/AutoRuleManager.js:392-470` (`tryDispatch` → `collectRules` →
  `battler.getPassiveStateSources()`, then `source[rulesProperty]` from every source into a fresh array).
- `src/plugins/passive/core/objects/Game_Battler.js:434-453` and `Game_Actor.js:26-44`
  (`getPassiveStateSources`: the battler's row, `allStates()`, `skills()`, external sources, equips, class: a fresh
  array, with fresh stack clones, every call). `Game_Battler.js:254-297` (`refreshPassiveStates` ends in a full
  `onBattlerDataChange`).

## Work

One PR. The order runs from the most contained step to the most invasive, each measured before the next: J-Extend
(one plugin, pure caching, and 29% under the scramble), the clone pool (one method), J-Passive-Conditional's dispatch
(one plugin, 28% exclusive in both windows), then the cascade (a J-Base mechanism wrapped around call sites in
several plugins; 40% exclusive).

### 0. Baseline

Rebuild, then re-run the harness on the branch before changing anything: `max-build-probe.js` (bench and a 20 s
window), and `maxed-profile-probe.js` with `cdp-profile.js` for the plain-combat window (18-28 s) and the scramble
window (5-15 s; change `SETTLE_FRAMES` to 300). Take the unprofiled plain-combat timing at least three times (what
the bot does varies run to run) and note the spread here; the target in the definition of done is set from that
spread, not from the single 31.8 ms sample. Save both profiles as the "before" beside the 2026-11-16 ones.

### 1. J-Extend: an overlay index, and one known-skill set per cache generation

The per-skill miss is O(known skills) only because it has to discover which of them are extensions, and that
answer is fixed by the database.

- Build an index once per database load, at the hooks where `OverlayManager.clearCache()` already runs
  (`extend/core/managers/DataManager.js:12, 27, 42`): for skills and for states, the ascending list of rows that
  are extensions, `overlaysById` (target id → extension ids naming it in `<extend:[...]>`) and `overlaysByType`
  (type → extension ids naming it in `<extendType:...>`).
- A miss then gathers candidates from the index alone: type candidates are the extensions of any of the target's
  types; id candidates are `overlaysById.get(target)`, less any already taken by type. That is today's precedence: a
  candidate matching both goes to the type bucket. Both are filtered to what the caster has, sorted ascending, type
  bucket first. For states, "has" is a count, not a flag: today a stacked overlay state appears in `allStateIds()`
  once per stack and is applied once per stack, and the index has to keep that.
- Compute the caster's known set once per cache generation, on the first miss after an invalidation, and keep it
  in the generation's bucket, instead of calling `skillIds()` (and its `traitsSet` walk) on every miss.
- Invalidation stays exactly as it is in this step (the bus wipe). Measure again before step 1b.
- **1b (only if the re-measure still shows J-Extend):** keep extended skills across a data change that leaves the
  caster's skill set alone. That needs the skill cache off the battler bus, plus a J-Extend alias of
  `onBattlerDataChange` that compares a skill-id signature and invalidates only on a difference. Two cautions:
  `skillIds()` includes trait-added skills, so a state CAN change extensions; and `getExtendedSkill` must never call
  `getAllNotes()`, which rebuilds through `skills()` and would recurse.
- Tests (`test/plugins/extend/core/managers/`): index contents; candidate order (type before id, ascending); a
  candidate matching both lands once, in the type bucket; stacked overlay states applied once per stack; an
  unknown extension ignored; circular detection unchanged; the known set computed once per generation (near-miss: a
  second caster's set never reused). Mutation on `OverlayManager.js`.

### 2. Stack duplicates from a pool, not a clone per call

`states()` allocates N-1 `RPG_State` copies for every stacked state every time anything asks: the cascade's
rebuild, `allStates()`, every one of J-Passive-Conditional's eleven passes. The copies stand for multiplicity only.

- Keep a pool in J-ABS (a small static class holding a `WeakMap` from database row to its clones) and hand back
  clones 1..N-1 from it, creating only the ones not made yet. Nothing in the save: the pool is static.
- Then `states()` hands back the same objects while the stacks hold. That alone does not keep identity-keyed caches
  warm: `getAllNotes()` is nulled on every data change and rebuilt as a new array, and a stack gain really does add
  an entry. **Optional, if step 3's re-measure wants it:** have the notes rebuild hand back the previous array when
  the new one is the same element for element, so a data change that changed nothing (a re-applied state at its
  stack cap, a passive refresh that lands where it started) keeps every identity-keyed cache, the blackout cache
  included, warm.
- Check first, and record the result here: that nothing mutates a state object it got from `states()` (a shared
  clone would carry the mutation to every battler), and that `RPGManager`'s `resolveOriginal` treats a pooled clone
  as it treats a fresh one.
- Tests (`test/plugins/abs/core/objects/`): N stacks give N entries; a second call gives the same clone objects;
  raising the stacks reuses the existing clones and adds one; two rows never share a clone.

### 3. J-Passive-Conditional: collect each battler's rules once per change, bucketed by condition

Every tick, eleven passes (sixteen `tryDispatch` calls, the nearby kinds asking twice) each rebuild the battler's
passive sources and read every source's rules, to find the handful of tuples whose condition matches. The rules only
change when the sources do.

- Cache `collectRules` per battler and per manager, as a map from condition kind to its entries, rebuilt only when
  the sources change: key it on the identity of `getAllNotes()` (a new array after every data change, identical
  otherwise), plus whatever `passiveExternalStateSources()` returns. Read that method first: if its sources can
  change without a battler data change, its own signature joins the key. That rebuilds the collection about ten
  times a second in the maxed fight, against sixteen collections a frame per battler today.
- `tryDispatch(battler, kind)` then walks only that kind's bucket, so most passes touch nothing.
- Keep today's multiplicity: a rule on a stacked state is collected once per stack today, and the per-rule cooldown
  keys (`buildRuleKey`: source label and id, tuple index, id, condition) must come out the same.
- Tests (`test/plugins/passive/ext/conditional/managers/`): the second pass with unchanged notes reuses the
  collection; a notes change rebuilds it; buckets hold only their kind (near-miss: a tuple of another kind on the
  same source); duplicate stacks preserved; cooldown keys unchanged.

### 4. The cascade: one notification per burst, not one per change

A single action can re-stack several states at once (Spore Bloom's heal re-applies every caster-wide `<applyState>`
Rupert has learned, up to nine entries; each of Quadfurcation's four projectiles that lands stacks Accelerate), and
each stack runs every eager refresher in twelve plugins. The refreshers stay eager (no cache is ever filled from
inside its accessor); what changes is how many times they are asked within one burst.

- **Defer the notification across a burst.** The codebase already has the shape: J-Passive's
  `refreshPassiveStates(deferRefresh)` skips its trailing `onBattlerDataChange` when the caller knows another is
  coming. Generalize it in J-Base as a battler-level deferral: a begin/end pair (or a method taking the work as a
  callback) inside which `onBattlerDataChange` only records that a change happened, and on leaving it runs exactly
  once if anything did. Nest safely (a counter, not a flag) so a deferral inside a deferral still notifies once, at
  the outermost end.
- **Wrap the known bursts:** `applyOnHitApplyStates` and `applyOnHitSelfStates` (every entry of one hit),
  `stackJabsState`'s gain plus refresh, J-Passive-Conditional's dispatch of several rules in one pass, the reconcile's
  `refreshPassiveStates`, purges that remove several states (`removeStatesByPriority`). Each wrap is one call site,
  measured before and after.
- **Gate the side effects on their real input** while there: `pruneStaleSlots` (J-SKS) only when the skill-id set
  changed, J-Level's refresh only when what it reads changed. A gate is a cheap check of one input, done in the
  hook, not in any accessor.
- **Reads inside a deferral** see the caches as they were when it began. Confirm per wrapped site that nothing in the
  burst reads a value the burst itself just changed (for example, a stack-conversion check reading the stack count
  it was handed, not a refreshed parameter).
- Tests: J-Base's deferral (no notification inside, exactly one on leaving when something changed, none when nothing
  did, nested scopes notify once); each wrapped site notifies once for a multi-entry burst (near-miss: a single-entry
  burst still notifies once); the gated effects run on a change to their input and not on an unrelated change.

### 5. Re-measure, then decide on the note readers

Re-run step 0. If the four `RPGManager` readers still dominate self time, their per-call overhead is next: each call
builds its cache key from `structure.source` and allocates a closure before the cache is even consulted. A
`WeakMap` from regex to key, and a compute path without a fresh closure per call, are the obvious moves. Leave it
out if the numbers no longer justify it.

## Risks

- **Reads during a deferral** (step 4) see the state as it was when the burst began, until the burst ends.
- **Shared clones** (step 2). Safe only while state rows are treated as immutable.
- **The J-Extend index** (step 1) has to reproduce today's candidate order, precedence and stack duplicates exactly,
  or extended skills change silently. The tests above pin each one.
- **Rules from external sources** (step 3) may change without a data change. Read before keying.
- **The save.** No new cache lives on a serialized object: static `WeakMap`s, or declared transients reseeded on
  decode (`docs/save-system.md`). A deferral counter on a battler is runtime-only: transient, reseeded to zero.

## Definition of done

- `bun run hotfix` green; coverage 100% on every touched file; `bun run mutate` on each touched file with every
  survivor on a new line explained.
- **Re-measured with the same harness** and recorded in Notes: J-ABS's update in the plain-combat window (18-28 s,
  `maxed-profile-probe.js` without the profiler) at or under 12 ms a frame, down from 31.8 (provisional: step 0's
  repeated baselines set the final number); and in the after-profile (`profile-split.js`), the cascade and the
  dispatch each under 10% of the window.
- Before and after profiles saved in `ca/dist/playtest/`.
- In Grudj's hall (`grudj-decisions-probe.js`): Jerald's max HP still drops and returns with every scramble, the
  logged decisions still split evenly across executor's ties, no errors.
- A stacking check over the real chain: a state with N stacks still counts N times wherever it did before (traits,
  note sums), compared against the pre-change numbers.

## Related finding: a learned skill's `<applyState>` can ride every hit, heals included

Not performance; recorded here because it drives a share of the churn measured above, and it needs Jeremy's call.

- **By the source** (read in full): `Game_Action.applyOnHitApplyStates` (`extend/core/objects/Game_Action.js:223-256`)
  reads `<applyState:[...]>` from all of the caster's notes, and `getAllNotes()` includes every learned skill. Each
  entry rolls its chance and goes to `target.addStateWithOverrides(stateId, attacker, overrides, this.item())`; no
  team check, only the target's own resistance. `canApplyOnHitStateEffects` (same file, 96) asks only whether the
  target was hit. So, as written, a learned active skill's `<applyState>` rides every action the caster lands on
  anything that does not resist it, allies included.
- **Not yet checked outside the maxed fight:** a Rupert who knows only Meltima, landing another skill on an ordinary
  enemy and on an ally, with every state gained logged (first applications too, not only stacks). The maxed window's
  counts also do not reconcile cleanly with Spore Bloom's cadence (about five casts in the window, ten stacks per
  state), and the 12 stuns from Jerald's side are unexplained.
- Four CA skills carry it: Meltima (484: Burn and Heat Intolerant, 20 stacks each, 900 frames), Shell Cracker (552:
  Stunned, 180 frames), Avenge (554: Stunned 360 frames, Wings Clipped, Shell Cracked, Empty Aura), Equilibrium (574,
  a self-cast: Equation: Life and Equation: Entropy). One state carries it too: 97 Shrapnel.
- **Seen in the maxed fight:** Spore Bloom (skill 1025, an all-allies heal auto-cast every 120 frames by mastery state
  1285's `<autoExecuteSkill:[1025, time, 120]>`) stunned Rupert 17 times in ten seconds and stacked Heat Intolerant,
  Wings Clipped, Shell Cracked and Empty Aura on him. Jerald's side stunned Rupert another 12 times, by a path the
  probe could not name (no source skill recorded).
- **Options:** move those skills' tags to the skill-scoped `<thisApplyState>`; make caster-wide on-hit states skip
  targets on the caster's own team; or both.
- **The numbers, for the data fix** (`<thisApplyState>` takes the same `[STATE_ID, CHANCE, DURATION?, STACKS?]`
  shape, so each tag only changes its name):

  | Skill | Tags today |
  |---|---|
  | 484 Meltima | `<applyState:[9,100,900,20]>` (Burn), `<applyState:[128,100,900,20]>` (Heat Intolerant) |
  | 552 Shell Cracker | `<applyState:[8,100,180]>` (Stunned) |
  | 554 Avenge | `<applyState:[8,100,360]>` (Stunned), `<applyState:[151,100]>` (Wings Clipped), `<applyState:[152,100]>` (Shell Cracked), `<applyState:[153,100]>` (Empty Aura) |
  | 574 Equilibrium | `<applyState:[157,100,900]>` (Equation: Life), `<applyState:[158,100,900]>` (Equation: Entropy) |

  State 97 Shrapnel also carries `<applyState>`; on a state, caster-wide may be the intent ("while you have this,
  your hits apply..."), so read it before touching it. After the change, re-run the maxed hall: Spore Bloom should
  no longer stun anyone.

## Rides along: two data-change hooks that never run

Not performance either. It rides in this PR by his call (see "Decided with Jeremy").

- **Confirmed in game** (2026-11-17, the shadow check in `grudj-arena-probe.js`'s boot stage): one
  `$gameActors.actor(1).onBattlerDataChange()` ran J-Resources' `refreshHcr` 0 times and J-ABS-Shield's
  `setCachedSarFactor` 0 times.
- **Why:** both alias `Game_Battler.prototype.onBattlerDataChange` (`resources/core/objects/Game_Battler.js`,
  `abs/ext/shield/objects/Game_Battler.js`). J-ABS loads before them (CA #7, against #41 and #78) and gives `Game_Actor`
  and `Game_Enemy` methods of their own, each capturing J-Base's. Every other plugin aliases `Game_Actor` /
  `Game_Enemy`, the only two battler classes, so these two hooks never run for anyone.
- **What it breaks in CA:** the Skulls (armors 516-520, `<hcr:[1..5]>`) never cut HP costs. `refreshHcr` is the only
  writer of `_j._hcr`, which stays at `initMembers`' 100; natural hcr buffs still apply, since they are read live. The
  Jars (491-495, `<sar:1..5>`) and Radiators (496-500, `<ser:1..5>`) freeze at their first reading: `baseSarFactor` /
  `baseSerFactor` fill their cache on read, and only the dead hook ever empties it. Those caches are not declared
  transient on `Game_Actor`, so the frozen value rides in saves too.
- **Fix:** move both aliases onto `Game_Actor` and `Game_Enemy`, like everyone else. Compute the two shield factors
  in that hook and make `baseSarFactor` / `baseSerFactor` pure reads: today they fill their cache inside the read,
  which his rule forbids. Declare `_j._abs._shield._cachedSarFactor` and `_cachedSerFactor` transient (`() => null`).
  `setHcr` also runs `this._j ||= {}`, state initialized in a setter; `initMembers` already guarantees `_j`, so drop it.
- **Tests:** each hook runs for an actor and for an enemy, through the subclass method (the shadowing is the bug, so a
  test that calls `Game_Battler`'s copy proves nothing); a Skull equipped lowers a cost; a Jar swapped changes the
  factor without a reload; a decoded actor's shield caches come back cold.
- **In game:** re-run the shadow check; both counts should read 1.

## Notes

Written 2026-11-16 from the measurements above. Nothing in this plan has been started.