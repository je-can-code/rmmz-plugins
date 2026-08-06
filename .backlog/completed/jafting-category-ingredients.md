---
status: done
area: architecture
---

# JAFTING Creation: category-matched ingredients

> **Shipped 2026-08-06.** All plugin work is built and green: 12 source gates, 78 ships, the full suite,
> and **100% coverage across every JAFTING file** (statements, branches, functions, lines) on 454 tests.
>
> **The one deferred piece is data, not code:** step 11, tagging the Chef Adventure ingredient database
> with `<ingredientType:...>`, waits on the ingredient roster in `ca/docs/food/ingredient-sorting.md`.
> Until those tags exist, every recipe behaves exactly as it did before - a component with no
> `categories` array takes the original id-based path untouched.
>
> ## What changed against the plan
>
> - **The salvage threading was inverted.** The plan had `rowsFromCraftingComponents` asking
>   `component.isCategorical()`, which made **core depend on the create extension's model** and broke
>   nine existing tests that pass minimal doubles. It now branches on `selections.has(i)` instead - the
>   selections map is the authority on what was spent, so core needs no new interface.
> - **Allocation is best-fit, not first-fit.** Greedy picks the largest eligible stack and starves later
>   slots: one Boney Ribs plus two Grim Flank against `[meat x1]` then `[flank x2]` fails if the meat
>   slot eats a flank. `allocateFrom` spends the *tightest sufficient* stack instead.
> - **`getHandledQuantity` reports the largest single stack, not the sum** - one slot spends one entry,
>   so a total would colour a row green against a requirement it can never fill.
> - **Six dead blocks were removed while in here**, each rewritten as a total branch rather than left as
>   an implicit `undefined`. Two turned out not to be dead: `getHandledQuantity`'s trailing `return 0`
>   is reachable when J-SDP is absent (its `console.warn` claiming an "unsupported component type" was
>   simply wrong and is gone), and `createRefinedOutput`'s missing `else` was a **silent no-op** that
>   now throws - it must, because `generateRefinedEquip` writes its datastore row *before* recording
>   lineage, so guessing a datastore would orphan a row on the way to failing anyway.
>
> **Follow-on:** the finishing-touches work item depends on this and on refinement gaining an item path.
> Note that `createRefinedOutput`'s new throw is exactly the branch that becomes live when items become
> a third `RefinementTypes` entry.

## Severity

**High** — blocks the Chef Adventure recipe redesign. Without it, every new ingredient added to the game
costs new recipes, and the recipe count grows without bound.

## Gain

**High, permanently.** A recipe asking for `[any meat]` covers every meat that exists today *and* every
meat authored later, for free. Adding an ingredient stops costing recipes. See
`ca/docs/food/recipe-system.md` (sibling repo) for the design this serves.

## Source

- `src/plugins/jafting/ext/create/__models/CraftingComponent.js` — the model that must learn categories
- `src/plugins/jafting/ext/create/__models/CraftingRecipe.js` — `canCraft`, `craft`
- `src/plugins/jafting/ext/create/_metadata/_pluginMetadata.js` — `parseRecipes`, `componentMapper` (line ~50)
- `src/plugins/jafting/ext/create/windows/Window_RecipeIngredientList.js` — ingredient rendering
- `src/plugins/jafting/ext/create/scenes/Scene_JaftingCreate.js` — the craft flow
- `src/plugins/jafting/core/__models/JaftingSalvageLedger.js` — `rowsFromCraftingComponents` (line 161)
- `src/plugins/jafting/core/managers/JaftingSalvageManager.js` — `applyCraftRecipeOutputs` (line ~367)
- `src/plugins/_base/core/managers/RPGManager.js` — `getStringsFromNoteByRegex` (line 440)

---

## Context

### What exists today

A recipe ingredient is a `CraftingComponent` holding exactly three fields — `count`, `id`, `type` —
where `type` is one of `i` / `w` / `a` / `g` / `s`. Everything downstream resolves the id directly:

- `#getDatabaseEntry()` → `$dataItems.at(this.#id)` and friends
- `hasEnough()` → `$gameParty.numItems(this.getItem())`
- `consume()` → `$gameParty.loseItem(this.getItem(), this.#count)`
- `getName()` / `getIconIndex()` → read off the resolved row

So a recipe naming Bearcat Flank can only ever be satisfied by Bearcat Flank.

### What needs to be true

A recipe ingredient may instead name a **set of ingredient types**, and be satisfied by any inventory
item carrying all of them.

