# `Game_Character` action sprite flags vs `JABS_Action`

## Source

- `src/plugins/abs/core/objects/Game_Character.js` (getters/setters around `needsAdding` / `needsRemoving`)
- Popups stack: `src/plugins/popups/core/objects/Game_Character.js`, `popups/core/sprites/Sprite_Character.js`, `Sprite_Damage.js` (text pop attachment / damage sprite behavior on map characters)

## Severity

**Medium** (sprite leaks / stuck flags show as visual or perf bugs).

## Gain

**Medium** — clearer ownership reduces duplicated flags between ABS actions and Popups sprites.

## Context

Sprite lifecycle flags on the character were candidates for removal, with ownership moved to the action object. J-Popups reintroduced map-layer sprite concerns on `Game_Character` / `Sprite_Character`; any migration must account for popups + ABS together.

## Work

Decide whether `JABS_Action` (and/or `Map_TextPop` / `TextPopSpriteManager`) should own sprite lifecycle flags; migrate call sites and remove from `Game_Character` if the design holds. Regression-test damage rings and loot popups on map.

## Definition of done

- [ ] `grep -rn 'needsAdding\|needsRemoving' src/plugins/abs/core/objects/Game_Character.js` returns
      nothing — the flags live on whichever object the ownership decision named
- [ ] the J-Popups map-layer files that touch the same character still build, and `bun run hotfix`
      is green
- [ ] in-game, with the console open: note
      `SceneManager._scene._spriteset._characterSprites.length`, fire fifty-odd actions in a row on
      one map, then read it again. It returns to the resting value. Sprite leaks are what this item
      exists for, and they are invisible until the count is actually looked at
- [ ] in-game: kill an enemy that drops loot, leave the map and come back — no orphaned loot sprite,
      no orphaned damage ring

## Notes

- Related: `textpop-builder-extension-placement.md` (presentation layer ownership).
