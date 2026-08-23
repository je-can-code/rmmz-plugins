# SDP (J-SDP) plugin revisit

## Severity

**Medium.** Risk is maintainability and inconsistent patterns vs newer plugins, not an immediate gameplay outage.

## Gain

**High for consistency, medium effort.** Aligns SDP with JAFTING-style session/window splits, modern J-Base helpers, and test harness patterns. Unlocks easier edits to panel math and scene flow.

## Context

J-SDP (Stat Distribution Panel) predates recent monorepo hygiene work on external JSON loading, `parsePluginInt`, and test harness patterns. A dedicated pass should align it with current J-Base conventions and review architecture similarly to the JAFTING workflow/session refactors.

### Merged findings (cross-plugin)

- **External JSON load** is duplicated across many plugins; SDP’s `initializePanels` in `src/plugins/sdp/_metadata/_pluginMetadata.js` should migrate to the shared helper proposed in `j-base-external-json-config-loader.md` (same pattern as Difficulty, Proficiency, Omni quest, JAFTING Creation).
- **Engine hooks:** `src/plugins/sdp/managers/JABS_Engine.js` patches `JABS_Engine`; see inventory in `cross-plugin-prototype-hook-surface.md`.
- **Game_Action:** `src/plugins/sdp/objects/Game_Action.js` participates in the multi-plugin `Game_Action` stack — same inventory doc.

## Scope ideas (non-binding)

- Audit metadata initialization, `PluginManager` parameter parsing, and `StorageManager.fsReadFile` + `JSON.parse` error surfacing for `data/config.sdp.json` (delegate file I/O to J-Base helper once it exists).
- Consider clearer separation between panel **data** (`__models`, classify) and **scene/window orchestration** (`Scene_SDP.js`, `Window_SdpList.js`, etc.).
- Expand or refresh Vitest coverage (`test/plugins/sdp/` — metadata, panel math, `RPGManager` note helpers as needed).
- Documentation / plugin help accuracy vs. shipped behavior.

## Work

Track as a milestone PR or series: (1) load/helper alignment, (2) scene/window decomposition if still “fat,” (3) tests + help text.

## Summary

This revisit is **closed for the modernization track**: SDP scene flow, cart/checkout UX, metadata params, modal dimmer integration via J-Base (`Window_Dimmer`), and expanded Vitest coverage landed together. Centralized external JSON loading remains the separate **j-base-external-json-config-loader** backlog item.

## What shipped

- **Scene / windows:** Header, cart, controls hint, confirmation copy and layout; list preview ranks; rank-data window retired in favor of the new layout.
- **J-Base:** `Scene_Base` modal dimmer as `Window_Dimmer` before anchor windows; lazy init after `$gameSystem`.
- **Metadata / tests:** New plugin parameters (unit labels, points display name); `TextManager.sdpPoints`; SDP tests and fixtures updated.

## Notes

- Primary PR: `je-can-code/rmmz-plugins#45`; Chef Adventure mirror: `je-can-code/ca#38`.
- See also `jafting-heavy-scenes-decomposition.md` for the same “large scene” treatment pattern on JAFTING (still open).
- JSON file I/O DRY: follow `../unstarted/j-base-external-json-config-loader.md` when that helper exists.
