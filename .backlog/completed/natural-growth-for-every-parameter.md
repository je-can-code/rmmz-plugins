---
completed: 2026-09-23
ship: J-NaturalGrowth 3.0.0, J-Base 3.19.0, and the nine owner ships that bind to it
---

# Natural growth tags for every registered parameter

## Resolution (2026-09-23)

The `dor` recipe below was not repeated. Copying it would have failed twice over: J-NaturalGrowth loads
after seven of the eight owners in Chef Adventure and redefines the hooks the recipe aliases (so `dor`
growth had never run there either), and `dor` added its natural bonus after its own divide by a
hundred, making `<dorBuffPlus:[15]>` worth +1500% drops. Instead, agreed with Jeremy:

- **One keyed store.** J-NaturalGrowth keeps every parameter's buffs and growths in four tables keyed
  by registry key- the engine's twenty-eight included- so a newly bound parameter needs no storage,
  accessors or level-up code of its own.
- **Bindings on the registry.** An owner declares its four regex literals in its own `RegExp` table and
  binds them with `ParameterRegistry.bindNatural(key, new NaturalParameterBinding(...))` beside its
  definition. J-NaturalGrowth binds the engine's parameters, `mtp` and `har` the same way at boot.
- **A J-Base seam.** Owners add `this.naturalBonus(key)` where they assemble the value. J-Base answers
  zero and J-NaturalGrowth extends it, so owners never reference J-NaturalGrowth and load order stops
  mattering.
- **One unit rule.** Tags are written in the numbers the status screen shows; the single conversion
  scales the base up and the bonus down by `ParameterDefinition#displayScale`.

The same pass fixed three more members of the family: ex- and sp-parameter growth divided by a hundred
twice on read (every x/s class growth delivered 1/100th), `har` buffs added raw to a 1.0 factor, and
`cdm`/`ctr` rates were a percent of a fraction. `dor` and `cdm`/`ctr` lost their bespoke copies.

## Source

- `src/plugins/drops/core/_metadata/initialization.js` and `drops/core/objects/Game_Actor.js` /
  `Game_Battler.js` - the pattern to copy: `dor` declares all four tags and folds them into its value
  through `naturalParamBuff`
- The owners of the eleven parameters that declare none (from each ship's `register*Parameters.js`):

| Ship | Parameters |
|---|---|
| J-ABS-Shield (`abs/ext/shield`) | `sar`, `ser` |
| J-ABS-MoveSpeed (`abs/ext/speed`) | `msb` |
| J-Aptitude (`apt/core`) | `apr` |
| J-DropsControl (`drops/core`) | `gdr` |
| J-Proficiency (`prof/core`) | `prof` |
| J-Resources (`resources/core`) | `hcr` |
| J-Resources-ABS (`resources/ext/abs`) | `lst`, `mst`, `tst` |
| J-SDP (`sdp/core`) | `sdr` |

## Context

Classes are meant to hand out permanent growth while they are used for leveling, often in secondary
or custom stats rather than the eight base ones. That only works for a parameter whose owner declares
`<{key}BuffPlus>`, `<{key}BuffRate>`, `<{key}GrowthPlus>` and `<{key}GrowthRate>` and folds them into
the parameter's value. Every vanilla parameter and several custom ones (`cdm`, `ctr`, `dor`, `har`,
`mtp`) do. These eleven declare none of the four, so a class tag naming one of them parses as nothing,
silently.

Chef Adventure's data validator found it on its first run: Classes #9 "Medick" carries
`<lstGrowthPlus:[1.5]>` and Classes #20 "Equilibrium" carries `<sarGrowthPlus:[1.5]>` (authored as
`sha`, renamed on 2026-09-23 once Jeremy confirmed `sha` meant shield amplification). Neither has ever
granted anything.

## How `dor` does it - the recipe to repeat per parameter

1. **Declare the four regexes as literals** in the ship's `_metadata/initialization.js`, the same
   formula-payload shape as `J.DROPS.RegExp.DropRate{Buff,Growth}{Plus,Rate}`
   (`/<dorGrowthPlus:\[([+\-*/ ().\w]+)]>/gi`).
2. **Storage** - alias `Game_Battler#initNaturalGrowthParameters` (gated on `if (!J.NATURAL) return;`)
   to declare `this._j._natural._{key}Plus` and `._{key}Rate` at 0, with the accessors and `mod` mutators
   `drops/core/objects/Game_Battler.js` gives `dor` (`dorPlus`, `dorRate`, `modDorPlus`, `modDorRate`).
3. **Bonuses** - `{key}NaturalBonuses()` (returns 0 without `J.NATURAL`) sums `{key}NaturalBuffs()`, the
   Buff tags read live through `naturalParamBuff`, and `{key}NaturalGrowths()`, the stored permanent
   values.
4. **Level-up** - alias `Game_Actor#applyNaturalCustomGrowths` to call `applyNatural{Key}Growths()`,
   which adds the Growth tags into storage once per level, as `applyNaturalDorGrowths` does.
5. **Fold in** - add `{key}NaturalBonuses()` wherever the parameter's value is computed, the way
   `Game_Actor#getDropMultiplierBonus` adds `dorNaturalBonuses()`.

## Work

- Apply the recipe to all eleven parameters in their owning ships.
- **Keep the regexes as literals in a `RegExp` table.** `src/build-tools/notetag-declarations.js` reads
  tags from the AST, so a tag built at runtime - say, generated from ParameterRegistry keys - is
  invisible to `verify:notetag-reference` and to the manifest, and Chef Adventure's validator would go
  on reporting every class that uses it.
- **Extend the shorthand list by hand.** The J-NaturalGrowths glossary entry is a family heading,
  `<(PARAM)(Buff|Growth)(Plus|Rate):[FORMULA]>`, so the doc gate already credits any new
  `{key}GrowthPlus` and will not demand anything. Add the eleven keys to its "Custom params" bullet,
  each with the plugin it requires, or nobody will find them.
- The new `_j._natural` fields are saved state. Read `docs/save-system.md` first; an old save has to
  decode with them at 0, not `undefined`.
- Tests per ship, at the depth the rest of the suite holds.

## Definition of done

- [x] `bun run hotfix` green, coverage still 100%
- [x] every one of the eleven keys has all four tags in the build manifest:
      `bun -e "const m=require('./out/manifest.json');const n=new Set(m.notetags.flatMap(t=>t.names));['apr','gdr','hcr','lst','msb','mst','prof','sar','sdr','ser','tst'].forEach(k=>['BuffPlus','BuffRate','GrowthPlus','GrowthRate'].forEach(s=>n.has(k+s)||console.log('missing',k+s)))"`
      prints nothing
- [x] in `ca`, `bun run validate` no longer reports `<lstGrowthPlus>` on Classes #9 or `<sarGrowthPlus>`
      on Classes #20
- [ ] in-game: level a Medick and its lifesteal rises with each level

## Notes

- Found while triaging the first `ca` validator run with Jeremy on 2026-09-23. He had understood every
  parameter the ecosystem supports to already have growth.