---

## Data shape

### The notetag on ingredients

```
<ingredientType:protein>
<ingredientType:meat>
```

Repeatable. An item declares every slot it can fill. Read with
`RPGManager.getStringsFromNoteByRegex`, which already returns every match of a repeated tag.

Regex belongs in `src/plugins/jafting/ext/create/_metadata/initialization.js` alongside the other
`RegExp` entries — bootstrap lives in one file:

```javascript
/**
 * A type this database entry can satisfy when a recipe asks for a category rather than an id.
 *
 * <pre>
 * Structure:
 *  <ingredientType:TYPE>
 *
 * Example:
 *  <ingredientType:protein>
 *
 * Translation:
 *  This entry can fill a slot asking for the 'protein' type.
 * </pre>
 * @type {RegExp}
 */
J.JAFTING.EXT.CREATE.RegExp.IngredientType = /<ingredientType:[ ]?(\w+)>/i;
```

**No `g` flag, and one tag per line.** `RPGManager.#getStringsFromNoteByRegex` strips `g` and `y`
("to avoid lastIndex side effects across lines"), splits the note on newlines, and execs the scanner
**once per line**, taking the first capture. So repetition works by putting each tag on its own line,
and two tags sharing a line would silently yield only the first. That is an authoring constraint worth
knowing before the database gets tagged.

### The recipe ingredient in `config.crafting.json`

An ingredient entry gains one optional field. When `categories` is present and non-empty, `id` is
ignored:

```json
{ "categories": [ "protein", "meat" ], "count": 1 }
```

Existing entries are untouched and keep working:

```json
{ "id": 386, "type": "a", "count": 1 }
```

**No migration.** Absent `categories` means the component behaves exactly as it does today. This is the
whole compatibility story and it needs no config rewrite.

---

## Model changes

### `CraftingComponent`

Add one private field and the accessors around it.

```javascript
/**
 * The ingredient types a satisfying entry must carry, or empty when this component names a
 * database row directly.
 * @type {string[]}
 */
#categories = [];
```

Constructor signature becomes `constructor(count, id, type, categories = [])`. The default keeps every
existing call site valid, including the builder.

Add to the builder: a `categories(categories)` fluent method mirroring `count`/`id`/`type`, cleared in
`#clear()`.

**New methods:**

```javascript
/**
 * Whether this component is satisfied by any entry carrying its types, rather than by one specific
 * database row.
 * @returns {boolean}
 */
isCategorical()
{
  return this.#categories.length > 0;
}

/**
 * The ingredient types a satisfying entry must carry.
 * @returns {string[]}
 */
categories()
{
  return this.#categories;
}
```

**Methods that must branch on `isCategorical()`:**

| Method | Categorical behavior |
|---|---|
| `isDatabaseEntry()` | `true` — a categorical component is still resolved to real rows |
| `getItem()` | the *selected* row, or the first eligible when none is selected. **Returns `null` when nothing is eligible** — document that in its JSDoc, since the contract otherwise promises a row |
| `getName()` | the slot label — see "Slot labels" below. Must **not** route through `getItem()`, which can be null |
| `getIconIndex()` | the icon of the selected row; otherwise the first eligible row's; otherwise a fixed slot icon. Must not route through a null `getItem()` |
| `getHandledQuantity()` | the **largest single** eligible count — `Math.max` of `$gameParty.numItems(x)` across eligible entries. **Not the sum.** One-kind-per-slot means a sum would show `2× bearcat + 2× grim` as "have: 4" in green against a `×3` slot that cannot actually be filled |
| `hasEnough()` | `true` when at least one *single* eligible entry is held in `count` or greater |
| `consume()` | consumes `count` of the **selected** entry only |
| `generate()` | never called on an ingredient; leave as-is and let it use the id path |

`isGold()` / `isSdp()` are unaffected — a categorical component is never gold or SDP, and
`parseRecipes` must not build one that is.

### Eligibility

One place, so nothing drifts:

```javascript
/**
 * Every inventory entry that could satisfy this component.
 *
 * Scoped to the party rather than the database on purpose: you can only cook with what you are
 * carrying, and scanning three full datastores on every window refresh is the slow way to reach the
 * same answer.
 * @returns {(RPG_Item|RPG_Weapon|RPG_Armor)[]}
 */
eligibleEntries()
{
  const wanted = this.categories();

  return $gameParty.allItems()
    .filter(entry => wanted.every(type => entry.ingredientTypes().includes(type)));
}
```

