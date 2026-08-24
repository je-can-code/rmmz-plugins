# Centralize external JSON config load + parse in J-Base

## Original severity / gain

**Medium** problem (duplicated failure modes across plugins). **High** payoff: one standardized read → parse → validate → optional map path.

## Source (historical — pattern was duplicated here before migration)

- `src/plugins/sdp/_metadata/_pluginMetadata.js`
- `src/plugins/diff/_metadata/_pluginMetadata.js`
- `src/plugins/prof/_metadata/_pluginMetadata.js`
- `src/plugins/omni/ext/quest/_metadata/_pluginMetadata.js`
- `src/plugins/jafting/ext/create/_metadata/_pluginMetadata.js`

## Completed work

- **`ExternalJsonConfigLoader`** and **`ExternalJsonConfigLoaderOptions`** live in J-Base (`src/plugins/_base/managers/ExternalJsonConfigLoader.js`, `src/plugins/_base/models/ExternalJsonConfigLoaderOptions.js`). `ExternalJsonConfigLoader.load` wraps `StorageManager.fsReadFile`, empty/missing guards, `JSON.parse` with path-bearing errors, optional validator and mapper hooks, and `J.BASE.Metadata.ShowExternalFileLoadInfo` logging.
- **Consumers migrated** at call sites listed above plus ABS metadata init (`src/plugins/abs/core/_metadata/initialization.js`). Plugin `_pluginMetadata.js` files no longer call `StorageManager.fsReadFile` directly for these configs.

## Follow-ups

- Any **new** external JSON loaders should call `ExternalJsonConfigLoader.load` unless there is a deliberate exception (document it next to the call).
- Optional: typed wrapper helpers per plugin family if repetition appears again at the *classify* layer only.

## Notes

- Overlaps the “external JSON / error surfacing” story in `sdp-plugin-revisit.md` for SDP; scene work there is separate from this loader.
