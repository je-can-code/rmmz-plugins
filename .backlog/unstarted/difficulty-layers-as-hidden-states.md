# J-Difficulty: difficulty layers become passive states on everyone

## Status

Split into three phases, done in order, with the drive rebalance after all three:

1. **Convert layers to states. Done 2026-09-24.** J-Difficulty is now **J-Passive-Difficulty**
   (`src/plugins/passive/ext/difficulty`, `J.PASSIVE.EXT.DIFFICULTY`). Each layer names an
   `actorStateId` and an `enemyStateId`, granted as J-Passive passive states through each battler's
   `getPassiveStateSources()` from one synthetic `<uniquePassive:[...]>` row per side, rebuilt on every
   toggle. The parameter arrays, the rewards block and every override that read them are gone.
   J-Difficulty-Affix is retired as a ship and **folded in rather than moved**, because an extension may
   not have extensions of its own: its arithmetic lives in `managers/DifficultyAffixManager.js`, and its
   aliases run only behind `if (J.PASSIVE.EXT.AFFIX)`. Chef Adventure's drives are states **501-512, in
   pairs, actor first** (Crimson 501/502 through Royal 511/512), each tagged `<hideFromPassiveList>`, carrying
   today's numbers wherever a trait expresses them. The Favor and Challenge tiers are removed, Royal has
   icon 1014, and the jmz-data-editor board edits the two state ids. Rates floor at zero: J-Base's
   `sparam` total and J-NaturalGrowth's rate factor (`calculatePlusRate`); ex-parameters keep negatives.
2. **Rebuild the difficulty scene. Done 2026-09-25.** `Scene_Difficulty` sits on `Scene_MenuFacetBase` (help
   strip describing the highlighted layer, control legend, no pixel literals), with the points and the layer
   list in the command column and two flat lists beside them: Actor Effects and Enemy Effects, one row per
   effect. `services/DifficultyEffects.js` builds the rows from each layer's states through J-Base's
   `RPG_Trait` text and `TraitResolver.consolidate`, and the applied row lists every layer in force merged into
   one row per stat. Values are colored from the player's side: easier in the power-up color, harder in the
   power-down color. Tag-borne effects join the lists with phase 3.