`$gameParty.allItems()` returns held items, weapons and armors — exactly the right scope.

### `RPG_Base.ingredientTypes()`

The tag reader belongs on the database model, beside the other notetag getters, in
`src/plugins/jafting/ext/create/database/` (create a `RPG_Base.js` there — refine already does this
for its own getters):

```javascript
/**
 * The ingredient types this entry can satisfy when a recipe asks for a category.
 *
 * Empty for the overwhelming majority of database entries, which is the correct answer - they are
 * not ingredients.
 * @returns {string[]}
 */
RPG_Base.prototype.ingredientTypes = function()
{
  return RPGManager.getStringsFromNoteByRegex(this, J.JAFTING.EXT.CREATE.RegExp.IngredientType);
};
```

`getStringsFromNoteByRegex` returns `[]` when nothing matches, so no guard is needed at any call site.

### Parsing

`_pluginMetadata.js`, `componentMapper` (line ~50):

```javascript
const componentMapper = mappableComponent =>
{
  const {
    count,
    id,
    type,
    categories
  } = mappableComponent;

  // a categorical component names types instead of a row; the absent field is the common case.
  const newComponent = new CraftingComponent(count, id, type, categories ?? []);

  return newComponent;
};
```

That is the entire parsing change.

---

### Slot labels

`getName()` on a categorical component has no row to read from, and the categories are lowercase keys
(`protein`, `meat`). A rule is required rather than left to the implementer:

**Use the last category in the array, title-cased, prefixed with "Any".** `["protein","meat"]` renders
as **"Any Meat"**. Authors order categories broad-to-specific, so the last one is the most descriptive,
and a single-category slot still reads correctly ("Any Oil").

A `displayName` override field on the ingredient is a reasonable future addition; it is not needed for
the first build.

---

## Resolution: which entry gets consumed

**One slot resolves to one entry.** *(Ratified 2026-08-05.)* A slot asking for 3× `[meat]` requires
three of a *single* eligible entry, not three assembled across different meats. Selection is one choice
per slot and `consume()` stays a single `loseItem` call.

**Tools are never selected.** *(Ratified 2026-08-05.)* A categorical tool is supported and matches
identically, but tools are not consumed, so which eligible tool the party holds cannot matter.
`hasEnough()` answers the requirement in full and the selection step skips tools entirely.

### Two slots must not claim the same entry

**This is the one part of this item that is a correctness bug rather than a feature, and it must be
built with the rest — not after.**

`CraftingRecipe.canCraft()` today is `this.ingredients.every(component => component.hasEnough())`, and
each `hasEnough()` reads raw `$gameParty.numItems`. Nothing is consumed during the check, so two slots
inspecting the same stack both see the whole thing:

```
ingredients: [ { categories: ["meat"], count: 1 }, { categories: ["protein"], count: 1 } ]
party:       1x Bearcat Flank   <ingredientType:protein>  <ingredientType:meat>

slot 0 hasEnough() -> eligible [flank], 1 >= 1 -> true
slot 1 hasEnough() -> eligible [flank], 1 >= 1 -> true
canCraft()         -> true
craft()            -> loseItem(flank, 1) twice
```

`Game_Party.gainItem` clamps with `newNumber.clamp(0, this.maxItems(item))`, so the second call is a
**silent no-op**. The player pays one flank for a two-ingredient recipe, repeatably, with no error.

**This defect already exists in the id-based path** — Chef Adventure's Seeing Jambalaya lists `i93 x3`
and `i93 x2`, two slots checked independently against one pool of rice. Today that is a rare authoring
typo. With categorical slots it becomes the **normal** case, because overlapping eligibility is the
entire point of multi-tagging.

**Required: allocation, not per-slot checking.**

- `canCraft()` builds a working tally of held quantities (`Map<datum, number>`), walks the ingredients
  in order, and **decrements the tally** as each slot is satisfied. A slot that cannot be met from what
  remains fails the whole check. Greedy resolution is sufficient given one-kind-per-slot.
- The selection window filters eligible entries against **remaining quantity net of picks already made
  in this craft**, not raw `numItems`.

Fix the id-based path in the same change — it is the same defect, and leaving it means two allocation
models coexisting.

### Selection state

Selection is **session state, not recipe state.** A `CraftingRecipe` is built once at boot from config
and shared; writing a chosen entry onto its component would leak between crafts and between saves.

