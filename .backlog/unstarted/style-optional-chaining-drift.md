---
status: open
area: code-quality
---

# Remove optional chaining (`?.`) to match project style

## Severity

**Low** for runtime behavior (optional chaining is valid ES2020). **Medium** for consistency: `.junie/guidelines.md` forbids optional chaining in new code; drift invites mixed style in reviews.

## Gain

**Low effort, medium consistency gain.** Mechanical rewrite in a small set of files. Pair with ESLint `no-restricted-syntax` when `build-tools-linting.md` lands.

## Source (files using `?.` under `src/plugins` as of audit)

- `src/plugins/jafting/ext/refine/scenes/Scene_JaftingRefine.js`
- `src/plugins/jafting/ext/create/__models/CraftingRecipe.js`
- `src/plugins/map/sprites/Sprite_MiniMap.js`
- `src/plugins/_base/sprites/Sprite_BaseText.js`
- `src/plugins/message/windows/Window_Base.js`
- `src/plugins/message/__models/BasicChoiceConditional.js`
- `src/plugins/regions/ext/skills/objects/Game_Character.js`
- `src/plugins/omni/ext/quest/__models/TrackedOmniQuest.js`
- `src/plugins/omni/ext/quest/objects/Game_Party.js`

## Work

1. Replace each `?.` with explicit guards or early returns per guidelines (assume valid state where the engine guarantees it).
2. Add a lint rule to prevent reintroduction.
3. Re-run `bun run hotfix` and relevant tests.

## Notes

- Complements `build-tools-linting.md`.
