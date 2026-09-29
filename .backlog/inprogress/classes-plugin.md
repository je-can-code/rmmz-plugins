# J-Classes: unlockable classes with a class scene

## Source

- New family `src/plugins/class/`: `core` (J-Classes), `ext/apt` (J-Classes-Aptitude), `ext/natural`
  (J-Classes-Natural). Scaffold each with `bun run plugin:init <path>` and follow the template's
  `SCAFFOLD.md`.
- `src/plugins/_base/core/scenes/Scene_ActorFacetBase.js`, `Scene_MenuFacetBase.js`: the chrome the
  scene inherits (actor ribbon, control legend, content area, command column).
- `src/plugins/_base/core/models/FilterCycle.js`, `windows/Window_FilterStrip.js`: the L2/R2 strip pair,
  driven by the `content-prev` / `content-next` semantics in `_base/core/windows/Window_Selectable.js`.
- `src/plugins/cms/core/helpers/ParameterCatalogRenderer.js`: draws every registered parameter, and
  already compares against a `tempActor` for the equip scene (`cms/ext/equip/windows/Window_EquipStatus.js`).
- `src/plugins/apt/core/windows/Window_AptitudeSourceDetails.js`: the teachable ladder, extended by
  `apt/ext/typed` for the typed-AP badge.
- `src/plugins/natural/core/objects/Game_Battler.js`: `naturalParamBuff`, `naturalDisplayBase`, and the
  `ParameterRegistry.naturalBinding` tables the growth page reads.
- `src/plugins/level/core/objects/Game_Actor.js`, `_base/core/objects/Game_Actor.js`,
  `passive/core/objects/Game_Actor.js`: the `changeClass` / `onClassChange` chain a confirm rides.
- `src/plugins/abs/ext/loadout/windows/Window_MenuCommand.js`: the menu command pattern. (J-Aptitude's own
  menu command, the other example, was removed by this item.)
- CA: `data/CommonEvents.json` #46 "Self-reflection"; `data/Map358.json` "Bathroom" events #3 "first time
  reflection" and #4 "mirror"; switches 107-109 and 174; `js/plugins.js`; `docs/classes/main.md`.

## Context

Chef Adventure switches classes through common event 46, six Change Class commands behind dialogue.
That event exists on purpose, for the first reflection's scene in the Bathroom, and the mirror replaying
it every time afterwards is a placeholder. Classes in CA are whims Jerald and Rupert talk themselves into
in front of a mirror, so switching stays at the mirror, but the player also needs to review any class's
numbers and learning progress from anywhere.

`Scene_Aptitude` stays untouched and generic, and becomes a debug view reached only from the dev console:
J-Aptitude loses its menu command and its `menu-switch` parameter outright (Jeremy, 2026-09-24).

Decisions (Jeremy, 2026-09-23 to 2026-09-25):

- **A proper, generic plugin, not J-CA-Mods.** J-Classes owns unlocking, conditional switching, and the
  scene. Anything that reads another plugin's data is an extension of J-Classes.
- **Unlocks are per actor.** The unlocked set is what an actor's list shows (plus the class they are in
  right now), so no tag has to encode which trunk a fork hangs off. The first reflection unlocks the three
  trunks for each protagonist; trainer quests unlock forks.
- **Classes can belong to actors** (2026-09-25). `<unlockableForActors:[ACTOR_IDS]>` sets a class aside for
  the actors it names: it unlocks only for them (`unlockClass` refuses anyone else, with a
  `Diagnostics.warn`), and until they unlock it, it waits in their list as a dimmed "???" row. A "???" row
  gives nothing away- no name, no icon of its own, and highlighting it hides every window beside the list-
  and confirming it buzzes. A class without the tag is open to anyone and is never teased, since teasing it
  would tease every actor at once. In CA, classes 2-12 are Jerald's and 14-24 Rupert's, one actor each.
