# Drop upgrades, drop quantity, and affixes that grade a kill

> **Plan agreed with Jeremy 2026-08-23.** This covers the tag suite and the defect it uncovered. The
> flux-drive work that shared the original item is still unbuilt and sits at the bottom under
> [Later](#later), untouched by this plan.

## Severity

**One real defect, one unbuilt feature.** `makeDropItems` silently loses its `killer` argument in
every game with Monsterpedia loaded, which is all of them — see [1.2](#12-the-defect). The tag suite
itself is new surface; nothing is broken without it.

## Gain

**High.** Drops currently have exactly one knob and it is rate. This adds two more, orthogonal to it
and to each other, which is what lets an affix be interesting rather than merely generous. It also
turns an affixed enemy's name into a reward preview the player learns to read: *Elysian* stops being
flavour the moment it means heartwood instead of oak.

---

## 1. Verified current state

Every claim here was read from source at plan time. File and line are given so the executor can
re-read rather than trust this document.

### 1.1 The drop pipeline

`src/plugins/drops/core/objects/Game_Enemy.js`

| line | what happens |
|---|---|
| 45 | `makeDropItems(killer = null)` — overwrites vanilla; the whole pipeline |
| 57 | `getDropMultiplierBonus()` — the rate multiplier, party and enemy sourced |
| 66 | `rate = drop.denominator * multiplier` — database number treated as a percent |
| 70 | `foundCount = this.howMuchLootFound(rate, killer)` — how many copies |
| 73 | `if (foundCount <= 0) return` — the drop failed its roll |
| 76-79 | loop calling `findLoot` once per copy |
| 91 | `findLoot(drop, itemsFound)` — resolves `itemObject(kind, dataId)` and pushes |
| 138 | `howMuchLootFound(rate, killer)` — the roll |
| 142 | `if (!killer)` — a single plain roll when there is nobody to roll for |

**Everything after line 70 runs on drops that already won their roll.** That is what lets promotion and
quantity live entirely downstream of rate, satisfying the standing rule that the three axes stay
separate. Both are applied to the finished `itemsFound` rather than inside `findLoot` — see §4.5 for
why the loop body is the wrong place, and D14 for why the finished list is the right one.

**`findLoot` also has a second aliaser.** `sdp/core/objects/Game_Enemy.js:101-119` wraps it with a
fixed `(drop, itemsFound)` signature, which constrains the design: see §4.5.

### 1.2 The defect

`src/plugins/abs/core/managers/JABS_Engine.js:5757` passes the killer:

```javascript
.makeDropItems(caster.getBattler());
```

`src/plugins/omni/ext/monster/objects/Game_Enemy.js:117` aliases it as `function()` — no parameters —
and calls through with `.call(this)`. **The argument is dropped.**

Consequence: `killer` arrives `null`, `howMuchLootFound` takes its no-killer branch, and every drop
resolves as one plain roll. The killer's positive and negative rolls, Accumulate Mode and Encore have
never applied to drops. `resolveProcCount` at lines 151-155 is dead code in practice.

Both files changed in the same commit — **#66, `a72a8ee8`** — which is where the `killer` parameter was
introduced. The alias was edited in that commit and never learned about it.

`J-OMNI-Monsters` is `status: true` in `ca/chef-adventure/js/plugins.js` alongside `J-DropsControl`, so
this is live in the shipped game.

### 1.3 Note sources already resolve correctly

`Game_Battler.prototype.getNotesSources` (`_base/core/objects/Game_Battler.js`) returns
`databaseData()` + `skills()` + `allStates()`. `Game_Actor` extends it (`_base/core/objects/Game_Actor.js:105`)
with `currentClass()` and `equippedEquips()`. `J-Passive` widens `allStates()`
(`passive/core/objects/Game_Battler.js:485`) to include passive skill states.

So `killer.getAllNotes()` already yields exactly the killer-scoped surface we want — their equipment,
class, skills and states, **including party-wide passives**. No new accessor is needed, and
`drops/core/objects/Game_Actor.js:61` already uses this exact call for the rate multiplier.

The enemy side is the same call on the enemy, which includes its own database row. That settles the
"should an enemy's own note count" question by construction rather than by decision.

### 1.4 The map-building pattern to mirror

`J_SdpPluginMetadata.validateMasteryMetadata` (`sdp/core/_metadata/_pluginMetadata.js:217-280`) builds
its lookup Maps in one pass at boot and **throws** on every structural violation — duplicate key,
unknown reference, ambiguous tier — each with the reason stated inline. A hard failure at launch, not
a warning at use time. This plan mirrors it exactly.

### 1.5 The existing tag table

`drops/core/_metadata/initialization.js:27-38` holds `ExtraDrop`, `DropMultiplier`, `GoldMultiplier`
and four natural-growth tags. `DropMultiplier` already captures `(-?\d+)`, so signed values need no
new machinery.

---

## 2. The design

Three tags, three orthogonal axes.

| Axis | Tag | Answers | Where authored |
|---|---|---|---|
| Rate | `<dropMultiplier:N>` *(exists)* | Does it drop at all? | anywhere |
| Quantity | `<dropQuantity:-?N>` | How many copies? | passive states, equipment, any note source |
| Quality | `<dropUpgrade:-?N>` | Which rung of the ladder? | passive states, equipment, any note source |

**"Passive states", not "states", and the distinction is not pedantry.** By the time drops are made the
enemy is dead and `die()` → `clearStates()` has already emptied `_states`; `handleDefeatedTarget` runs
on a later update tick (`abs/core/managers/JABS_Engine.js:1488-1498`), and `onDeath` →
`onBattlerDataChange` has invalidated the note cache so the rebuild sees only the death state.

Affixes are unaffected — they are held as **passive** states in external sources
(`passive/ext/affix/managers/JABS_AiManager.js:118`, `addPassiveStateExternalSourceByStateIds`), which
`clearStates` does not touch and `allStates()` re-adds. But an ordinary applied state carrying
`<dropUpgrade:1>` contributes nothing, and authoring one would look like a broken tag rather than a
misunderstanding of lifetime.
| — | `<dropUpgradeId:N>` | What is the rung above me? | items, weapons, armors |

### 2.1 `<dropUpgradeId:N>` builds the ladder

Authored on the item, weapon or armor that sits *below* — it names the row directly above it.

```
Structure:
 <dropUpgradeId:ID>

Example:
 <dropUpgradeId:307>

Translation:
 Promoting this row once yields row 307 of the same table.
```

The pointer is read in whichever table it sits in, so an armor can only ever promote into an armor.
**Cross-stream upgrades are structurally impossible and need no validation.**

Only forward links are authored. The downgrade direction is derived at boot by inverting the map, so
the two can never disagree.

### 2.2 `<dropUpgrade:-?N>` promotes

Summed across every note source of the enemy and of the killer. Positive walks up the ladder, negative
walks down. The count decrements per hop and stops when the chain ends.

### 2.3 `<dropQuantity:-?N>` adds copies

Summed the same way. Applied **once per distinct item that dropped**, not once per drop entry and not
per copy — an enemy listing the same item four times has dropped one *thing*, and the bonus lands on
the thing. See D8 for the worked example.

---

## 3. Decisions

Recorded with reasoning so the reasoning does not have to be rediscovered.

**D1 — the killer is the only battler-side contributor.** Not the party. A six-person party would
trivially out-scale any affix, and the drop roll is already killer-scoped. Party-wide *passives* still
reach us, because `allStates()` includes them — so a harvesting charm held by anyone can still be
authored deliberately, through the passive system rather than through this one.

**D2 — sum, never pick a winner.** A player-side upgrade item that silently does nothing because the
target happened to carry a prefix reads as broken. Summing is self-limiting: the ladder length is the
real cap.

**D3 — promote after the roll resolves, never during.** `getDropMultiplierBonus` owns rate. Rolling
against an upgraded table would collapse quality and rate onto one axis, which is the exact thing this
work exists to separate.

**D4 — clamping is not an error.** `<dropUpgrade:8>` against a four-rung ladder lands on the top rung.
Over-upgrading is a normal outcome, not a misconfiguration.

**D5 — forked ladders throw at boot.** No two rows may promote into the same row. Inverting that would
give one row two rows beneath it, and a downgrade cannot choose between them. A ladder with a fork is
not a ladder. Detected when the inverse map is built, and fatal.

**Injectivity holds for a single hop and nowhere else.** An earlier draft of this plan claimed the
fork check made grouping order irrelevant. It does not: the walk is n hops **with clamping** (D4), and
clamping is not injective — two rows that both reach the top rung arrive at the same row. Rows absent
from every ladder collide the same way, mapping to themselves. D14 decides the order this leaves open.

**D6 — cyclic ladders throw at boot.** A→B→A would walk forever. Detected at build time rather than
defended against at walk time, so the walk itself stays a plain loop with no guard in it.

**D7 — promotion is per copy.** Every copy of a promoted drop is promoted. "Two of your three pelts got
better" reads as a bug. The affix graded the enemy, not the individual pelt.

**D8 — quantity is per distinct dropped item, not per drop entry and not per copy.** An enemy may list
the same item across several entries; those are one *drop* and take the bonus once between them.

Worked example, an actor carrying `<dropQuantity:2>` against a tree listing five entries:

```
<drop:[i,47,100]>   x4 entries, same item
<drop:[i,49,100]>   x1 entry, different item
```

yields **6 of item 47** (four from the tree, two from the bonus) and **3 of item 49** (one from the
tree, two from the bonus). Not `+2` per entry, which would give eight extra of item 47 and make the
bonus scale with how the author happened to split identical rows.

Mechanically this is part of the post-processing pass over the finished `itemsFound` rather than an
adjustment to `foundCount` inside the loop — the grouping is what the pass is *for*, so reconstructing
it per entry would be working against the shape.

**D9 — a negative quantity can zero out a dropped item.** `<dropQuantity:-2>` against the tree above
leaves 2 of item 47 and **none** of item 49, which passed its roll and is removed anyway. Deliberate:
it is what gives negative affixes teeth, it is not a hidden second roll because it only touches items
that already dropped, and it produces a pleasant curve where a negative dents the plentiful drops and
erases the thin ones.

**D10 — no opt-out tag.** A drop promotes only if something gave it a `dropUpgradeId`. Quest items and
key items simply never get one. `<noDropUpgrade>` would be a guard against a state we cannot reach.

**D11 — extra drops are on the ladder too.** Anything authored via `<drops:[i,5,25]>` flows through the
same `findLoot`, so it promotes like everything else. Chests and event-granted items do not, because
this hooks enemy drops specifically — correct by construction, no guard needed.

**D12 — the ladder is never serialized.** It is derived from the database and rebuilt every boot, so it
cannot go stale inside a save. No `SerializableRegistry` involvement.

**D13 — the Monsterpedia fix ships in this PR.** It is two lines, it is in the function this work
extends, and reading `<dropUpgrade>` off the killer would be dead on arrival without it. Splitting it
out would mean shipping a feature that provably cannot work.

**D14 — quantity applies after promotion, grouping the promoted result.** The order matters wherever
two drops collide onto one row, which clamping makes reachable. Ladder 47→48 with **48 at the top**, an
enemy dropping one of each, `<dropUpgrade:1>` and `<dropQuantity:2>`:

| order | what happens | result |
|---|---|---|
| **promote, then group** | 47→48, 48 clamps to 48; one distinct row | **4 of item 48** |
| group, then promote | 47 and 48 are two distinct rows, each gets +2, then all promote | 6 of item 48 |

The first is correct: you received one *kind* of thing, so the bonus grants more of that kind. If your
oak was upgraded to heartwood you should get more heartwood, not more oak — and not a quantity bonus
scaled by how many rungs happened to converge.

**D15 — synthetic loot is skipped, identified by `id === 0`.** J-SDP pushes panel unlocks straight into
`itemsFound` (`sdp/core/objects/Game_Enemy.js:134-158`) as an object carrying `id: 0`, no `kind`, and
an `sdpKey`. It is not a database row, cannot appear on a ladder, and would fail D16's boot validation
if it tried. Without this rule `<dropQuantity:2>` duplicates panel unlocks and a negative deletes them,
which is content loss rather than a reward curve. The post-processing pass returns anything whose `id`
is falsy untouched.

**D16 — a `dropUpgradeId` naming a row that does not exist throws at boot.** SDP's validator rejects
unknown references and this mirrors it. Without the check, `<dropUpgradeId:9999>` survives launch and
detonates at kill time: `itemObject` returns null, `findLoot`'s existing `!item` branch
(`drops/core/objects/Game_Enemy.js:97-105`) warns to console and returns **without pushing**, so a typo
silently deletes the drop. A boot failure naming the offending row is the whole point of building the
map early.

**D17 — Monsterpedia records the base row, never the promoted one.** The drop that dropped is the one
the enemy is known to drop; promotion is something that happened to it afterwards. The pedia's detail
window unmasks the enemy's *database* drop entries by base id
(`omni/ext/monster/windows/Window_MonsterpediaDetail.js:1157-1193`), so recording the promoted row
would leave an always-promoted drop showing `???` forever while crediting a row that is not in the
enemy's drop list at all.

---

## 4. Code changes, in dependency order

### 4.1 `src/plugins/omni/ext/monster/objects/Game_Enemy.js` — the defect

Line 117 becomes `function(killer = null)`, and line 120-121 forwards it: `.call(this, killer)`.
Update the JSDoc to document the parameter.

**This changes live behaviour**: Accumulate Mode and Encore begin applying to drops. That is the
intended state and has been since #66; it simply never took effect.

### 4.2 `src/plugins/drops/core/_metadata/initialization.js` — the tags

Three additions to `J.DROPS.RegExp`, each with the `<pre>` structure/example/translation block the repo
requires of regex definitions:

```javascript
J.DROPS.RegExp.DropUpgrade = /<dropUpgrade:[ ]?(-?\d+)>/gi;
J.DROPS.RegExp.DropUpgradeId = /<dropUpgradeId:[ ]?(\d+)>/i;
J.DROPS.RegExp.DropQuantity = /<dropQuantity:[ ]?(-?\d+)>/gi;
```

`DropUpgrade` and `DropQuantity` carry `g` to match their sibling growth tags at
`initialization.js:33-38`. Note that `RPGManager.getSumFromNoteByRegex` strips the flag and sums line
by line regardless (`RPGManager.js:681-710`), so the flag is a consistency choice rather than what
makes summing work. `DropUpgradeId` has no `g`: one row has exactly one row above it.

### 4.3 `src/plugins/drops/core/_metadata/_pluginMetadata.js` — the ladder

A `validateDropLadders(items, weapons, armors)` on the metadata class, mirroring SDP's
`validateMasteryMetadata` throw discipline. Builds two Maps per table and throws on D5 and D6:

- `upgradeMap` — `Map<number, number>`, this row to the row above it
- `downgradeMap` — the inverse, built by walking `upgradeMap`

Stored as three pairs keyed by table so lookups never cross streams.

**Fork detection** is a `has` check while inverting — if a row already has something beneath it, a
second claimant is fatal.

**Cycle detection must iterate every node, not every root.** A closed loop has no root: every member
has an incoming link, so a root-first walk never enters it and it would sail through boot undetected.
Walk from each id with a visited set, which costs nothing at these table sizes and is the only shape
that makes D6's guarantee true.

Both throw with the offending ids named, prefixed `J-DropsControl:`.

### 4.3b `src/plugins/drops/core/scenes/Scene_Boot.js` — when the ladder gets built

**Not from `postInitialize`.** That runs during `PluginMetadata` construction, at plugin load time,
when `$dataItems` / `$dataWeapons` / `$dataArmors` do not exist yet — building there would throw a
`TypeError` at launch instead of the designed error. The database is not hydrated until
`Scene_Boot.onDatabaseLoaded`.

drops/core already aliases that hook (`Scene_Boot.js:9`) for parameter registration. One more line in
it calls `validateDropLadders`, exactly as the affix ext invokes
`J.PASSIVE.EXT.AFFIX.Metadata.initializeStateAffixWeights()` from its own `Scene_Boot.js:15`.

### 4.4 `src/plugins/drops/core/objects/Game_Battler.js` — the summing accessors

Two methods reading this battler's own note sources via `getAllNotes()`:

- `dropUpgradeCount()` — `RPGManager.getSumFromAllNotesByRegex(sources, J.DROPS.RegExp.DropUpgrade)`
- `dropQuantityBonus()` — the same against `DropQuantity`

Living on `Game_Battler` means both the enemy and the killer answer the same question the same way.

### 4.5 `src/plugins/drops/core/objects/Game_Enemy.js` — the pipeline

Three changes:

- **`resolveDropUpgradeCount(killer)`** and **`resolveDropQuantityBonus(killer)`** — each sums this
  enemy's own count with the killer's. When there is no known killer, **the killer's contribution is
  zero and the enemy's still applies in full** — an Elysian tree felled by an unknown hand still drops
  heartwood. The enemy's grade is a property of the enemy, not of who killed it.
- **`postProcessDroppedLoot(itemsFound, killer)`** — one pass over the finished list, called as the
  last statement of `makeDropItems`. Promotes first, then applies quantity to the promoted result
  (D14). Returns the new list.

**`findLoot` is not touched, and that is deliberate.** An earlier draft passed the upgrade count into
it as a third argument — which would have reproduced the exact defect §1.2 exists to fix, because
**`findLoot` has a second aliaser**: `sdp/core/objects/Game_Enemy.js:101-119` wraps it with a fixed
two-parameter signature and calls through `.call(this, drop, itemsFound)`. With J-SDP loaded, and CA
loads it, the third argument would arrive `undefined` for every drop and promotion would silently
never happen. Keeping the signature intact makes that whole class of failure unreachable.

**The quantity bonus likewise does not touch `foundCount`.** Adjusting it inside the loop would apply
the bonus once per *entry*, the arithmetic D8 rejects — four identical `<drop:[i,47,100]>` rows would
take it four times. The pass has to see the whole list to know what "distinct" means.

Internally the pass is three steps, each its own small method so they can be tested apart:

1. **Promote** — walk each entry's ladder by the resolved count, skipping synthetic loot (D15). The
   walk decrements per hop and stops when the map has no next rung.
2. **Group** — bucket the promoted items by table and id.
3. **Adjust** — add or remove the quantity bonus once per bucket, clamping removal at zero (D8, D9).

### 4.5b `src/plugins/omni/ext/monster/objects/Game_Enemy.js` — where the pedia observes

Beyond the `killer` repair in 4.1, Monsterpedia's observation **moves one method inward**: it stops
aliasing `makeDropItems` and aliases `postProcessDroppedLoot` instead, observing its **input** before
calling through.

That input is the base list, so the pedia keeps recording exactly what it records today (D17) while
the player still receives the promoted rows. It is the same outer-wrapper shape the file already uses,
pointed at a method one level down, and it needs no knowledge of ladders.

### 4.6 Nothing else in plugin source changes

`passive/ext/affix` is untouched. Affixes are passive states, so they contribute through
`getAllNotes()` with no knowledge of this system on either side.

`sdp/core/objects/Game_Enemy.js` is untouched too, which is the point of leaving `findLoot`'s signature
alone. Its panel drops are handled by D15 from the drops side rather than by editing SDP.

---

## 5. Tests

`test/plugins/drops/core/**`, one `it` per branch, `// Arrange` / `// Act` / `// Assert` inline.

**Ladder construction** — builds a two-rung map; builds a four-rung map; inverts correctly; **throws on
a fork**; **throws on a cycle**; **throws on a `dropUpgradeId` naming a row that does not exist** (D16);
a table with no `dropUpgradeId` anywhere yields empty maps.

**The walk** — up one rung; up several; **clamps at the top**; down one rung; **clamps at the bottom**; a
count of zero returns the original id; an id absent from the ladder returns itself unchanged.

**Summing** — enemy only; killer only; both summed; a negative and a positive cancelling; no killer
yields the enemy's count alone.

**Quantity** — a positive adds copies; a negative reduces them; a negative that exceeds the count
removes the item entirely (D9); a bonus against a failed roll changes nothing; a bonus of zero leaves
the list untouched.

**Quantity grouping — the D8 case.** The fixture is Jeremy's tree verbatim: four `<drop:[i,47,100]>`
entries plus one `<drop:[i,49,100]>`, against `<dropQuantity:2>`. Asserts **exactly 6 of item 47 and
exactly 3 of item 49** — hardcoded, not computed from the inputs. An implementation that applies the
bonus per entry yields 12 and 3 and must fail this test. The two different items are also what stop
"groups correctly" and "adds to everything" from being the same program.

**Grouping order — the D14 case, and the one this plan got wrong twice.** The fixture above cannot
catch it, because items 47 and 49 sit on no ladder and both orderings agree. This one needs the
collision: ladder 47→48 with **48 at the top**, an enemy dropping one 47 and one 48, `<dropUpgrade:1>`
and `<dropQuantity:2>`. Asserts **exactly 4 of item 48, and no item 47 at all**. Grouping before
promotion yields 6 and passes every other test in this file.

**Synthetic loot (D15)** — an `itemsFound` containing an SDP-shaped entry (`id: 0`, no `kind`) plus one
real drop: the real drop takes the bonus, the synthetic one comes out untouched and uncounted. The
near-miss requirement applies here too — with only the synthetic entry present, "skips synthetic" and
"skips everything" are indistinguishable.

**Monsterpedia observes base rows (D17)** — an enemy whose drop always promotes: assert the observation
records the **base** id, and that the returned loot is the **promoted** row. One assertion alone proves
nothing here; it is the pair that pins the behaviour.

**The Monsterpedia fix** — asserts the killer reaches the original `makeDropItems`. This is the
assertion that would have caught the defect, so it is the one that must not be vacuous.

**Fixture requirement, per the mutation lessons.** Every ladder fixture holds a **near-miss sibling** —
a row in the same table, adjacent id, that is *not* on the ladder and must come out unpromoted. With
one candidate, "promotes the right row" and "promotes everything" are the same program and no
assertion can tell them apart.

Coverage stays at 100%. Mutation pass on the new files before the PR.

---

## 6. Definition of done

- [ ] `bun run hotfix` green
- [ ] `bunx vitest run test/plugins/drops` green, coverage 100% on every touched file
- [ ] `bun run mutate drops` — every survivor on the new ladder, walk and grouping code read and
      either killed or argued equivalent, per `docs/mutation-testing.md`. The survivor list is the
      output that matters; the score is not a target
- [ ] `grep -n 'killer' src/plugins/omni/ext/monster/objects/Game_Enemy.js` shows the parameter
      declared and forwarded
- [ ] `grep -n 'findLoot' src/plugins/drops/core/objects/Game_Enemy.js` shows the signature still
      taking exactly `(drop, itemsFound)` — proving the SDP alias cannot swallow anything
- [ ] in-game: an enemy carrying a `<dropUpgrade:1>` **passive** state drops the row named by its
      drop's `<dropUpgradeId>`, not the base row
- [ ] in-game: `<dropQuantity:2>` on that same enemy yields three copies where it previously yielded one
- [ ] in-game: the Monsterpedia entry for that enemy unmasks the **base** drop, not the promoted one
- [ ] in-game: killing it with J-SDP panel drops active still awards exactly one of each panel
- [ ] a deliberately forked ladder fails at launch with both ids named, and so does a
      `<dropUpgradeId>` pointing at a row that does not exist

---

## 7. Open for review

Nothing outstanding.

Two questions this plan carried are now closed. Whether `<dropQuantity:N>` applies per drop entry or
per distinct item: **per distinct item** (D8). Whether grouping happens before or after promotion:
**after** (D14).

The second was briefly declared unaskable on the grounds that D5's fork check made `upgradeMap`
injective. That reasoning was wrong — injectivity survives one hop, not a clamped n-hop walk — and the
question was real. It is recorded here because the mistake is easy to make again while reading D5.

---

## Later

Not in this plan, kept because the design conversation on 2026-08-19 settled them.

### Flux drives scale affix appearance

Key off the **summed cost of enabled drives only** — the easy/hard layers must contribute nothing.
Both effects apply as the sum climbs: more enemies carry an affix at all, and the `affix-weight`
distribution flattens so the rarer tiers stop being rare.

The roll site is `passive/ext/affix/managers/JABS_AiManager.js:80-118` — `prefixChance` / `suffixChance`
gate application and `RPGManager.weightedMapChoice` picks which. Those are exactly the two knobs.

**Two things block it.** Nothing currently marks a layer as a drive: `Game_Temp.buildAppliedDifficulty`
sums `cost` across *all* enabled layers, and the layer object carries only
`key, name, iconIndex, description, cost, actorEffects, enemyEffects, rewards, enabled, unlocked, hidden`.
The only signal that `011_crimson-drive` through `016_royal-drive` are drives is the key suffix and
their cost being 2-8 where every easy/hard rung is 1. That wants a real field, which touches the
difficulty schema, CA's `config.difficulty.json`, and probably an editor board. Second, the affix ship
would read `J.DIFFICULTY` — a real cross-plugin dependency needing an `@orderAfter` declaration under
`verify:declared-dependencies`.

`DifficultyBonusEffects` is the right home for the multiplier. Its existing `encounters` field is not
reusable — it is read only by `Game_Map.encounterStep`, which governs vanilla random encounters and is
inert under JABS.

### Player-side harvesting gear

Once `<dropUpgrade>` reads from equipment, an accessory or weapon bearing it becomes a harvesting tool.
Reserve at least one for the crafting tree; the vocabulary writes itself in a game whose affixes are
already cuts of meat. This is CA data authoring on top of section 4, not plugin work.

### Adjacent, settled, out of scope

- **Anomalies should be present until killed**, not rolled on map transfer. The Hunting Lord's dialogue
  says the board lists what he has *detected*, and the `anomaly * dead` switches (241-252) already model
  a one-time kill. The existing `var 13` roll should govern the post-kill **echoes**, which the dialogue
  establishes as harmless and farmable.
- **Veterans are a separate idea from anomalies** and should never touch the Lords' system. An anomaly
  has no history by definition; a veteran is nothing but history. The bearcat cull in Ch1 is a mandatory
  quest about bearcats being a problem and is the natural host for the first one.
- **Day/night enemy variation wants one global rule**, not a per-zone table — the dead and the flying at
  night, things that photosynthesize or graze by day. The bestiary already splits cleanly along that
  line, so it costs no per-map authoring.
- **Drive-gated rooms**: content that only opens while a specific drive is active, clustered by drive
  rather than by dungeon so one trip to the Difficulty Lord creates a route. Save sigils were considered
  and ruled out as flux terminals — `Map238` establishes in shipped text that the protagonists cannot
  operate flux technology themselves.

### Notes

- Two copy-paste defects were fixed on 2026-08-19 and are not part of this: the six flux drive item
  descriptions named the wrong layers, and common event 37's royal branch announced `\Item[137]` while
  checking for 138.
- Absent drop sources on the upper ladder rungs are **unbuilt content**, not a gap this repairs. The
  enemies that will drop them arrive with the maps that hold them.
