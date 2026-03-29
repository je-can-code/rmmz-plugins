---
status: open
area: architecture
---

# `Game_Action` battler identity (UUID vs reference)

## Source

- `src/plugins/abs/core/objects/Game_Action.js` (see `subject` / `setSubject`; TODO comments near top of file)

## Context

Battlers are tracked by actor id / enemy index today. Open question: whether UUIDs should be used so references survive serialization boundaries cleanly.

## Work

Decide UUID vs reference; update `Game_Action` accordingly; audit serialized models that hold battler references and align with the chosen approach.
