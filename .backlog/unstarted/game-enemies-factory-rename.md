# `$gameEnemies` factory naming and role clarity

## Source

- `src/plugins/_base/objects/Game_Enemies.js` (lazy `#cache` of `Game_Enemy` by database id)
- `src/plugins/abs/core/managers/DataManager.js` (`globalThis.$gameEnemies`, `createGameObjects`)
- Call sites: ABS `Game_Event`, `Game_Action`, danger ext, CMS skill detail, Monsterpedia, region skills dummy caster, etc.

## Context

`Game_Enemies` is **not** `$gameActors`-shaped. JSDoc already states:

> A lazy dictionary … **Do not use the enemies from this class as actual battlers!**

It manufactures/caches **prototype `Game_Enemy` rows** for stat lookups, preview UI, and dummy casters — not a party roster or live map battler registry. The `$gameEnemies` name invites the wrong mental model (mirror of actors).

## Recommendation

Rename global and class for factory/cache semantics. Candidates (pick one in implementation PR):

| Name | Notes |
|------|--------|
| `$enemyBattlerFactory` / `EnemyBattlerFactory` | Explicit factory |
| `$enemyPrototypeCache` / `EnemyPrototypeCache` | Emphasizes non-combat use |
| `$gameEnemyTemplates` | Parallel `$game*` prefix, “template” not “roster” |

Keep **one session singleton** in `createGameObjects`; behavior unchanged.

## Work

- Choose final name; rename class + global (mechanical pass + type defs if any).
- Audit call sites — ensure none treat cached enemies as **live** map battlers (spawn path should use map events / `JABS_Engine.addEnemyToMap`, not `$gameEnemies.enemy(id)` as the on-map instance).
- Update JSDoc and guidelines with “prototype lookup only” rule.
- Remove `globalThis.$gameEnemies` bootstrap when doing broader `$` cleanup; shrink verify allowlist.

## Definition of done

- [ ] the class and its global carry the chosen factory name, and
      `grep -rn 'gameEnemies' src/plugins/ --include=*.js` returns nothing outside `_annotations.js`
      changelog text
- [ ] the old name is gone from `LEGACY_GLOBAL_THIS_PROPERTIES` in `src/build-tools/verify-ships.js`
- [ ] the PR names every call site it touched and says which category each one was: a stat lookup, a
      preview, or a dummy caster. The audit **is** the item — the rename only pays off if it turns
      out nobody was treating a cached row as a live map battler, and that answer has to be written
      down rather than assumed
- [ ] the class JSDoc states the prototype-lookup-only rule in its summary, not in a trailing note
- [ ] in-game: open the Monsterpedia and a CMS skill detail, the two heaviest consumers. Stats render
      exactly as before
- [ ] `bun run hotfix` green

## Notes

- Low urgency; high clarity payoff for Omnipedia, CMS previews, and new contributors.
- Distinct from `JABS_AiManager` live battler registry — document both side-by-side in ABS architecture notes.