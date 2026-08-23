# `omni/ext/stats` — a Statistopedia extension

## Severity

**None.** Nothing is broken. This is new player-facing surface built on data J-ABS-Metrics is
already recording.

## Gain

**High for player engagement, low for engineering risk.** A stats screen is the cheapest content in
the game: every number in it is already being computed for some other reason. The playtest value is
the real draw- handing the controller to someone, letting them play, then reading their profile back
to them is how you learn what your combat system actually teaches people to do. A player who never
guarded, never dodged, and never used an item is telling you something about the game, not only
about themselves.

## Source

- `src/plugins/abs/ext/metrics/**` — the recording layer, built 2026-08-22
- `src/plugins/omni/ext/monster/**` — the structural template to copy
- `src/plugins/omni/core/scenes/Scene_Omnipedia.js`, `windows/Window_OmnipediaList.js` — the root
  list each extension augments to add its own row

## Context

J-ABS-Metrics records combat activity into game variables in the 61+ block. Variables were the right
choice for that layer because event commands can read them- trophy conditions, message windows,
conditional branches- and because they were already how `__ca-mods` did it.

They are the wrong store for a pedia. A stats screen wants shapes a flat integer cannot express:
damage broken down per weapon, deaths per area, a most-used-skill ranking, a longest-streak record
with the map it happened on. Monsterpedia already solved this: it keeps a serialized model on
`Game_System` with its own save codecs (`registerOmniMonsterSaveCodecs.js`), and never touches a
variable.

**The decision to make first is which layer owns the truth.** The recommendation is the model, with
J-ABS-Metrics mirroring into variables only for the handful of counters that trophies genuinely
branch on- two stores that both claim to be authoritative will disagree, and the one nobody reads
will be the one that is wrong.

## Work

1. Decide the ownership split above. Everything else follows from it.
2. Scaffold `omni/ext/stats` from `plugin-template`; namespace `J.OMNI.EXT.STATS`.
3. Model the observation record and register its save codecs, mirroring
   `__models/MonsterpediaObservations.js` and `registerOmniMonsterSaveCodecs.js`.
4. Augment `Scene_Omnipedia` / `Window_OmnipediaList` to add the Statistopedia row, exactly as
   `omni/ext/monster` does.
5. Build `Scene_Statistopedia`, `Window_StatistopediaList`, `Window_StatistopediaDetail`.
6. Extract any selection or formatting logic into services- windows stay dumb.

## Candidate content

Grouped as the categories a detail window would page through.

**Combat identity**
- damage dealt / taken, crits, biggest hit, kills, deaths (recorded already)
- whiff rate: actions fired versus actions that ever connected
- accuracy versus evasion: swings that missed because the target outclassed you
- favorite weapon, by damage dealt
- most-used skill, and the equipped skill that was never once fired

**Defensive profile**
- guard activations, guarded hits, damage prevented by guarding
- parries split implicit versus precise, and glancing blows
- dodges, attacks evaded
- closest call: the lowest hp ever survived at
- longest streak without taking a hit

**Superlatives**
- longest kill streak without dying
- most enemies killed by a single action
- overkill damage: how far past zero the killing blows went
- best single map or session

**Chef Adventure specific**
- recipes crafted, meals cooked, ingredients gathered
- food buffs consumed (`abs/ext/food` already tracks the chain)
- SDP nodes unlocked, knowledge points earned (`prof/ext/knowledge`)
- quests completed (`omni/ext/quest`)
- monsterpedia completion percent- cross-linked rather than recomputed
- damage taken from floor and environmental hazards

**Progression**
- nodes ranked up, total SDP points earned and spent lifetime, highest panel rank
- levels gained
- items refined, highest refinement tier reached
- unique recipes discovered, crafts by category

**Exploration and economy**
- unique maps visited, chests opened, destructibles broken split by kind
- steps taken- `$gameParty` already tracks it, so this is a read rather than a counter
- gold earned and spent lifetime, most expensive single purchase

**Flavour, and the reason it is not filler**
- times rested at the inn, party cycles, trees chopped
- enemies defeated per family ("Bearcats Slain: 847"), named `!`-prefix enemies killed

These are screenshot bait, and that is the point- players share them, which makes them the cheapest
marketing surface in the game. A second use: some stats double as a tutorial that never interrupts
anyone. A player who reads "Parries: 0" may go and find out what parrying is, which no tooltip has
ever achieved.

**Derive at render time, never store**
Crit rate, parry rate, accuracy, damage ratio, implicit-versus-precise split, kills per hour. Each is
a division of two counters that already exist, and storing the quotient creates a second number that
can fall out of agreement with the first two.

## Definition of done

- [ ] `src/plugins/omni/ext/stats/` exists with a vite config, and `bun run hotfix` is green
- [ ] in-game: open the Omnipedia, a Statistopedia row sits beside Monsterpedia and Questopedia
- [ ] in-game: kill something, save, reload, and the counter survived- proving the model persisted
      rather than a variable being read
- [ ] `grep -r 'gameVariables' src/plugins/omni/ext/stats/` returns nothing, per the ownership
      decision above

## Notes

- The whiff metric needs no `abs/core` change: a `JABS_Action` is flagged for removal by
  `countdownDuration` and filtered out by `JABS_Engine.clearActionEvents`, so an extension holding a
  `WeakSet` of actions that announced a connection can compare the two at removal time. The set
  collects itself.
- Requires a `ca` repo change to register the built plugin, unlike most items here.
- The name predates this item and stays- it fits the Omnipedia `-pedia` convention and CA's tone.
  This absorbs the older `statistipedia-records-screen` item, whose metric lists are merged above and
  whose "keep using game variables" architecture is superseded by the decision at the top of this file.