- **The starting classes drop out once left** (Jeremy, 2026-09-25: "After that, the only classes available
  should be the trunks. One of the trunks for each actor is basically an enhanced version of their starter
  class."). So Some Guy (1) and Know-it-all (13) carry no `<unlockableForActors>`: open to anyone, never
  unlocked, they show only while worn and disappear after the first reflection's change.
- **The entry point is the gate.** `call-scene` takes whether switching is allowed. The main menu opens
  the scene view-only (unless an optional switch says otherwise). View-only still browses every class;
  confirming just buzzes, and the legend does not offer it.
- **Two windows, no pages** (2026-09-25, replacing L2/R2 paging once the pages were short lists). The
  parameters window lists the parameters down a single column, with J-Classes-Natural's growth sections
  beneath them. J-Classes-Aptitude's window sits beside it on the right: what the class keeps known
  (`<unslottedSkills>`, J-SkillSlots' tag, so only with J-SkillSlots installed), then the ladder. With
  J-Classes alone the parameters take the whole width. Both windows draw their rows a shared inset in
  from each side (a tenth of the window, `ClassSceneLayout`), and the ladder's gauges are shortened to
  120 so the longest skill names still clear their numbers. Both also share a row height of 32 and a type
  one step smaller than the menus' (2026-09-25): at the standard 36, five of CA's ladders ran off the
  bottom (Orbiter and Melufa by 50px); at 32 the tallest, Orbiter, ends at 784 of 832.
- **KNOWN means learned, not lent** (2026-09-25). A teachable reads KNOWN only when the actor has learned
  the skill for good (`isLearnedSkill`), never because their class, gear or states lend it
  (`hasSkill`). Fucking Oni both lends Equip Glaive and teaches it at 2500 AP, so the old check hid that
  row's progress from anyone wearing Oni or Some Guy. AP already flowed into lent skills; only the ladder
  hid it.
- **A description across the top** (2026-09-25). `RPG_Class.description` is written by the JMZ data
  editor on the Classes board; RPG Maker has no such field. Two lines, spanning both windows.
- **Four columns per parameter** (2026-09-25): name, then multiplier, value and change, each
  right-aligned in a fixed-width column so the numbers line up and stay put as the cursor moves.
- **Every class lists the same fifteen** (Jeremy, 2026-09-25: "it looks kinda bad to have the left pane
  bounce around because MOST of the stats are modified, but not all", and "you don't need to write rules.
  The data is already in"): `ClassManager.LISTED_PARAMETER_KEYS`, in his order: mhp, mmp, mtp, atk, mat,
  def, mdf, agi, luk, hit, grd, cri, cev, eva, mev. A hardcoded list, deliberately, not a rule derived from
  the data. The title is "Parameters", since not every row is modified. Comparing another class, a stat it
  would move reads `value (±change)`; one it would leave alone reads its standing value, padded, with no
  change beside it (`ClassManager.isParameterChanging`), exactly as the equip screen draws an untouched
  stat. J-Classes-Natural's growth section reads in the same order, with anything unlisted (CA's Lifesteal
  and Item Effects growths) after it.
- **Buffs get multipliers too** (Jeremy, 2026-09-25: "if I gave a *buffplus to the base class, couldn't you
  just do that reverse math"): `ClassManager.referenceValue(actor, classId, parameterKey)` is the measure a
  multiplier is read from. Core measures curves; J-Classes-Natural extends it to measure a parameter with no
  curve by the class's flat Buff at level 99, against the starting class's.
- **Every value padded, every multiplier shown** (Jeremy, 2026-09-25: "all parameters should have the
  current/new value with the padded zeroes ... that is the preferred format", and "for the parameters with
  x1.00, it should STILL show the 1.00, just leave the colors for the row white"). A changed value is padded
  too, its digits in the power-up or power-down color (`ClassManager.parameterChange` returns the padded text
  and a `colorIndex`; `changeColorIndex`). A row is colored by whether switching moves it, so a ×1.00 row is
  white from the starting class, but still red or green when worn from a class that isn't ×1.00 there.
  Padding rounds to whole numbers, so a fractional stat reads `0002 (+0.2)`.
- **Crit, Crit Dodge, Evasion and Magic Evasion are flat numbers** (Jeremy, 2026-09-25: "cri, cev, eva, and
  mev should not be percents, they should be flat numbers"). J-Base registers them `SCALED_POINTS`, the format
  Accuracy already had: the same stored values and tag units, shown without a `%`, everywhere they appear.
- **No "While in this class" section** (Jeremy, 2026-09-25: "Nothing in there exists that doesn't show up in
  the 'modified parameters' section"). Every CA class buffs exactly hit/eva/cri/cev/mev/grd, all six among
  the fifteen, and no class carries a BuffRate, so the section could only ever be empty. A buff shows in its
  parameter's value and multiplier. `ClassGrowthManager.readGrowths` reads growths only.
- **An MTP curve is only the base** (Jeremy, 2026-09-25: "why would it clobber literally EVERYTHING from all
  other sources? That just sounds like a bug."). J-LevelMaster used to override `maxTp` outright for a class
  with `<mtpGrowthCurve>`, dropping every `<maxTp>` tag and natural buff; it now supplies the curve as
  `getBaseMaxTp`, in place of J-Base's configured base, and everything stacks on top.
- **Max Tech gets a multiplier from its curve** (Jeremy, 2026-09-25: "yes you should update it so that max
  tech gets its multiplier, too"). Once every CA class carried `<mtpGrowthCurve>`, Max Tech had nothing the
  scene could measure: no params row, and no BuffPlus left. Core now reads the curve at level 99 through
  J-LevelMaster's `GrowthCurveFormula.baseMaxTpForClass`, the same method J-LevelMaster's own
  `getBaseMaxTp` reads, so the measure and the actor's real base can never disagree. It sits behind one
  `J.LEVEL` check in a method body (the pattern `Window_TargetFrame` and `JABS_Engine` already use), not in a
  fourth ship: J-LevelMaster is an optional sibling rather than something J-Classes extends, and
  `verify:declared-dependencies` waives a method-body probe. A class without the tag measures 0, not J-Base's
  flat configured base, which keeps J-Classes-Natural's BuffPlus fallback working for Max Tech.
- **Not the full catalog** (2026-09-25, after seeing it in game: a class moves about fifteen stats, and the
  other thirty-odd rows were permanently grey). The first cut then listed only what each class touched,
  which made the rows jump between classes; the fixed fifteen above replaced it.
- **The multiplier compares against the actor's starting class** (their database `classId`): the
  highlighted class's level-99 value over the starting class's. CA's curves are
  `(base + step * (a.level - 1)) * MULT` with the starting classes at ×1, so this returns exactly the
  authored MULT (checked 2026-09-24 for seven classes across all eight parameters) without parsing any
  formula text. Core measures a curve: the engine's eight in the class's params table, and Max Tech's
  `<mtpGrowthCurve>` under J-LevelMaster. Everything else in CA grows by flat GrowthPlus / BuffPlus amounts,
  which J-Classes-Natural measures. A multiplier reading ×1.00 is the class leaving the parameter alone, so it
  is never drawn.
- **The sheet reads raw stats** (2026-09-25): everything but equipment. Both sides of a comparison are
  throwaway copies of the actor with every slot emptied (the equip scene's preview trick, gear taken off
  directly rather than unequipped, so nothing trades with the party or runs a refresh), and the class
  already worn shows its raw values too. The class's curve and buffs, the actor's growth and their passives
  all count. Gear does not, which also settles what a class that cannot wear the current weapon would
  show: changing into it takes that weapon off anyway.
- **Each class has its own icon** (2026-09-25): `RPG_Class.iconIndex`, chosen on the JMZ data editor's
  Classes board (RPG Maker has no such field). A class without one, and every "???" row, uses the
  `class-icon` parameter.
- **Mastery shows in the list** (2026-09-25): a row reads learned/total (`4/9`) while there is anything left
  to learn, and `MASTERED`, in the green the ladder marks DONE in, once there is not. A "???" row shows
  neither.

## Work

### J-Classes (`class/core`, `J.CLASS`)

- Per-actor unlocked class ids, persisted under `_j._class` and routed to `systems/class.json` behind the
  `J.BASE.EXT.SAVE` check. Unlock only; there is no lock.
- `J.CLASS.RegExp.UnlockableForActors` and the unlocking questions on `ClassManager` (`unlockableActorIds`,
  `isRestrictedClass`, `canUnlockClass`, `isTeasedClass`, `isClassRevealed`), the guard in `unlockClass`,
  and the "???" row: `listedClassName` / `listedClassIconIndex`, dimmed by `Window_ClassList`, with the
  scene hiding its detail windows while one is highlighted.
- A glossary entry in `docs/notetag-reference.md` and an `Actors` id target in
  `src/build-tools/notetag-id-targets.js`, so CA's validator resolves the tag's ids.
- Plugin commands: `call-scene` (allow switching) and `unlock-classes` (an actor and a list of classes).
- A "Class" command in the actor column of the main menu, behind a `menu-switch` parameter, wired the
  way J-Aptitude's is.
- `Scene_Classes` on `Scene_ActorFacetBase`: the class list in the command column, the description
  (`Window_ClassDescription`) across the top beside it, and the parameters window beneath that.
  Extensions list sections beneath the parameters by aliasing `Window_ClassParameters#drawAfterParameters`,
  and place windows beside them by aliasing `Scene_Classes#sideWindowDefinitions` (the parameters then
  keep the left half). No help window.
- Confirm calls `actor.changeClass(id, true)`. J-Base, J-LevelMaster and J-Passive already react to a
  class change, so nothing is refreshed by hand.
- The parameters window draws its own four-column rows from a raw baseline copy, compared against a raw
  preview copy. It reads J-CMS's catalog for the order and `CmsParameter` for the padded standing values,
  which makes J-Classes depend on J-CMS; J-CMS itself is unchanged.
- Every decision (which classes are listed, whether confirm is live, the multiplier, building the
  preview) lives in a tested static class, not in a window.

### J-Classes-Aptitude (`class/ext/apt`, `J.CLASS.EXT.APT`)

- A window beside the parameters: J-Aptitude's own source-details window pointed at the highlighted class,
  so the ladder, DONE / KNOWN, the gauges and the typed-AP badge all come along. Above the ladder, with
  J-SkillSlots installed, "Always known": the class's `<unslottedSkills>`, which in CA are the weapon and
  armor types the class equips for free.
- A learned/total count on each class row, `MASTERED` in green once complete (a `classRightColorIndex`
  seam on J-Classes' list), and nothing on a "???" row.
- "Always known" is titled under the class's own icon.
- `Game_Actor.prototype.isClassMastered(classId)`: every teachable on the class learned, for trainer
  events to ask by script. A class that teaches nothing is not mastered.

### J-Classes-Natural (`class/ext/natural`, `J.CLASS.EXT.NATURAL`)

- One section beneath the parameters for the highlighted class: its growth per level (`GrowthPlus` /
  `GrowthRate`), evaluated for the actor from that class's note alone. Its buffs have no section: they show
  in the listed parameters' values, and their multipliers come from its `BuffPlus`.

### Tests

- Direct-import tests for every non-view file, at 100%.
- View-harness wiring tests for the scene and its windows, and the `scenes/**` / `windows/**` coverage
  exclusion lifted for the `class` family, since it is new and can start at 100%.

### Chef Adventure

- `js/plugins.js`: the three ships, after J-Aptitude-Typed, by path (`j/class/J-Classes` and so on).
- Switch 107 becomes "show class command" and J-Classes' `menu-switch`. It was J-Aptitude's, whose menu
  command no longer exists, so J-Aptitude's entry in `plugins.js` drops its `menu-switch` too.
- Map358 event #3 page 2: unlock the trunks (Jerald 2 / 5 / 9, Rupert 14 / 18 / 21) beside the 107 / 108 /
  109 flips it already made. CE46 keeps its dialogue and its Change Class commands.
- Map358 event #4 (mirror): `unlock-classes` for the trunks again (a no-op on any new game; it repairs
  saves made before this existed, which already have 107 on), then `call-scene` with switching allowed,
  in place of CE46.
- `docs/classes/main.md`: line 20 still says switching is "free or low-cost via menu"; line 263 says the
  remaining trunks unlock through trainers. Both are superseded above.
- `data/Classes.json` (2026-09-25): the base classes' new "every class" tags (`mtpGrowthCurve`, and the
  hit/eva/mev/grd/cri/cev BuffPlus family) carried onto 2-12 from Some Guy and 14-24 from Know-it-all. The
  first pass also kept each class's old Accuracy and Parry multiple, which Jeremy did not want: a clone is
  verbatim, a clean slate for him to tune. Jerald's he retuned by hand; Rupert's 13 carried lines went back
  to Know-it-all's own at 19:51. `bun run validate` green.
- `data/Classes.json`: every class but the two starting classes carries `<unlockableForActors:[1]>` (2-12)
  or `[2]` (14-24), appended as the last line of its note. All 24 were tagged 2026-09-25, and 1 and 13 had
  theirs removed again the same day; a data-editor save at 12:57 put those two back, and by 16:53 they were
  gone again, so the starting classes carry no tag.
- `data/Classes.json` (2026-09-25, Jeremy tuning): Max Tech multipliers now differ per class (Transcendant
  and Omniscient ×2.00, Try-Hard ×1.40, most forks ×1.05-1.25), so the Max Tech × shows on most rows.
- `data/Classes.json` (2026-09-25, 18:53): Know-it-all gained `criBuffPlus` / `cevBuffPlus` after the first
  propagation, so both were cloned onto 14-24 as written (×1.00), straight after each class's `evaBuffPlus`;
  `bun run validate` green.

### JMZ data editor

- The Classes board's Identity card gains a multiline Description beneath the name, and an icon picker
  beside it.
- `RPG_ClassDomainModel` reads `description` and `iconIndex` (empty and 0 for a class RPG Maker saved) and
  always writes both.
- The Go `RpgClass` declares `Description` and `IconIndex`: the loader and the save request both decode
  strictly, so an undeclared field would fail the save outright.
- The Parameter Growth card gains "Clone growth from" (Jeremy, 2026-09-25: "so I can use a 'base' instead
  of having to re-copy all the values"): pick a class, press Clone, and every growth-curve formula and the
  baked levels 1-99 are copied over; nothing else in the note is touched (`ClassGrowthCloner`, tested).
  The chosen class stays chosen across classes, so one base can be stamped onto several.
- ...and "Apply all" beneath its rows (Jeremy, same day: "so I can change the text of them all, and then
  sweep with one click"): every row edited since it was last applied goes in as one change, and rows not
  edited are left alone (`ClassGrowthApplier`, tested). The typed formulas now live in `ClassParamRows`
  rather than each row, which is what lets one click gather them.
- The same card's rows no longer keep one class's formulas after switching to another, and Apply no
  longer drops the formula it writes (two edits in one click, built from one stale render; `patchAt`).
- An "Unlockable By" card on the Base tab picks the actors a class is set aside for
  (`UnlockableForActorsParser`, `UnlockableForActorsEditor`). Its caption describes what an author sees
  rather than who is permitted (Jeremy caught "leave it empty to let anyone unlock it" reading as the
  opposite of what empty does): left empty, a class hints at itself to no one, and shows only while
  worn or once an event unlocks it.
- Its three standing lint errors (two `prefer-destructuring`, and the complexity of
  `apiPathnameForBasename`, now a lookup table) were fixed along the way.

## Definition of done

- [ ] `bun run hotfix` green and coverage 100%, with `class/**` views measured
- [ ] `ls src/plugins/class/core src/plugins/class/ext/apt src/plugins/class/ext/natural` lists three ships,
      and `git diff main -- src/plugins/apt/core/scenes/Scene_Aptitude.js` is empty
- [ ] in-game, the Bathroom (Map358) mirror opens the scene with "change class" in the legend; picking a
      class changes it and keeps the level
- [ ] in-game, main menu → Class opens the same scene with no "change class" in the legend, and confirm
      buzzes
- [ ] in-game, one screen shows the parameters with the growth section beneath them, and the learnings
      beside them with Fucking Oni's five "Always known" equip skills on top; nothing pages
- [ ] Jerald looking at Fucking Oni reads Power ×1.15 and Force ×0.90, and lists nothing Oni leaves alone
- [ ] every class lists the same fifteen rows in the same place, flipping between classes; every value is
      padded, every row shows its multiplier (×1.00 included), and a stat the highlighted class would leave
      alone shows its standing value in white with nothing beside it
- [ ] Crit Rate, Crit Dodge, Phys Evade and Magic Evade read as flat numbers, here and on the equip screen
- [ ] a class whose `<mtpGrowthCurve>` is Some Guy's times 1.20 reads Max Tech ×1.20, among the resources and
      ahead of every stat
- [ ] a description typed on the data editor's Classes board, then saved, shows across the top of the class
      scene
- [ ] `unlock-classes` Jerald [3] from a test event: Raving Lunatic turns from "???" into its name for
      Jerald, never appears for Rupert, and is still there after a save and reload (`systems/class.json`
      in the slot)
- [ ] `unlock-classes` Rupert [3] is refused, with a warning in the console
- [ ] highlighting a "???" row hides everything beside the list, and confirming it buzzes
- [ ] a class with everything learned reads MASTERED in green
- [ ] an icon picked on the data editor's Classes board, then saved, shows on the class's row
- [ ] the sheet's values ignore gear: a comparison reads the same with and without a weapon equipped
- [ ] the first-time reflection still plays CE46's dialogue
- [ ] `bun run validate` green in CA

## Notes

- The trainer quests themselves are eventing and not part of this item. Still open there: one quest per
  trunk or one per fork (Jeremy leans per fork, since it gives more room for story). Either way it is the
  same `unlock-classes` command.
- The style picker that shared this item's first draft is `unstarted/ca-style-picker.md`.
- Passive states a class grants through `<passive>` are not re-derived on the preview copy, because
  refreshing passives runs J-Passive-Conditional's and J-Motion-Passive's hooks. No CA class carries one.
- Element and state rates a class grants are not listed: the page lists registry parameters only, and
  the catalog's affiliation rows describe the actor as they are. No CA class carries an element or state
  trait (their traits are skill types, an armor type and skills), so nothing is missing today.
- **PR time:**
  - J-CMS and J-CMS-Equip are untouched: J-Classes only reads J-CMS's catalog order and `CmsParameter`.
  - J-Aptitude loses its menu command and its `menu-switch` parameter (the scene is console-only,
    `Scene_Aptitude.callScene()`), a removal to weigh when choosing its bump. It also gains three layout
    seams on `Window_AptitudeSourceDetails`, `contentLeft`, `teachableStatusRight` and `teachableGaugeX`,
    with its own spacing as their defaults. Raise J-Classes-Aptitude's required J-Aptitude version to it.
  - J-Classes-Aptitude overrides those seams, and `gaugeWidth`, to fit the ladder inside the class scene's
    shared inset at about half the width J-Aptitude spaced it for. It reads J-SkillSlots' tag behind a
    `J.SKS` check, declared `@orderAfter J-SkillSlots`.
  - J-Base takes a minor: `RPG_Class` keeps the description and the icon the data editor writes (it used
    to leave both undefined, since RPG Maker writes neither on a class). Raise J-Classes' required J-Base
    version to it. It also carries a patch-sized fix:
    `Game_Item` gained its own `underlyingObject()` default, because J-Base's equip-change check called a
    method only J-Extend defined, so J-Base without J-Extend could not set up an actor at all.
  - The JMZ data editor takes the class description and icon (board, model, Go model), the Unlockable By
    card, and its lint fixes.
  - The build-tools change (`notetag-id-targets.js`) and the glossary entry ride in the same PR as the tag.
  - CA commits `data/Classes.json` with its 24 tagged notes.
- Verified headless 2026-09-24 (muted, 1920x1080): the mirror path lists Jerald's trunks with their
  learned/total counts, all three pages render, and the menu's Class command opens the same scene with
  "change class" gone from the legend.
- Verified headless 2026-09-25: Jerald's list shows his own untaken classes as dimmed "???" rows and none of
  Rupert's (and the reverse), Medick reads MASTERED in green once its teachables are learned, a "???" row
  hides all three detail windows, `unlockClass` refuses Jerald Rupert's class 14 with a warning, and
  Rupert's raw stats drop his starting gear (Magi 495 to 220, M.Attack 47 to 12) while he keeps wearing it.
- Resolved: a tagged starting class the actor has left read "???" in their list, because being worn never
  records an unlock. Jeremy's call: the starting classes carry no tag, so they drop out instead.
- Verified headless 2026-09-25, second pass: with every Jerald class unlocked, Malpractician's ladder ends
  at 752 of 832 and Orbiter's at 784 (row 32, type 22 in CA), and Fucking Oni's Equip Glaive reads 0/2500
  while Jerald wears Some Guy, which lends it.
- Resolved 2026-09-25: **the forks were meant to lend their `<unslottedSkills>` too** (Jeremy: "while you have
  this class applied, you can wield X equips", and mastering the skill keeps it). The tag only exempts a skill
  from needing a slot, so a class lends each one through an Add Skill trait; the starters and trunks did,
  but no fork had one, and Medick and Debilitator were each one short. 48 traits added to `data/Classes.json`
  (16 classes; Add Skill traits at the end of each list in skill id order, as the trunks have them). Verified
  in game: Contemptuous wields a Boomstick, Malpractician a Warstaff, RNGesus a Handgun, Medick a Mace and
  Debilitator an Arm, each skill lent rather than learned.
- **PR time, playtest fixes (2026-09-26), outside the class ships but in the same tree:**
  - J-Weather: its own audio channel now stops wherever the engine stops the map's background sound- a game
    over (`Scene_Gameover#playGameoverMusic`), the title (`Scene_Title#playTitleMusic`) and a battle starting
    (`Scene_Map#stopAudioOnBattleStart`). A game over used to carry the wind onto the title screen.
  - J-ABS: an AI windup now fires where it aimed as the windup began (`JABS_AiManager.executeAiPhase2Action`,
    `takeAim`). It used to turn to face the target again the moment the cast finished, so stepping out of the
    telegraph never dodged anything; an action with no cast time still aims as it fires.
  - J-HUD-TargetFrame: a long name shrinks to fit what the icons and level leave of its row, from 24 down to
    16 (`TargetNameLayout`), staying centered on the row. Since #123 moved the icons and level ahead of the name,
    "*Deposit (Iron) of Purity" ran off the frame's edge.
- **PR time, sixth pass:** J-Base registers cri/cev/eva/mev as `SCALED_POINTS` (display only: no `%`; values
  and tags unchanged), a visible change on every screen showing them. J-Classes loses `isParameterModified`;
  `multiplierText` shows ×1.00; `parameterChange` returns `colorIndex` in place of `benefit`, with padded
  `valueText`; `changeColorIndex`, `POWER_UP_COLOR_INDEX` and `POWER_DOWN_COLOR_INDEX` are new. The JMZ data
  editor's natural growth panel gains the 13 parameters plugins bind (`knownPluginParams`, long ids 34-46: har,
  lst, mst, tst, sar, ser, hcr, msb, gdr, dor, apr, sdr, prof) in four new cards (Steal, Shield, Movement,
  Gains) plus Recovery and Damage/Defense; the cards moved to `naturalGrowthCategories.ts`, and the SDP board
  reads those 13 names from the mapper.
- **PR time, fifth pass:** J-Classes' `LEADING_PARAMETER_KEYS` became `LISTED_PARAMETER_KEYS` (the fixed
  fifteen), `catalogParameterKeys`, `changedParameterKeys`, `modifiedParameterKeys` and `shownParameterKeys`
  are gone, and `isParameterChanging` is new; `Window_ClassParameters#shownParameterKeys` is gone too.
  J-Classes-Natural's `ClassGrowthManager.readClass(actor, classId, shownKeys)` became `readGrowths(actor,
  classId)`, and "While in this class" no longer draws. Both are unreleased, so none of it is a break.
- **PR time, fourth pass:** J-LevelMaster gains `GrowthCurveFormula.baseMaxTpForClass` (the curve at a level,
  rounded and floored at zero, or null for a class without one), and `getBaseMaxTp` now reads through it;
  J-Classes' Max Tech measure needs the J-LevelMaster version that has it. J-Classes reaches it behind a
  `J.LEVEL` check, so J-Classes still runs without J-LevelMaster and declares nothing new.
- **PR time, third pass:** J-LevelMaster takes a patch-or-minor for the MTP curve fix (behavior change: a
  class with `<mtpGrowthCurve>` now stacks gear, state and natural TP on top), with its help text and the
  glossary entry updated. J-Classes' multiplier methods now take a parameter key rather than a param id,
  and `referenceValue` is an extension seam; J-Classes-Natural requires the J-Classes version that has it.
- **PR time, second pass:** J-Aptitude gains `ApManager.isSkillKnownForGood`, and both of its detail
  windows mark KNOWN through it. J-Classes' `ClassSceneLayout` gains `ROW_HEIGHT` and
  `ROW_FONT_REDUCTION`, which the parameters window now reads; J-Classes-Aptitude's learnings window
  overrides `lineHeight` and `resetFontSize` with them.
