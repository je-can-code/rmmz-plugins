# ABS: dedupe “unsupported facing” handling (`JABS_Engine` vs `Spriteset_Map`)

## Severity

**Low** for players; **medium** for drift (messages and behavior diverge over time).

## Gain

**Medium DRY** — one helper for validating/normalizing facings used by engine and sprite layer; fewer duplicate `console.warn` strings.

## Source

- `src/plugins/abs/core/managers/JABS_Engine.js` — multiple `unsupported facing direction` warns (~3959, ~4050, ~4133 region)
- `src/plugins/abs/core/sprites/Spriteset_Map.js` — similar warn (~1732)
- Related: `JABS_Engine` non-dir8 rotation warns (~1815, ~1857)

## Context

Same logical failure is handled in more than one place; fixes can easily update only one copy.

## Work

1. Extract `J.ABS.Helpers.validateFacing` (name TBD) or reuse an existing direction utility if present.
2. Route engine + spriteset code through it; keep warnings consistent or behind a single format.
3. `bun run hotfix` + spot-check map facings and pose facings.

## Notes

- Ties to `JABS_Engine` mega-file extraction themes (`jabs-engine-loot-action-director.md`).

## Resolution

Shipped. The sprite layer now leans on shared engine-facing helpers such as `$jabsEngine.dir8ToUnitVector()` and the
engine-owned action-origin helpers, so the earlier duplicate facing-validation burden between `JABS_Engine` and
`Spriteset_Map` is no longer the active problem this note was tracking.

Remaining non-dir8 warnings are engine-local rotation guards, not a second competing validation path in the spriteset.
