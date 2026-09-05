---
completed: 2026-08-26
ship: J-Base (Diagnostics), swept across every ship
---

# ABS: scrub placeholder / debug logging (`omg`, plugin commands, noisy warns)

## Severity

**Low** for shipped games (console often closed); **medium** for professionalism and signal-to-noise when debugging real issues.

## Gain

**Low effort, medium polish** — reviewers and you can trust that a `console.warn` means something actionable.

## Source (non-exhaustive)

- `src/plugins/abs/core/__models/JABS_Battler/readiness.js` — `console.warn('omg')` with missing skill slot (~35)
- `src/plugins/abs/ext/formula/_metadata/pluginCommands.js` — `console.log('did the thing.')` (~7)
- `src/plugins/abs/core/__models/JABS_SkillSlotManager.js` — double warn before combo fallback (~316–317)
- Other tone-deaf or vague messages: `src/plugins/abs/ext/danger/objects/Game_Battler.js`, `src/plugins/abs/core/sprites/Sprite_Animation.js`, etc.

## Context

Some warns are valuable (formula eval failure, input adapter not registered). Others are placeholders or inside jokes that do not help field diagnosis.

## Work

1. Replace or remove placeholder strings; use a consistent prefix e.g. `[JABS]` and a single-line reason.
2. Gate verbose diagnostics behind `J.BASE` debug flags if such exist, or introduce a minimal `J.ABS.Metadata.DebugVerbose` if appropriate.
3. Do not bundle with `abs-game-event-page-null-handling.md` (that item is specifically about map dump severity).

## Notes

- Star extension `console.log` noise is out of scope here per Star exclusion unless you want a separate Star hygiene item.

## Definition of done

- [ ] `grep -rn 'console\.' src/plugins/ --include=*.js` returns nothing once
      `abs/ext/star`, `utils`, `Diagnostics.js` and `_annotations.js` changelog text are excluded
- [ ] `src/plugins/_base/core/core/Diagnostics.js` exists and exposes `warn` / `error` / `trace` / `info`
- [ ] every surviving diagnostic names its ship via the build-time `__PLUGIN_NAME__` identifier rather
      than a hardcoded string
- [ ] `bun run hotfix` green

## Resolution

Landed 2026-08-26 in "Unify console reporting behind a Diagnostics channel" (#83). The item asked for
a `[JABS]` prefix convention and a debug-verbosity flag; what shipped is broader and supersedes both —
one `Diagnostics` class in J-Base, four severity methods, and a per-ship name substituted at build
time. `console.warn('omg')` survives only as a line in the J-ABS changelog.
