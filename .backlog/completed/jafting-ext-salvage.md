---
status: done
area: feature
---

# JAFTING salvage extension (material recovery + id reclaim)

## Source

- [`src/plugins/jafting/ext/create/`](src/plugins/jafting/ext/create/) (creation output, recipe metadata, party/inventory flows)
- [`src/plugins/jafting/ext/create/__models/CraftingRecipe.js`](src/plugins/jafting/ext/create/__models/CraftingRecipe.js)
- [`src/plugins/jafting/ext/create/__models/CraftingCreationSession.js`](src/plugins/jafting/ext/create/__models/CraftingCreationSession.js)
- Sell / discard / lose-item paths: [`Game_Party`](src/plugins/jafting/ext/create/objects/Game_Party.js) patches and vanilla inventory economics as needed

## Context

Crafted items consume ingredients and occupy database-backed item rows. Games that lean on JAFTING need a **salvage** loop: destroy or recycle a crafted piece and recover **some fraction** of the original materials, using authoritative provenance (“this instance came from recipe X”) rather than guessing from the finished item’s stats alone.

That provenance should pair with **inventory hygiene**: when the player sells, discards, or otherwise removes crafted goods, the stack should **release or reclaim dynamic database ids** where the project uses id recycling, so long-lived saves do not leak ids or strand orphaned rows.

## Severity

**Medium** until a shipped title depends on tight crafting economies; **high** for games where crafted gear churn is core progression.

## Gain

**High** for crafting-heavy titles: closes the loop between creation and inventory pressure, and keeps dynamic-id schemes stable under churn.

## Work

- Add a **JAFTING-owned salvage extension** (namespace under `J.JAFTING.EXT.*`, parallel to create/refine patterns and the planned socketing extension) with UI/session hooks consistent with `jafting-heavy-scenes-decomposition.md` guidance.
- **Stamp crafted instances** (save-safe fields via `JsonEx` / party item state) with the **recipe key** (and any params needed to reconstruct partial refunds). Ensure loads and stack splits preserve or resolve stamping rules explicitly.
- Define **recovery rules**: flat percentage, tiered by proficiency, ingredient whitelist/blacklist, minimum one unit, etc., driven by plugin params and/or notetags.
- **Sell / discard / shop** integration: when an item leaves the party through those paths, run the same id-reclaim / bookkeeping path as salvage where applicable so dynamic ids stay coherent.
- Tests or harness coverage for: craft → salvage yields expected components; sell/discard reclaims ids per project policy; save/load preserves stamps.

## Notes

- Coordinate with `jafting-ext-socketing.md` on salvage vs socket preservation policy; core create/refine remain the primary integration points.

## Resolution

Shipped. The salvage loop landed as first-class JAFTING functionality with `Scene_JaftingSalvage`, salvage windows, stamped
lineage ledgers, craft-output stamping, refund preview/execution, and inventory cleanup hooks when stamped gear leaves the party.

The final implementation lives in JAFTING core rather than as a separate `ext` plugin, but it fulfills the feature this
backlog item was tracking, including dynamic id reclaim/bookkeeping and accompanying test coverage.
