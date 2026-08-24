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

## Notes

- Complements `../completed/sdp-plugin-revisit.md` (menu/scene fat).
- Planned **salvage** and **socketing** extensions (`jafting-ext-salvage.md`, `jafting-ext-socketing.md`) are separate features; do not block those UI surfaces on this refactor.
