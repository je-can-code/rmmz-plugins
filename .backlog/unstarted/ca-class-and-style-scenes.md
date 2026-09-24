# Chef Adventure: class-change and style-picker scenes

## Source

- `src/plugins/__ca-mods/`: J-CA-Mods, the Chef Adventure-only ship. Both scenes live here (or in a new
  CA ship), **not** in `apt/`.
- `src/plugins/apt/core/scenes/Scene_Aptitude.js`: stays untouched and generic; in CA it becomes a debug view.
- `src/plugins/_base/core/scenes/Scene_ActorFacetBase.js`: the per-actor scene base `Scene_Aptitude` sits on.
- `src/plugins/apt/core/windows/Window_AptitudeSourceDetails.js`: draws one source's teachables with
  progress gauges; `apt/ext/typed/windows/` extends it for typed AP.
- `src/plugins/apt/core/scenes/Scene_Menu.js` + `windows/Window_MenuCommand.js`: the menu command pattern.
- `src/plugins/jafting/core/_metadata/pluginCommands.js`: the "plugin command opens a scene" pattern.
- `src/plugins/__ca-mods/core/objects/Game_Actor.js`: already pushes a second equip type `5` onto `equipSlots()`.
- CA: `CommonEvents.json` #46 "Self-reflection"; `Map358` "Bathroom" events #3 "first time reflection" and
  #4 "mirror"; switch 174 "first time reflection".

## Context

`Scene_Aptitude` is a catch-all over every aptitude source, and in CA that only ever means classes: all 282
`<aptitude>` teachables live on `Classes.json`. Jeremy's call (2026-09-23): leave it generic as a debug view
and give Chef Adventure two scenes of its own.

**Classes** are whims Jerald and Rupert talk themselves into in front of a mirror (that is what
"Self-reflection" is), so switching is mirror-only. CE46 is an event on purpose, for the *first*
reflection's dialogue. The mirror replaying it every time after that is a placeholder.

**Styles** ("Chefology": an ingredient gathering style) are the family-prep pieces from the playbook spec,
reshaped as FF6 magicite: armor-database rows like the Seals, but in a slot of their own. One per actor,
and swappable anywhere the menu opens. No mirror needed.

## Work

### A. Class scene

- **One scene, two entry points, and the entry point is the gate.** The mirror's plugin command opens it
  with changing enabled; the main-menu command opens it read-only with the confirm greyed out. There is no
  location or "in town" check anywhere. Do not build a second read-only scene.
- Per actor: the classes they may switch to, and for the highlighted one what it teaches and how far along
  they are. Learnings are always visible (CA does not do FF5's hidden abilities). **All three trunks are
  always available** once the class system is unlocked (Jerald 2 / 5 / 9, Rupert 14 / 18 / 21, the same six
  the mirror offers today). **Forks appear once unlocked** (see the next bullet).
- **Fork unlocks: the one piece of state this needs.** Rule (2026-09-23): master a trunk (every teachable on
  it learned) and a trainer quest unlocks its forks, e.g. Fucking Oni → Raving Lunatic and Painbringer. The
  quests are pure eventing. The plugin side is:
  - A persisted per-actor set of unlocked fork class ids (J-CA-Mods holds no `_j` state yet, so read
    `docs/save-system.md` first).
  - An `unlock-fork` plugin command the quest calls.
  - A mastery check the trainer event can ask. That's just a fold over `aptitudeTeachings` and
    `hasAptitudeSkill`, so it needs no new model.

  A switch per fork would also work, but the scene would still need a switch-to-class table.
- **Mapping gap.** Nothing in `Classes.json` says which actor a class belongs to or which trunk a fork hangs
  off. Jerald starts as class 1 "Some Guy" and Rupert as 13 "Know-it-all", and only CE46's hardcoded choices
  know the trunks. The likely shape is a small tag or two on the class rows (owner, parent trunk), so the tree
  lives in data rather than code. Any new tag gets its glossary entry in the same PR.
- The read API already exists. `$dataClasses[id].aptitudeTeachings` gives the teachables,
  `ApManager.deriveKey(row)` gives the key (it works for inactive classes too),
  `actor.getAptitudeProgress(key)` gives progress and `actor.hasAptitudeSkill(skillId)` says what's learned.
  The detail pane is `Window_AptitudeSourceDetails` pointed at a class row.
- Confirm calls `actor.changeClass(id, true)` (keepExp, as CE46 does). J-Base and J-LevelMaster already hook
  `changeClass` (the level is shared and learnings are backfilled), so nothing needs refreshing by hand.
- CA data: `#3 "first time reflection"` keeps calling CE46. `#4 "mirror"` calls the new plugin command.
- Add a "Class" menu command. "Aptitude" is already gated by switch 107 "show aptitude command" (J-Aptitude's
  `menu-switch` param), so whether the debug view stays visible is just that switch. Decide.

### B. Style picker

- Add a new equip type to `System.json` (name TBD) and push it onto `equipSlots()` in J-CA-Mods, the same way
  the second accessory slot works.
- Style rows go in `Armors.json` on that equip type, with an armor type every class can equip (Universal,
  `atypeId 1`). The Seals' `atypeId 8` isn't equippable by anyone.
- Nothing else in the engine changes. Equips are already an aptitude source, `<aptitudeTyped>` applies to
  Armor, `<slayer>` reads `getAllNotes()` (which includes equips), and element-rate traits on an armor apply.
  Progress only accrues while a style is equipped, but any row's `aptitudeTeachings` and its progress (by
  `deriveKey`) can be read whether it's equipped or not. That's what lets the picker show owned styles.
