# SDP (J-SDP) plugin revisit

## Context

J-SDP (Stat Distribution Panel) predates recent monorepo hygiene work on external JSON loading, `parsePluginInt`, and test harness patterns. A dedicated pass should align it with current J-Base conventions and review architecture similarly to the JAFTING workflow/session refactors.

## Scope ideas (non-binding)

- Audit metadata initialization, `PluginManager` parameter parsing, and `StorageManager.fsReadFile` + `JSON.parse` error surfacing for `data/config.sdp.json`.
- Consider clearer separation between panel **data** (`__models`, classify) and **scene/window orchestration** (if any fat scenes remain).
- Expand or refresh Vitest coverage (metadata, panel math, `RPGManager` note helpers as needed).
- Documentation / plugin help accuracy vs. shipped behavior.

## Status

Unstarted — scheduled as follow-up after JAFTING orchestration work.
