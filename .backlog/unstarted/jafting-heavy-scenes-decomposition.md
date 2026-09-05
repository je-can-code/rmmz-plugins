# JAFTING: decompose oversized scenes (Create / Refine / core hub)

## Severity

**Low** for players; **medium** for contributors. Large scene classes exceed the cyclomatic complexity target in `.junie/guidelines.md` and make bugfixes risky.

## Gain

**Medium effort, medium-high maintainability gain.** Easier testing of session objects, clearer separation between “layout math,” “input handling,” and “workflow state.” Reduces duplicate patterns between Create and Refine flows.

## Source

- `src/plugins/jafting/ext/create/scenes/Scene_JaftingCreate.js` — ~900+ lines
- `src/plugins/jafting/ext/refine/scenes/Scene_JaftingRefine.js` — ~900+ lines
- `src/plugins/jafting/core/scenes/Scene_Jafting.js` — hub scene; compare with extension partials in `ext/create/scenes/Scene_Jafting.js` and refine equivalents

## Context

JAFTING already moved workflow state into models (`CraftingCreationSession`, `RefinementWorkflowSession`, `JaftingManager`). Scenes still contain substantial orchestration and UI wiring. SDP `Scene_SDP.js` and related windows were called out in `../completed/sdp-plugin-revisit.md` as a parallel hygiene target.

## Work

1. For each scene, list “regions” that could be private methods or helper objects (`Scene_JaftingCreateLayout`, `...Input`, `...Network` — names illustrative).
2. Extract non-serializable helpers as `class` collaborators (guidelines: not serialized → modern class).
3. Align window refresh patterns between Create and Refine where they duplicate (list selection, detail pane updates).
4. Keep `//region` per file rule: new files = new region names matching filenames.

## Definition of done

- [ ] `Scene_JaftingCreate.js` (1628 lines at time of writing), `Scene_JaftingRefine.js` (1035) and
      `Scene_JaftingStudy.js` (902) are each under 500 lines, with what moved living in named
      collaborator files
- [ ] no `disable-next-line complexity` comment was added to any of them to get there
- [ ] the extracted collaborators have tests. The stated gain is "easier testing of session
      objects" — moving lines into a second file that is equally untestable relocates the problem
      rather than solving it
- [ ] `bun run hotfix` green and coverage still 100%
- [ ] in-game: craft an item end to end, then refine one piece into another, cancelling out of each
      window at least once along the way. Both flows behave identically to before, including where
      the cursor lands after a cancel

## Notes

- Complements `../completed/sdp-plugin-revisit.md` (menu/scene fat).
- Planned **salvage** and **socketing** extensions (`jafting-ext-salvage.md`, `jafting-ext-socketing.md`) are separate features; do not block those UI surfaces on this refactor.
