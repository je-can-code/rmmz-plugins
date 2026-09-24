# Delete `Game_Character`'s write-only action sprite removal flag

## Source

- `src/plugins/abs/core/objects/Game_Character.js` (`_actionSpriteNeedsRemoving`, with
  `getActionSpriteNeedsRemoving` and `setActionSpriteNeedsRemoving`)
- `src/plugins/abs/core/models/JABS_Battler.js` (`destroy()` sets it after erasing the character)
- `src/plugins/abs/core/sprites/Spriteset_Map.js` (sets it back to `false` after purging an action's
  sprites)
- `test/plugins/abs/core/objects/game-character.test.js`, `test/plugins/abs/core/models/jabs-battler.test.js`

## Context

A character carries two flags about its action sprite. `_actionSpriteNeedsAdding` is live:
`JABS_Engine` raises it when it spawns an action event, `Game_Map` polls it, and
`Spriteset_Map.addActionSprite` lowers it once the sprite exists. `_actionSpriteNeedsRemoving` is
write-only. Two places set it and nothing reads it: `getActionSpriteNeedsRemoving` has no callers
outside its own test.

Removal is already owned by the action. `JABS_Action.getNeedsRemoval()` is the signal the map and
sprite layers actually read, through `Game_Character.getJabsActionNeedsRemoving()`, in `Game_Map`,
`Sprite_Character`, `Sprite_Animation` and `Sprite_AnimationMV`. So the character's flag is a dead
duplicate, and the "flag the sprite for removal" comment in `JABS_Battler.destroy()` describes
something that does not happen.

This item originally also asked how sprite ownership should be split with J-Popups. #119 settled that
by giving popups their own plane in `Spriteset_Map`, so they no longer ride on the character at all.

## Work

- Delete `_actionSpriteNeedsRemoving`, its getter and setter, both writes, and the comment above the
  write in `JABS_Battler.destroy()`.
- Delete the test assertions that exist only to cover the flag.

## Definition of done

- [ ] `grep -rn 'ActionSpriteNeedsRemoving' src/ test/` returns nothing
- [ ] `bun run hotfix` green and coverage still 100%
- [ ] in-game: fire a burst of skills and kill something with them. Actions spawn and clear exactly
      as before, which they must, since nothing ever read the flag

## Notes

- Out of scope: the loot flags on the same object are live (`Game_Map`, `Sprite_Character`,
  `Spriteset_Map` and `Game_Player` all use them). `_actionSpriteNeedsAdding` could move onto
  `JABS_Action` for symmetry, but nothing is wrong with where it lives today.
- Related: [`textpop-builder-extension-placement.md`](../completed/textpop-builder-extension-placement.md).
