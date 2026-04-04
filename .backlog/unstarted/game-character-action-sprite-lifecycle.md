---
status: open
area: architecture
---

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

## Notes

- Related: `textpop-builder-extension-placement.md` (presentation layer ownership).
