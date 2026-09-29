# Chef Adventure: the style picker

## Source

- `src/plugins/__ca-mods/`: J-CA-Mods, the Chef Adventure-only ship, or a new CA ship.
- `src/plugins/__ca-mods/core/objects/Game_Actor.js`: already pushes a second equip type `5` onto `equipSlots()`.
- `src/plugins/apt/core/windows/Window_AptitudeSourceDetails.js`: draws one source's teachables with
  progress gauges; `apt/ext/typed/windows/` extends it for typed AP.
- `src/plugins/_base/core/scenes/Scene_ActorFacetBase.js`: the per-actor scene base.

## Context

Styles ("Chefology": an ingredient gathering style) are the family-prep pieces from the playbook spec,
reshaped as FF6 magicite: armor-database rows like the Seals, but in a slot of their own. One per actor,
and swappable anywhere the menu opens. No mirror needed.

This shared an item with the class scene until 2026-09-24, when the two were split: a class is an
identity you declare at a mirror, a style is a technique you just use, and they have nothing mechanical
in common. The class scene became its own plugin (`inprogress/classes-plugin.md`).

## Work

- Add a new equip type to `System.json` (name TBD) and push it onto `equipSlots()` in J-CA-Mods, the same way
  the second accessory slot works.
- Style rows go in `Armors.json` on that equip type, with an armor type every class can equip (Universal,
  `atypeId 1`). The Seals' `atypeId 8` isn't equippable by anyone.
- Nothing else in the engine changes. Equips are already an aptitude source, `<aptitudeTyped>` applies to
  Armor, `<slayer>` reads `getAllNotes()` (which includes equips), and element-rate traits on an armor apply.
  Progress only accrues while a style is equipped, but any row's `aptitudeTeachings` and its progress (by
  `ApManager.deriveKey`) can be read whether it's equipped or not. That's what lets the picker show owned styles.
- A light, magicite-style scene: per actor, the styles the party owns, with one equipped. The detail pane
  shows what the style teaches (the typed-AP ladder, J-Aptitude's source-details window) and what it does.
- The vanilla equip scene walks `equipSlots()`, so the new slot shows up in Equipment by default. Decide
  whether to filter it out there so styles are only chosen here.
- Content is out of scope. Which styles exist and what they grant belongs to the playbook spec. One or two
  placeholder rows are enough to build and verify against.
- The decisions (which styles this actor may equip) go in a tested service, not a window. Wiring is what
  the view harness is for; read `docs/testing-scenes-and-windows.md` first.
- Declare the J-Base and J-Aptitude dependencies (`verify:declared-dependencies`).

## Definition of done

- [ ] `bun run hotfix` green, coverage still 100%
- [ ] `System.json` has the new equip type, and J-CA-Mods pushes it
- [ ] in-game, away from town: equip a placeholder style on Jerald and a different one on Rupert from the
      menu; each shows its teachables and typed progress
- [ ] kill an enemy of that style's family and its typed progress moves (CA has `implicitEnemyElementPercent`
      at 100)

## Notes

- Design history: `.tmp/chef-family-playbook-spec.md` (gitignored). See §8 for affinities and slayer, §10
  for Chefology.
- Chefology is also a new skill type for what styles teach. Adding it rides with the first real style
  content, not this item.
