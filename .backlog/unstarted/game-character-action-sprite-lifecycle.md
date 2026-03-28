---
status: open
area: architecture
---

# `Game_Character` action sprite flags vs `JABS_Action`

## Source

- `src/plugins/abs/core/objects/Game_Character.js` (getters/setters around `needsAdding` / `needsRemoving`)

## Context

Sprite lifecycle flags on the character were candidates for removal, with ownership moved to the action object.

## Work

Decide whether `JABS_Action` should own sprite lifecycle flags; migrate call sites and remove from `Game_Character` if the design holds.