3. **A generic tag describer, then every tag, together** (direction set 2026-09-25; the describer landed the
   same day, uncommitted). J-Base's `NotetagDescriber` holds one describer per tag, registered by the plugin
   that owns the tag against the same `RegExp` its reader uses, and answers `NotetagLine`s for every tag on a
   row: an icon, words drawn with drawTextEx, a value, and whether it helps or hurts whoever carries it. It
   reads through `RPGManager.getMatchesFromNoteByRegex`, captures unparsed, so a formula stays as written. A
   describer answering no lines is a decision (the tag configures and says nothing); an unregistered tag is
   still to discuss. Tags are never merged the way traits are. The difficulty lists show every described tag
   after the trait rows, toned the same way. The natural Buff/Growth tags are derived rather than written:
   J-NaturalGrowth describes the four tags of every bound parameter at `Scene_Boot.start` (44 parameters, 176
   tags in Chef Adventure) in the passive menu's existing words (`Power Buff+`, `+10`, growth adding ` /lv`),
   a formula showing as written in brackets. Every other tag gets its line with Jeremy, one family at a time,
   the way the SDP mastery prose was written: `<rewardMultiplier>` first, since the drives need it, then down
   `docs/notetag-reference.md`, state-applicable families first. The Passives detail view's hand-kept tables
   (its natural one lacks CNT, MEV, MRF, PHA, FDR and EXR) can draw from it afterwards.

   **How a family gets its lines (Jeremy, 2026-09-25):** read the family, then suggest a line for each tag in it.
   Lines are Hades-style prose: every value bold and colored by the screen showing it (good on me, bad on the
   enemies), every changed thing highlighted.

   **Where the lines live (Jeremy, 2026-09-25: "lets externalize it, using the template system that SDP masteries
   already established"):** the sentences are Chef Adventure's, in `data/config.notetag-lines.json` (an array of
   `{ key, template }`), edited on the editor's Tag Lines board and loaded by J-Base's `Scene_Boot`. Only the
   sentence is data: a describer still reads the tag, formats the numbers, names things through the managers and
   decides good-or-bad, then calls `NotetagDescriber.line(key, { iconIndex, holderImpact, value, tokens })`.
   Tokens are named per describer (`{value}`, `{reward}`, `{stat}`); every one but `{value}` is filled in SDP's
   palette by kind, and `{value}` is left for the screen. A missing key or a missing token shows no line (fail
   closed, like SDP); an empty template is a tag that deliberately says nothing, so the config doubles as the
   checklist of what is done.

   **Families with their lines:**
   - `<rewardMultiplier:[TYPE, X]>` (2026-09-25): one row per type, in Jeremy's words:
     `Enemies yield 2.4x EXP.`, each reward named and
     iconed by the manager that owns it (`TextManager.exp` / `currencyUnit` / `sdpPoints()` / `apPoints()` /
     `rewardParam(2)`, `IconManager.rewardParam` / `apPoints()`); more than x1 hurts its holder, so a bigger
     bounty reads easier on Enemy Effects. SDP and AP rows only exist where J-SDP and J-Aptitude do. Along the
     way AP got a name and an icon of its own (`TextManager.apPoints()`, `IconManager.apPoints()`, J-Aptitude),
     and the combat log and the AP popup read every reward name from the managers instead of hardcoding them.
     Found doing it, and fixed the same day: J-Aptitude loaded after J-Passive-Affix in Chef Adventure and
     assigns `JABS_Engine.prototype.determineApGained` outright, so the affix's alias wrapped nothing and the `ap`
     half of every reward multiplier never applied. Chef Adventure's `plugins.js` now loads J-Aptitude and
     J-Aptitude-Typed just above J-Passive, which J-Passive's own `@orderAfter J-Aptitude` always asked for.
   - `<critMultiplier:NUM>` / `<critMultiplierBase:NUM>` (2026-09-25), J-CriticalFactors:
     `Critical hits deal +50% more damage.` and `The base multiplier for critical hits is +50% damage.` The two
     mean different things: the base is what every crit multiplier adds onto (the plugin's 50% default plus every
     `<critMultiplierBase>`), and what the natural `cdmRate` tags and SDP's crit panels are percentages of.
   - `<critReduction:NUM>` / `<critReductionBase:NUM>` (2026-09-25): `Extra damage taken from critical hits -30%.`
     and `The base reduction on critical hits taken is +20%.` A reduction trims only a crit's extra damage, so its
     line shows that damage moving the opposite way (a negative reduction, like Careless, reads `+10%` and hurts
     its holder); the base is a reduction in its own right and shows as written. Found reading it, and fixed the
     same day with Jeremy's OK: the base crit reduction never counted against a crit (only `ctr` did), yet Chef
     Adventure configured it at 50%. It now counts against every crit, the way the base multiplier counts toward
     one, and defaults to 0 (Jeremy: "it should PROBABLY default to zero!"). What leaned on the old base was
     converted so it keeps working: the Crit Block states and Paper Fortress grant `ctrBuffPlus` instead of a
     `ctrBuffRate` of a base that is now 0, and the 19 percent-of-base SDP crit reduction rows are flat, keeping
     their authored numbers. The same day, also with Jeremy's OK: SDP was handed the crit bases as factors while
     the crit math sums its panels in percent points, so every percent-of-base crit panel paid a hundredth of its
     share. The bases now reach SDP in percent points, and the 40 crit damage percent rows pay what they say.
   - `<onCritApply>` / `<onCritSelf>` / `<thisCritApply>` / `<thisCritSelf>` (2026-09-25), crit first:
     `Critical hits have a 50% chance to inflict Sting.`, `... to grant Diabolical to self.`, and the skill-scoped
     pair opening `This skill's critical hits ...`. The state is named and iconed the way J-Base's own state lines
     are, from `$dataStates`, and a proc always helps whoever carries it.
   - `<forceCritProcs>` (2026-09-26), in Jeremy's words and colors: `On-crit effects ALWAYS land when landing a
     critical hit.`, with ALWAYS in `\C[3]` and the critical hit in `\C[2]`. It carries no amount, so nothing in it
     is the screen's to color.
   - `<critChanceIfState>` / `<thisCritChanceIfState>` (2026-09-26): `+30% critical hit chance against targets with
     Sting.` and `This skill has +30% critical hit chance ...`. A state in a line is written as J-Message's
     `\state[ID]` text code (Jeremy's answer to naming states without copying them), which draws its icon and name
     from the database when the line is drawn; the on-crit lines above were switched to it the same day.
   - `<critChanceIfStateType>` / `<thisCritChanceIfStateType>` (2026-09-28): the same lines, against targets with
     `any bleed state`. A state type is a classifier the states declare, not a database row, so no text code can
     draw it; it shows exactly as the tag writes it, which reads fine for every type Chef Adventure's tags name.
   - `<critAlwaysIfState>` / `<thisCritsAlwaysIfState>` and their `...Type` twins (2026-09-28), in Jeremy's words:
     `If the target is afflicted with Sting, then critical hits are GUARANTEED.` and `If the target is afflicted
     with Sting, then this skill is GUARANTEED to land a critical hit.`, the type pair reading `any bleed state`.
     A tag listing several states gets a line for each, since any one of them is enough. That completes every
     J-CriticalFactors tag a state can carry.
   - `<dropMultiplier:NUM>` / `<goldMultiplier:NUM>` (2026-09-28), J-DropsControl: `+30% item drop chance for the
     whole party.` and `+5% gold from enemies for the whole party.` Only a party member's tags count, and every
     member's add together, which is what "for the whole party" says. Gold's own description no longer promises
     chests, which nothing reads it for.
   - `<dropUpgrade:NUM>` / `<dropQuantity:NUM>` (2026-09-28): `Every item dropped is upgraded +2 tier.` and `Every
     item dropped comes with +1 extra.` Both sides of a kill contribute, but every one Chef Adventure writes sits on
     an enemy affix, so a better haul reads as the enemy's bounty: good news for the party, like a reward multiplier.
   - `<absorbElements:[...]>` (2026-09-28), J-Elementalistics, in Jeremy's words: `Absorbs Heat, Void.`, one line
     per tag, each element written as J-Message's `\element[ID]` so it draws its own icon, color and name.
   - `<boostElement:[ELEMENT_ID, PERCENT]>` (2026-09-28): `+50% Heat damage dealt.` Deliberately not "Heat skills
     deal...": most skills carry several elements, and that phrasing reads as if a skill had only one.
   - `<strictElements:[...]>` (2026-09-28): `Only takes damage from Shatter, Crush.` Terse on purpose, though
     non-elemental hits still land.
   - `<pierceElement>` / `<thisPierceElement>` (2026-09-28): `Negates 5% Heat resistance.` and `This skill negates
     ...`. Jeremy's word: "pierce" and "ignore" both suggest hits landing raw, with no resistance at all.
   - `<slayer:[ELEMENT_ID, PERCENT]>` (2026-09-28): `+50% damage vs Undead.`, the element's own name finishing the
     sentence, since Chef Adventure names its family elements `vs Undead`, `vs Beast` and so on. That completes
     every J-Elementalistics tag a state can carry.
   - `<proficiencyBonus:NUM>`, `<proficiencyGivingBlock>` and `<proficiencyGainingBlock>` (2026-09-28), J-Proficiency:
     `+3 proficiency from every skill used.`, `Skills used against this earn no proficiency.` and `Skills used by
     this earn no proficiency.` Denying attackers their proficiency works for whoever carries the giving block; the
     gaining block only ever holds its own holder back.
   - `<passive:[...]>` / `<uniquePassive:[...]>` (2026-09-28), J-Passive: `Grants Undying Rage I.` and `Grants ...,
     which never stacks.`, every state as `\state[ID]`. `<hideFromPassiveList>` only tidies the Passives menu, so
     its sentence is written empty in the config: decided silent, and still the config's to change.
   - J-Passive-Conditional (2026-09-28): every one of its tags hangs on a condition, so the config gained a
     condition vocabulary beside its sentences: `trigger.*` (when a rule fires), `gate.*` (while a passive holds),
     `count.*` (what a stack is counted per) and `unit.*` (seconds, tiles), each a lowercase clause ending its
     sentence. A count of one needs its `.one` phrase and a scoped gate its scope's phrase, or the line is left out;
     only a throttle may go unsaid. No trigger names a pronoun, so each reads right on an enemy too; the one "you" is
     `per enemy targeting you`. The sentences read `Grants Rooted Stance I every 3 seconds spent standing still.`,
     `Uses Scorched Halo every 1 second while 2 enemies are within 5 tiles.`, `Only active after 8 seconds without
     taking damage.`, `One stack of Undying Rage I per 4% of Life missing.` and `Moving removes Rooted Stance I.`,
     and every one of the 149 conditional tags in Chef Adventure's database draws a line. A removal on resolution
     fires when the skill's action ends, hit or whiff, so it reads `Finishing any skill...`, never "hitting".
   - The Passives detail view (2026-09-28) now draws those lines under a state's header, in place of the three
     hand-written prose models, which covered only `time`, `stand`, three of the inflict kinds and moving: Trauma's
     knockback inflict shows there for the first time. The 57 lines on skills, most of them gates, never reach that
     screen, which shows states; SDP's mastery prose still words those gates its own way.
   - Long lines wrap (2026-09-28): checked in the running game, the difficulty screen's effect columns clipped a
     sentence-length row. Now a row too long for its column carries on beneath itself through J-Base's
     `TextWrapper` and a multiline command, and stands as tall as its lines while the rows beneath move down.
     A color or bold cut by the break picks back up on the next line (`TextWrapper.wrapStyled`). The Passives
     panel wraps its lines the same way.
   - Locked layers show (2026-09-28), Jeremy's call: "locking is necessary and should be visible." Locking makes
     a layer unchoosable, as the plugin command always said, and only hiding keeps it out of sight. The list had
     been leaving locked layers out entirely, so its padlock was never drawn; now every drive a new game locks is
     listed behind its padlock, its description, cost and effects there to read.

Then the **rebalance**, drive by drive: the ex-parameter multipliers that have no trait form, and Royal's
three overlaps.

## Source

- `src/plugins/passive/ext/difficulty/` (J-Passive-Difficulty: the layer models, `objects/Game_Temp.js`'s
  passive sources and refresh, and the folded-in affix biasing in `managers/DifficultyAffixManager.js`)
- `src/plugins/passive/ext/difficulty/scenes/Scene_Difficulty.js`, `windows/` and `services/DifficultyEffects.js`
  (the scene phase 2 rebuilt, and the rows it lists)
- `src/plugins/_base/core/managers/NotetagDescriber.js` and `models/NotetagLine.js` (the tag describer and its
  line), and `src/plugins/natural/core/core/describeNaturalNotetags.js` (the derived Buff/Growth lines)
- `src/plugins/passive/core/objects/Game_Battler.js` (`getPassiveStateSources`, `isPassiveState`, and the
  `allStates` / `removeState` / `isStateAddable` / `getPurgeableStates` overrides that make a passive state
  untouchable)
- `src/plugins/passive/core/windows/Window_PassiveDetail.js` (the passive menu's description of a state,
  which its extensions feed through `*Display` helpers)
- `src/plugins/sdp/core/managers/MasteryProseResolver.js` and `src/plugins/_base/core/models/ParameterDefinition.js`
  (the other two places that already turn a state's traits and tags into text)
- `src/plugins/abs/core/models/JABS_Battler.js` (`shouldProcessState`, JABS's untracked-state pruning)
- `src/plugins/passive/ext/affix/objects/Game_Enemy.js` (`getRewardMultiplierByType`, the reward tags)
- `ca/chef-adventure/data/config.difficulty.json` (7 layers), `States.json` rows 501-512, `js/plugins.js`
  (the `j/passive/ext/J-Passive-Difficulty` entry), and the 10 plugin-command calls to it: common events 37
  and 38, `Map228.json` and `Map238.json`
- jmz-data-editor: `app/src/presentation/boards/difficulty/DifficultyBoard.tsx` and
  `DifficultyStatesSection.tsx`, `app/src/core/domain/valueObjects/difficulty-config.ts`

## Context

Every difficulty layer carries its own hand-rolled parameter model: a percentage for each of the 8 base
parameters, 10 ex-parameters and 10 sp-parameters, once for actors and once for enemies. J-Difficulty
then overrides `param`, `sparam` and `xparam` on `Game_Actor` and `Game_Enemy` to multiply by whichever
layers are applied. That is a second, private copy of what RMMZ's trait system already does, and it only
reaches the parameters it was written for. `cparams`, the slot meant for custom registry parameters, is
carried through the metadata and the layer copies, but nothing ever applies it, and it is empty in all
17 of Chef Adventure's layers.

Jeremy's direction (2026-09-23): a layer names a state for actors and a state for enemies, and applying
the layer applies those states secretly. The states' traits carry the modifiers, so any trait works,
registry parameters included, and the States board becomes the one place a difficulty's numbers are
authored.

Refined 2026-09-24, after a review against source: **a difficulty is a passive that is on for everyone,
perpetually, so J-Difficulty becomes an extension of J-Passive.** Its layer states are J-Passive passive
states, granted to every actor and every enemy. J-Base's seams alone cannot keep a granted state safe (see
Notes). J-Passive already does that for its own states, so a layer state that is a passive state gets all
of it for free.

## Work

- Move J-Difficulty under `passive/ext/` as an extension of J-Passive (`J.PASSIVE.EXT.DIFFICULTY`), and
  fold J-Difficulty-Affix into it. Point Chef Adventure's `plugins.js` entry and its 10 plugin-command
  calls at the new plugin name.
- Give each layer an actor state id and an enemy state id, and remove `DifficultyBattlerEffects` and its
  four arrays.
- Grant every enabled layer's states as passive states: the actor state to every actor, the enemy state
  to every enemy. Do it through each battler's passive sources (`getPassiveStateSources`), not the party's
  passive list (see Notes).
- When a layer is enabled or disabled, refresh the passive states of every actor and every live enemy.
- Remove the `param` / `sparam` / `xparam` overrides.
- Remove the `rewards` block and the overrides that read it. Exp, gold, SDP and drops scale through
  `<rewardMultiplier:[TYPE, X]>` on the enemy state instead.
- Describe each layer the way the passive menu describes a passive: the difficulty scene shows the
  layer's two states through the same rendering `Window_PassiveDetail` uses, with every row a drive needs
  (see Notes for the gaps). Logic the rendering needs moves out of the window into a service as it is
  touched, since view logic does not grow in place.
- In jmz-data-editor, replace the parameter arrays and the rewards block on the difficulty board with the
  two state pickers.
- Migrate Chef Adventure's six drive layers (011-016) into states, rebalanced so each is manageable on its
  own and in combination. Author each number as a trait wherever one exists, and as a tag where none does.
  The Favor and Challenge tiers (001-010) are removed rather than migrated. Aqua and Royal share icon 1013
  today; give Royal its own.
- Give parameters a floor, so summed rates from several sources cannot drive one below it. MHP's existing
  floor of 1 stays as it is.

## Definition of done

- [x] `grep -rn 'bparams\|xparams\|sparams\|cparams' src/plugins/passive/ext/difficulty/` returns nothing
      outside `_annotations.js` changelog text, and the ship defines no parameter, reward or encounter
      override
- [ ] in-game: enable a layer whose enemy state carries ATK x150%. Enemies hit harder, the state appears
      in no status window, HUD strip or state list, and disabling the layer puts ATK back
- [ ] in-game: with a drive enabled, a cleanse that strips every positive state leaves the drive in place,
      and the drive state never reaches JABS's untracked-state removal
- [ ] in-game: a layer whose state carries a registry parameter (a J-CriticalFactors parameter, for
      example) takes effect, which the arrays could never do
- [ ] in-game: enabling a drive changes every party member's numbers at once, without waiting for any
      state or equipment change
- [ ] in-game: an enemy state carrying `<rewardMultiplier:[exp, 2]>` doubles the exp that enemy yields
- [ ] the difficulty scene tells the player everything each layer does, tag-borne effects included (traits
      since phase 2; natural Buff/Growth tags since phase 3; every other tag as its family gets its line)
- [x] the difficulty board edits state ids, and Chef Adventure's `config.difficulty.json` carries no
      parameter arrays, no rewards block and no Favor or Challenge tiers
- [ ] Chef Adventure boots on the moved plugin, and its difficulty menu, drive unlocks and layer-point
      command still work
- [ ] no two drive layers' states touch the same parameter or tag: list each drive state's traits and
      tags, and no parameter appears under more than one drive
- [ ] the floor holds: a parameter pushed down by a drive and by the battler's own gear or states stops
      at its floor rather than reaching zero or below
- [x] `bun run hotfix` green and coverage still 100% (phase 1)

## Notes

- **Why J-Base's seams are not enough (found 2026-09-24).** A state that J-Difficulty put into
  `allStates()` by itself would be attacked from two sides. JABS's regen tick
  (`JABS_Battler.shouldProcessState`) calls `removeState()` on every state in `allStates()` it is not
  tracking, sparing only what `isPassiveState()` claims, and JABS's cleanse pool (`getPurgeableStates`) is
  `allStates()` with only J-Passive's passives taken back out. Going around `allStates()` through
  `getNotesSources()` alone does not work either: bonus hits, an enemy's `<level:+N>`, HCR, J-Extend's
  on-hit, on-cast and reactive states, drops/passive, and the affix and conditional managers all build
  their sources from `allStates()` directly. A passive state passes every one of those checks.
- **Per-battler passive sources, not the party list.** J-Passive's party passive states
  (`$gameParty.passiveStates()`) reach actors' traits and notes, but never `allStates()` and never
  `isPassiveState()`, so they would reopen both holes above, and they never reach enemies at all. A
  synthetic source added to each battler's `getPassiveStateSources()` puts the layer states in
  `_j._passive._stateIds`, where every check looks. Build that source once per refresh and reuse it:
  `buildSourceFromStateIds` makes a fresh `RPG_BaseItem` on every call, and RPGManager caches note parsing
  by object, so a new object per call misses the cache every time.
- **What "secretly" comes to.** No icon (icons come from `states()`), no HUD strip (it draws
  JABS-tracked states only), no turn count (nothing was ever added), no cure (J-Passive's `removeState`
  guard), no cleanse (`getPurgeableStates`), and J-Passive-Conditional's rule tags fire, since
  `AutoRuleManager` reads `getPassiveStateSources()`, which includes every passive state.
- **Refreshing on toggle.** Traits, notes and J-NaturalGrowth's buff tables are cached per battler and
  rebuilt only by `onBattlerDataChange()`, which `refreshPassiveStates()` triggers. The old overrides read
  the applied difficulty live, so this never came up before. In Chef Adventure the difficulty can only
  change on one map, which has no enemies, but the refresh still covers enemies.
- **Traits where they exist, tags where they do not (decided 2026-09-24).** The rebalance absorbs the
  difference from today's multipliers: J-Base stacks param and sp-param rate traits additively,
  ex-parameter traits add rather than multiply, and a J-NaturalGrowth `BuffRate` tag scales the value
  before natural bonuses, which for a base parameter is the level curve alone, with no gear, growth or
  SDP. Base parameters already have a floor (the engine clamps at `paramMin`, and J-Base floors
  `paramRate` at zero), so the floor work is the ex-parameters, sp-parameters and registry parameters.
- **Stacking between drives does not come up (decided 2026-09-23).** Drives are independent, so no two
  may touch the same parameter or effect. Today only Royal (016) breaks that rule: it shares MCR/TCR with
  Aqua, and MRG/TRG and enemy REC with Viridian. The rebalance moves one side of each.
- **Rewards ride tags.** `<rewardMultiplier:[exp|gold|sdp|ap|drops, X]>` belongs to J-Passive-Affix and is
  read from an enemy's `allStates()`, which passive states are part of. `encounters` has no tag. RMMZ's
  Encounter Half and Encounter None party abilities can ride the actor state, and nothing raises the
  rate. Chef Adventure has no random encounters, so nothing is lost there.
- **The describer already exists, in three dialects (found 2026-09-24).** `Window_PassiveDetail` is the
  most complete: sections for combat, parameters, elements, ailments, skills, equipment, properties and
  rewards, with extensions adding prose for their own tags through `*Display` helpers
  (`AutoApplyStateDisplay`, `SkillHistoryBonusDisplay` and the rest). Param traits (codes 21-23) render
  generically, so a drive authored traits-first only meets its gaps through tags: nothing renders
  `<rewardMultiplier>` anywhere yet, and the natural-tag rows come from a hand-kept table with no CNT, MEV,
  MRF, PHA, FDR or EXR rate rows. J-SDP's `MasteryProseResolver` reads a parameter off a row whether a trait, a
  `BuffRate` / `BuffPlus` tag or a plain tag carries it, but only inside SDP's authored templates. J-Base's
  parameter catalog already knows every parameter's label, icon, trait, natural tags, formatting
  (`prettyDelta`) and which direction is good for its holder (`isIncreaseBeneficial`), which
  `Window_DifficultyEffects` re-derives by hand in its `biggerIsBetter` tables. Folding all three into one
  J-Base service that every system draws from is broader than this item.
- **The affix biasing stays config-driven.** Biasing affix rolls and granting reserved affixes is about
  what the world spawns, not a battler's numbers, so it has no state to become. It moved into
  J-Passive-Difficulty with J-Difficulty-Affix's retirement, still read from each layer's `affixEffects`
  block.
- **Saves need nothing (Jeremy, 2026-09-24).** A save stores only each layer's key and flags and the point
  totals, never a layer's effects. Both Chef Adventure slots have only `000_default` enabled, and no event
  names a Favor or Challenge key.
