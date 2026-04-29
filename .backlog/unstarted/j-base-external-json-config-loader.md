---
status: open
area: code-quality
---

# Centralize external JSON config load + parse in J-Base

## Severity

**Medium.** Wrong or duplicated error handling can leave projects with inconsistent failure modes (some plugins throw parse errors with paths, others only console.error). Missing files behave similarly but copy-pasted messages drift over time.

## Gain

**High for effort (moderate implementation, high DRY payoff).** One helper (e.g. `J.BASE.Helpers.loadProjectJsonConfig(path, options)`) can standardize: `StorageManager.fsReadFile`, empty-file checks, `JSON.parse` in try/catch with path in the error, optional `J.BASE.Metadata.ShowExternalFileLoadInfo` logging, and a hook for “classify” delegates. New plugins and revisits (SDP, Difficulty, Proficiency, Omni quest, JAFTING Creation) stop re-implementing the same ~35 lines.

## Source (pattern duplicated today)

- `src/plugins/sdp/_metadata/_pluginMetadata.js` — `initializePanels`, `CONFIG_PATH`, `classifyPanels` on `parsedPanels.sdps`
- `src/plugins/diff/_metadata/_pluginMetadata.js` — `initializeDifficulties`, `classifyDifficulties`
- `src/plugins/prof/_metadata/_pluginMetadata.js` — `initializeProficiencies`, `classifyConditionals`
- `src/plugins/omni/ext/quest/_metadata/_pluginMetadata.js` — quest config path + load
- `src/plugins/jafting/ext/create/_metadata/_pluginMetadata.js` — crafting JSON load

## Context

Each plugin repeats the same structure: read file → null/empty guard with duplicate console errors → parse → null guard → call a static `classify*` method → assign to metadata fields. SDP already has slightly richer validation (panel name filters). The helper should accept optional predicates or post-parse validators so SDP-specific rules stay in SDP.

## Work

1. Add a small J-Base API (name TBD) that returns parsed JSON or throws a single consistent `Error` type/message shape.
2. Migrate one plugin as reference (Difficulty or Proficiency are smallest), then batch the rest.
3. Align log lines where `J.BASE.Metadata.ShowExternalFileLoadInfo` is used (Difficulty already does; others may not).
4. Cross-link `../completed/sdp-plugin-revisit.md` when SDP JSON load is migrated (scene modernization already landed in rmmz-plugins#45).

## Notes

- Merges with the “external JSON / parsePluginInt / error surfacing” bullets in `../completed/sdp-plugin-revisit.md` — remaining work is mostly “SDP-specific data vs UI” once loading is centralized.
