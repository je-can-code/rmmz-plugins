---
status: open
area: code-quality
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
