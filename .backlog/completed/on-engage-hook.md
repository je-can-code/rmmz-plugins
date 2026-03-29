---
status: done
area: completed
---

# `onEngage` hook for engagement side effects

## Source

- `src/plugins/abs/core/__models/JABS_Battler/_reference.js` (`engageTarget`, `onEngage`)

## Done

`engageTarget` calls `onEngage()` after setup; default implementation shows the exclamation balloon. Extensions alias `onEngage` for custom behavior.
