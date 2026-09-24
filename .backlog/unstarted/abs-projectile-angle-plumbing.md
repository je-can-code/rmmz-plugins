# Delete the unused projectile angle plumbing

## Source

- `src/plugins/abs/core/models/JABS_ActionOptions.js`, `src/plugins/abs/core/models/JABS_ActionOptionsBuilder.js`
  and `src/plugins/abs/core/managers/JABS_ActionSpawner.js` (`projectileTravelAngleDegrees`)
- `test/plugins/abs/core/models/jabs-action-options.test.js`,
  `test/plugins/abs/core/managers/jabs-action-spawner.test.js`

## Context

`projectileTravelAngleDegrees` is carried by `JABS_ActionOptions`, set through its builder and
forwarded by `JABS_ActionSpawner`, but no movement code reads it. It was plumbing for angled
projectiles, which was cancelled on 2026-09-23: Chef Adventure has no use for it, and eight-direction
aiming already covers what the game needs.

J-ABS is long past 1.0, and a shipped plugin should hold the fields it uses rather than placeholders
for ones it might.

## Work

- Delete every read and write of `projectileTravelAngleDegrees` in `JABS_ActionOptions` and
  `JABS_ActionOptionsBuilder`, and the forwarding call in `JABS_ActionSpawner`, along with the test
  cases that exist only to cover them.

## Definition of done

- [ ] `grep -rn 'rojectileTravelAngleDegrees' src/plugins/ test/ --include=*.js` returns nothing
      outside `_annotations.js` changelog text
- [ ] `bun run hotfix` green and coverage still 100%

## Notes

- If angled projectiles come back into scope, open a new item carrying the design. It does not need
  this plumbing to start from.
- `cachedActions` on `JABS_Engine` is also unused today, but it is not scaffolding to delete: it has a
  live target, tracked in `cached-actions-map.md`.
