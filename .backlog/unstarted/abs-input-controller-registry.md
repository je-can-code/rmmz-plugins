# `$jabsController1` → input adapter registry

## Source

- `src/plugins/abs/ext/input/_metadata/initialization.js` (`globalThis.$jabsController1`)
- `src/plugins/abs/ext/input/managers/DataManager.js` (lazy `new JABS_StandardController()`)
- `src/plugins/abs/ext/input/managers/JABS_Engine.js` (`$jabsController1.update()`, `setBattler` on party cycle)
- `src/plugins/abs/ext/input/_models/JABS_Battler.js` (`setBattler`)
- `src/plugins/abs/core/__models/JABS_InputAdapter.js` (`static controllers`, `register()`)
- `src/plugins/abs/core/__models/JABS_BaseController.js` (auto-`register(this)` on construct)

## Context

`$jabsController1` was named as if player 2/3 controllers (`$jabsController2`, …) might follow. In practice:

- `JABS_Engine.getPlayers()` only returns **player 1** today.
- `JABS_BaseController` already **registers** with `JABS_InputAdapter.controllers` on construction.
- The input extension still bypasses the adapter and calls `$jabsController1` directly for `update()` and party-cycle rebinding.

Local co-op (if ever) is **multiple controllers on one engine**, each bound to a battler — not numbered global slots.

## Recommendation

- Drop `$jabsController1` global bootstrap.
- Treat **`JABS_InputAdapter.controllers`** as the source of truth (primary = index 0 or explicit `playerIndex` on controller).
- `JABS_Engine.updateInput()` (input ext) iterates registered controllers instead of hard-coding `$jabsController1`.
- Party cycle: rebind **primary** controller’s battler via adapter lookup, not a global name.

Future: tag controllers with `playerSlot` / battler uuid when `getPlayer2()` exists.

## Work

- Refactor input ext to use adapter registry end-to-end.
- Remove `globalThis.$jabsController1`; shrink verify legacy allowlist.
- Document “primary controller” convention in J-ABS input ext metadata / guidelines.
- Audit charge ext and HUD input paths that assume `$jabsEngine.getPlayer1()` — unchanged for v1, but note co-op extension point.

## Notes

- Small/medium refactor; behavior should be identical for single-player.
- Related: `jabs-5-static-engine-external-data.md` if engine input lifecycle moves in a major ABS pass.