Hold it on `CraftingCreationSession` (`src/plugins/jafting/ext/create/__models/CraftingCreationSession.js`)
as a `Map<number, RPG_Item|RPG_Weapon|RPG_Armor>` keyed by the ingredient's index in
`recipe.ingredients`, cleared whenever the selected recipe changes.

**The session is safe to hold this.** It is not registered with `SerializableRegistry`, and only
`_recipeTrackings` / `_categoryTrackings` reach `Game_Party._j._crafting` — so a Map of live database
rows never touches a savefile. Keep it that way; persisting selections would store rows by value, which
is exactly what the refinement lineage design exists to avoid.

`CraftingComponent` therefore does **not** store the selection. `getItem()` and `consume()` need it
passed in, or the component needs a transient setter that the session drives and clears. Prefer
passing it:

```javascript
/**
 * Consumes this component, spending the given entry when this component is categorical.
 * @param {RPG_Item|RPG_Weapon|RPG_Armor|null} selected The entry chosen for a categorical slot.
 */
consume(selected = null)
```

`CraftingRecipe.craft()` then becomes:

```javascript
craft(selections = new Map())
{
  // consume all the inputs, spending whichever entry was chosen for each categorical slot.
  this.ingredients.forEach((component, index) => component.consume(selections.get(index)));
  ...
}
```

and `canCraft()` gains no parameter — `hasEnough()` answers from inventory without needing a choice.

---

## UI

### `Window_RecipeIngredientList.buildCommand`

Works unchanged **provided** `getName()`, `getIconIndex()`, `getHandledQuantity()` and `quantity()`
behave as tabled above. A categorical row renders as e.g. `Any Meat  x1  (have: 7)`.

The `have` figure is the summed count across eligible entries, which is the honest answer to "can I
make this."

### Selection step in `Scene_JaftingCreate`

After the player confirms a recipe and before the craft executes:

1. If `recipe.ingredients.every(c => !c.isCategorical())`, craft immediately — **unchanged path**.
2. Otherwise, for each categorical ingredient in order, present a list of `eligibleEntries()` filtered
   to those the party holds in `component.quantity()` or greater. Player picks one.
3. Store each pick in the session map keyed by ingredient index.
4. Cancel at any slot returns to the recipe list and clears the map.
5. After the last slot, call `recipe.craft(selections)`.

A new `Window_IngredientSelection` extending `Window_Command` — same row shape and `itemHeight` as
`Window_RecipeIngredientList`, listing entries rather than slots.

**Two gates apply to it, and the existing file is the wrong precedent to copy:**

- **`verify:no-private-before-construction`** — no `#private` fields or methods on anything
  `Window_*`. Every `Window_*` constructor runs `initialize` → `createContents`/`refresh` →
  `makeCommandList`, so a derived class's privates do not exist yet when the hook fires.
- **`verify:no-late-window-command-state`** — seed state in the **`initMembers()` hook**, which J-Base
  calls from an aliased `initialize` before the original logic refreshes. Class fields and
  post-`super()` constructor bodies are both too late.

`Window_RecipeIngredientList` seeds `this._components = []` by overriding `initialize` and assigning
*before* calling `super.initialize(rect)`. That happens to work, but it is not the prescribed hook.
**Write the new window against `initMembers()`.**

**Symbol collision.** `buildCommand` builds symbols as
`` `${component.getName()}-${this.index()}` ``. Two `[meat]` slots both label "Any Meat", and
`this.index()` is not a per-row counter during `makeCommandList`. Pre-existing, but identical labels go
from unlikely to routine once slots are categorical — key the symbol on the ingredient's array index
instead.

**This is the largest single piece of work in this item.** `Scene_JaftingCreate` is 1053 lines and the
new step sits between existing confirm and execute handlers.

---

## Salvage interaction

`JaftingSalvageLedger.rowsFromCraftingComponents(recipe.ingredients)` (line 161) builds ancestry rows by
calling `component.getItem()` and reading `datum.id`. It runs from `applyCraftRecipeOutputs`, which
`CraftingRecipe.craft()` calls **after** consuming.

Because it reads through `getItem()`, it will silently stamp the *first eligible* entry rather than the
one actually spent unless the selection reaches it.

**Required:** `applyCraftRecipeOutputs(recipe)` must accept the selections and thread them into
`rowsFromCraftingComponents`, so a dish crafted with Grim Flank records Grim Flank. Getting this wrong
does not throw — it writes a quietly wrong ancestry that only shows up much later in salvage refunds.

---

## Edge cases