- A light, magicite-style scene: per actor, the styles the party owns, with one equipped. The detail pane
  shows what the style teaches (the typed-AP ladder, same window as above) and what it does.
- The vanilla equip scene walks `equipSlots()`, so the new slot shows up in Equipment by default. Decide
  whether to filter it out there so styles are only chosen here.
- Content is out of scope. Which styles exist and what they grant belongs to the playbook spec. One or two
  placeholder rows are enough to build and verify against.

### Both

- Scenes and windows are excluded from coverage, so the decisions go in a tested service: which classes this
  actor may pick, whether confirm is live, which styles this actor may equip. Wiring is what the view harness
  is for; read `docs/testing-scenes-and-windows.md` first.
- Declare the J-Base and J-Aptitude dependencies (`verify:declared-dependencies`).

## Definition of done

**A: class scene**

- [ ] `bun run hotfix` green, coverage still 100%
- [ ] a class scene exists under `src/plugins/__ca-mods/`, and `Scene_Aptitude.js` is unchanged
- [ ] in-game, the Bathroom (Map358) mirror opens the scene with confirm live; picking a class changes it and
      keeps the level
- [ ] in-game, main menu → Class shows the same list and ladders with confirm greyed out
- [ ] the first-time reflection still plays CE46's dialogue
- [ ] run `unlock-fork` for Raving Lunatic from a test event: it appears in Jerald's list, not Rupert's, and
      it's still there after a save and reload

**B: style picker**

- [ ] `System.json` has the new equip type, and J-CA-Mods pushes it
- [ ] in-game, away from town: equip a placeholder style on Jerald and a different one on Rupert from the
      menu; each shows its teachables and typed progress
- [ ] kill an enemy of that style's family and its typed progress moves (CA has `implicitEnemyElementPercent`
      at 100)

## Notes

- Design history: `.tmp/chef-family-playbook-spec.md` (gitignored). See §8 for affinities and slayer, §10
  for Chefology.
- `docs/classes/main.md:20` still says switching is "free or low-cost via menu". The mirror rule replaces
  that line. Line 263 says the remaining trunks unlock through trainers; as of 2026-09-23 all three trunks
  come together and only forks go through trainers.
- Chefology is also a new skill type for what styles teach. Adding it rides with the first real style
  content, not this item.
- The trainer quests themselves are eventing and not part of this item. Still open there: one quest per
  trunk or one per fork (Jeremy leans per fork, since it gives more room for story). Either way it's the same
  `unlock-fork` command, and a per-trunk quest just calls it twice.
