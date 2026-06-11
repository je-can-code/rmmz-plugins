---
status: open
area: feature
---

# Chef Adventure: food recipes, unlocks, and crafting redo

> **Depends on (runtime):** [ca-food-group-chain-system](ca-food-group-chain-system.md) — plugins +
> chain states shipped; this item is the **content/economy** redo that makes six food families playable.
> **CA docs:** `ca/docs/sdp/work-items.md` P4-0, `ca/docs/food/food-chain-durations.md`.

## Severity

**High** design debt — meal roster, crafting ingredients, and unlock flow were authored incrementally
with an implicit rule: *“kill monster → craft dinner.”* That collapses most meals onto **protein**
drops (bearcat flank, ribs, fish, tongue, etc.) regardless of `<food:TYPE>` tags. Interim tag
realignments help HUD honesty but do not fix scarcity or player habits.

## Gain

**High** for CA identity (cooking/comedy road trip), Field Medic meal-timing fantasy, and P4-0
playtesting: players should **choose an arc** (carb coma vs fruit crash vs sweet gassy snack), not
default to whichever flank dropped last.

## Source

- `ca/chef-adventure/data/config.crafting.json` — all `food_*` recipes; outputs ids **151–182**
- `ca/chef-adventure/data/Items.json` — food items, **Recipe Journal I/II/III** (ids **461–463**)
- `ca/chef-adventure/data/CommonEvents.json` — journal consume → recipe unlock (events **161–163**)
- `ca/docs/unlockables/recipe-journals.md` — placeholder doc
- Enemy drop tables / shops — flank-heavy armor ingredients (`a386`, `a396`, `a426`, …)
- Related SDP: Kobold Field Medic, Cleric PHA + food chains (`ca/docs/sdp/archetype-mapping.md`)

## Context

### What exists today

- **Unlock:** three generic **Recipe Journal** consumables drop randomly from enemies; each teaches a
  **bundle** of unrelated meals via common event (not family-themed).
- **Crafting:** ~28 `food_*` rows; many gate on **monster meat armor drops** (Bearcat Flank appears in
  multiple recipes). Staple/gather recipes exist (pilaf, carrots, tea) but are outnumbered by
  hunt-loot mains. **Craft chains** can smuggle meat (e.g. River Smoothie requires Tender Coral and Cod).
- **Tags:** `<food:protein|vegetable|fruit|carb|dairy|sweet>` on items; classification drifted toward
  protein because **ingredients** sound like meat. Chain **states** 251–282 are authored; item tags were
  partially realigned as a stopgap.

### What went wrong (author intent vs outcome)

Authoring assumed *“you'll want to hunt X to make Y”* for every tier. That is valid for **some**
protein flagship meals but not for six parallel **10-minute (or sweet ~4-minute) arcs**. Thin groups
(dairy/fruit/sweet) never get crafted in real runs if journals + drops keep feeding flanks.

## Target design (direction)

### Family-oriented recipe unlocks (replace journal 1/2/3 model)

Instead of three random journals that teach mixed bundles:

- **Per-family recipe books** (names TBD), e.g. Fruit Recipes, Carb Recipes, Protein Recipes,
  Vegetable Recipes, Dairy Recipes, Sweet Recipes — each unlocks **a small curated set** (3–5) of
  meals for that arc.
- Sources: family-themed drops, shops, quests, chests — **not** uniformly random from all enemies.
- Optional: one **intro** cookbook near hub (inn) that teaches one simple meal per family (tutorial
  coverage without six books at once).

Deprecate or repurpose items **461–463** and events **161–163** when migrating; update
`recipe-journals.md` and any drop tables that still roll generic journals.

### Family-oriented ingredients

- **Drops / purchases** aligned to family lanes, not only flanks: rice/bread/berries/malk/bleu/gelatin/
  herbs/fungi vs bearcat/ribs/fish.
- **Reduce duplicate anchors** — one flagship protein craft per flank tier; carb/fruit/sweet flagship
  crafts should not require the same rare meat part.
- **Break meat-only craft chains** unless intentional (smoothie should not require a fish dish unless
  that is a deliberate gate).

### Meal list pass (151–182)

- Re-slot or rename meals so **~5–6 crafts per family** are reachable by mid-game (scarcity tuned per arc).
- Set `<food:TYPE>` **after** recipe identity is fixed (arc-first, not ingredient-first).
- Revisit heal profiles, cooldowns, descriptions, icons per family.

## Work

1. **Audit spreadsheet / doc** — per food output id: current recipe ingredients, current `<food:TYPE>`,
   proposed family, keep | rework | cut | new; note drop ids. Suggested path:
   `ca/docs/food/recipe-group-audit.md` (authoring-only).
2. **Unlock redesign** — define family recipe book items + common events (or JAFTING unlock keys);
   map who drops/sells each; retire Recipe Journal I/II/III flow.
3. **Crafting pass** — rewrite `food_*` rows in `config.crafting.json` to match family lanes; remove
   redundant flank spenders; fix chained recipes.
4. **Economy pass** — enemy drops, shop stock, ingredient scarcity so non-protein arcs are craftable in
   a normal play session.
5. **Items pass** — sync `Items.json` 151–182 notes (`<food:TYPE>`, copy, effects) with new recipes.
6. **Playtest** — one full in-map arc per family + overstuffed discipline; Field Medic pacing check.
7. **Docs** — update `recipe-journals.md`, SDP P4-0 in `ca/docs/sdp/work-items.md`, mark
   [ca-food-group-chain-system](ca-food-group-chain-system.md) content items 6–7 as superseded by
   this file where overlap exists.

## Acceptance (content)

- Player can **reasonably craft** at least one meal per food family without farming the same flank
  three times.
- Recipe unlocks are **discoverable by family** (book/scroll/shop), not three random omnibus journals.
- `<food:TYPE>` on each meal matches the chain players actually experience.
- No food craft requires a **prior cooked meat dish** unless explicitly documented as a upgrade path.

## Notes

- **No new J-ABS plugin work required** for the redo itself — `<food:TYPE>`, chains, HUD already ship.
  Editor/crafting config only unless new unlock item types need plugin support.
- **Interim tags** applied 2026-06-02 (pudding → sweet, goulash → carb, etc.) are valid until this pass;
  expect to move again when recipes change.
- Protein-heavy fantasy is fine for **some** Erocian jokes; the goal is **choice**, not vegan CA.
