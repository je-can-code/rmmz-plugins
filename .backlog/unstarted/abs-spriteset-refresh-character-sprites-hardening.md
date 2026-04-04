---
status: open
area: code-quality
---

# ABS: validate `Spriteset_Map#refreshAllCharacterSprites` (correctness + safety)

## Severity

**Medium** if wrong: invisible player, duplicate follower sprites, or stale character references after party cycle / ally refresh.

## Gain

**High confidence** in party cycling, ally AI refresh, and follower count changes — author TODO questions functional correctness.

## Source

- `src/plugins/abs/core/sprites/Spriteset_Map.js` — `refreshAllCharacterSprites` (~551+)

## Context

Method rebuilds/rebinds player and follower sprites from `_characterSprites`. Ally AI and `$jabsEngine.requestAlliesRefresh` / `requestSpriteRefresh` increase how often this runs.

## Work

1. Document expected invariants (exactly one player sprite, follower sprites match `$gamePlayer.followers().data()` order).
2. Manual test matrix: solo leader, full party, cycle leader, recruit/dismiss if applicable, ally AI on.
3. Add automated coverage only if harness can stub `Spriteset_Map` / character list; otherwise keep a checklist in PR.
4. Remove or resolve the TODO comment once verified or fixed.

## Notes

- Cross-link `game-character-action-sprite-lifecycle.md` and Popups if sprite layers interact.
