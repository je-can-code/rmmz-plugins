---
status: open
area: architecture
---

# `Game_Action` battler identity (UUID vs reference)

## Source

- `src/plugins/abs/core/objects/Game_Action.js` (see `subject` / `setSubject`; TODO comments near top of file)

## Context

Battlers are tracked by actor id / enemy index today. Open question: whether UUIDs should be used so references survive serialization boundaries cleanly.

## Severity

**High** once undertaken (touches combat, saves, and many `Game_Action` hooks — see `cross-plugin-prototype-hook-surface.md`).

## Gain

**High** if UUIDs simplify map↔battle identity; **negative** if done without a clear save/load story — coordinate with `jsonex-j-register-serialization-registry.md`.

## Work

Decide UUID vs reference; update `Game_Action` accordingly; audit serialized models that hold battler references and align with the chosen approach.