| Case | Required behavior |
|---|---|
| `categories` present but empty array | Treated as absent; component is id-based |
| `categories` present alongside a valid `id` | `categories` wins; `id` ignored |
| No eligible entry held | `hasEnough()` false, recipe shows as uncraftable, selection step never reached |
| Exactly one eligible entry | Still show the selection window; do not auto-skip. Consistency beats a saved keypress, and auto-skipping makes the flow change shape based on inventory |
| Eligible entry is a dynamically-minted row (id ≥ 2001) | Works, provided the minted row inherits its base's note. The precedent and the place to do it is `src/plugins/jafting/ext/refine/database/RPG_Base.js`, which already aliases `RPG_Base._generate` to carry `jaftingRefinedCount` onto a clone. Cross-check against the finishing-touches work item |
| Categorical **tool** | Same matching, but tools are never consumed, so no selection is needed — `hasEnough()` alone. Recommend allowing it; a recipe wanting `[any pan]` is the motivating case |
| Categorical **output** | **Forbidden.** `parseRecipes` should throw on an output carrying `categories` — an output must name exactly what it produces |

---

## Work

1. `initialization.js` — add the `IngredientType` regex.
2. New `database/RPG_Base.js` in the create ext — `ingredientTypes()`.
3. `CraftingComponent` — `#categories`, `isCategorical()`, `categories()`, `eligibleEntries()`, builder
   method, and the branch in each tabled method.
4. `_pluginMetadata.js` — pass `categories ?? []` through `componentMapper`; throw on a categorical output.
5. `CraftingCreationSession` — the selections map plus clearing on recipe change.
6. **`CraftingRecipe.canCraft()` — rewrite as a tally-decrementing allocation pass** covering both
   categorical and id-based ingredients. This is the correctness fix; do not defer it.
7. `CraftingRecipe.craft(selections)` — thread selections into `consume` and into
   `applyCraftRecipeOutputs`.
8. `JaftingSalvageManager.applyCraftRecipeOutputs` / `JaftingSalvageLedger.rowsFromCraftingComponents` —
   accept and honour selections.
9. `Window_IngredientSelection` — new window.
10. `Scene_JaftingCreate` — the selection step between confirm and execute.
11. Tag the Chef Adventure ingredient database with `<ingredientType:...>`.

---

## Test plan

Existing coverage to keep green: `test/plugins/jafting/**` — 31 files, 390 tests.

New tests, mirroring source layout:

**`test/plugins/jafting/ext/create/models/crafting-component-categories.test.js`**
- `isCategorical()` true with types, false with empty array, false when absent
- `eligibleEntries()` returns only entries carrying **every** wanted type
- an entry with extra types beyond those wanted still matches
- an entry missing one wanted type does not match
- `hasEnough()` true when one entry meets count; false when the count is only met by summing two
- `getHandledQuantity()` sums across eligible entries
- `consume(selected)` calls `loseItem` with the selected entry and the component's count

**`test/plugins/jafting/ext/create/database/rpg-base-ingredient-types.test.js`**
- one tag returns one type; three tags return three
- no tag returns `[]`
- casing and the optional single space both parse

**`test/plugins/jafting/_component/create-category-recipe-direct.test.js`**
- a recipe with one categorical ingredient reports `canCraft()` true when any eligible entry is held
- `craft(selections)` consumes the selected entry and not another eligible one
- salvage ancestry records the selected entry
- a recipe mixing id-based and categorical ingredients consumes both correctly
- **two overlapping categorical slots against a single held entry report `canCraft()` false**
- **two id-based slots naming the same id report `canCraft()` false when the pool covers only one**
  (the Seeing Jambalaya shape)
- three slots where a greedy walk succeeds only in the authored order still resolve
- the selection window's eligible list for slot 1 excludes quantity already claimed by slot 0

**`test/plugins/jafting/ext/create/models/crafting-component-categories.test.js`** — add
- `getHandledQuantity()` returns the largest single eligible count, **not** the sum

**`test/plugins/jafting/ext/create/_metadata/plugin-commands.test.js`** — extend
- `parseRecipes` builds a categorical component from `categories`
- `parseRecipes` builds an id component when `categories` is absent
- `parseRecipes` throws on an output carrying `categories`

Verification: `bun run hotfix` must be green, including `verify:docs` for every new JSDoc.

## Notes

- Nothing here touches J-JAFTING-Refinement. This item is independently shippable.
- The finishing-touches work item depends on minted rows inheriting notes; that dependency runs the
  other way and is recorded there.
