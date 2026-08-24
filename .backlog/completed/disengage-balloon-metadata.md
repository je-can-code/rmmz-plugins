# Disengage balloon (plugin-controlled)

## Source

- `src/plugins/abs/core/__models/JABS_Battler/_reference.js` (`disengageTarget`, `onDisengage`)
- `src/plugins/abs/core/_metadata/initialization.js` (`ShowDisengageBalloon`, `DisengageBalloonId` from plugin parameters)

## Context

Older backlog text described a commented-out frustration balloon and future plugin params.

## Done

Implementation uses `onDisengage()` with `J.ABS.Metadata.ShowDisengageBalloon` and `J.ABS.Metadata.DisengageBalloonId`. No further work unless you want additional options (e.g. per-enemy overrides).
