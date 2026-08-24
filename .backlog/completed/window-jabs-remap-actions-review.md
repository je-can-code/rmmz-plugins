# `Window_JabsRemapActions` review pass

## Source

- `src/plugins/abs/ext/input/windows/Window_JabsRemapActions.js`

## Done

- File-level `JABS_REMAP_HEADER_HELP` + `jabsRemapActionLookupMaps()` (cached labels/help) for DRY copy.
- `initMembers()` aligned with SKS/APT-style ctor flow; JSDoc on `_root` / `_state` / `_view` for lazy save-safe access.
- Built-in sections driven by `_builtinSectionSpecs()` + `buildBuiltinActionSections()`; override specs or use pre/post extension hooks (unchanged for J.Map / Quest).
- External + JABS rows share `_drawActionBindingRow` with optional fixed left icon.
- Dropped file-wide `max-len` disable and trimmed comment noise.
