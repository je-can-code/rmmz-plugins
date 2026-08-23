# Filterable list centralization

> **Shipped in rmmz-plugins#74** (2026-08-20), consumed by ca#63. `FilterCycle`, `Window_FilterStrip`
> and `Window_FilterableList` live in `_base/core/`; `Window_SdpList`, `Window_RecipeList` and
> `Window_StudyRecipeList` all extend the base, and both duplicate strip windows
> (`Window_SdpFamilyStrip`, `Window_CreationCategoryBadge`) are gone. Of the four items under
> [Open](#open), two settled themselves during execution; the remaining pair are `ca`-side authoring
> calls that never blocked the code — see the note there.

Extract the "list with a cycling category filter and an actionable-only toggle" pattern into J-Base, and
put SDP, crafting creation, and the study shop on top of it. Along the way the crafting scene loses its
category drill-down in favour of L2/R2 tab cycling.

Resolved with Jeremy 2026-08-16.

---

## Why this exists

The pattern is already written **three times**, and its chrome **twice**:

| Duplicate | Where |
|---|---|
| `Window_SdpList` | `sdp/core/windows/` — family filter + hide-maxed toggle + comparator |
| `Window_RecipeList` | `jafting/ext/create/windows/` — category filter, no comparator |
| `Window_StudyRecipeList` | `jafting/ext/create/windows/` — category filter + known/unknown partition |
| `Window_SdpFamilyStrip` | `sdp/core/windows/` — "thin strip showing the active family filter" |
| `Window_CreationCategoryBadge` | `jafting/ext/create/windows/` — "active crafting category icon + name" |

The two strip windows are the same window with different names. All three lists extend `Window_Command`
and are the same shape: **source → filter → sort → build commands.**

Every one of the three carries its own copy of the `initMembers` comment explaining why the filter key
cannot be a class field, which is a good sign the knowledge wants one home.

**And the scene-side cycle is written twice, independently.** `Scene_SDP.cycleFamilyFilters` and
`Scene_JaftingStudy.stepCategoryBy` are the same wrap-around-and-repoint-every-window logic, arrived at
separately. `Scene_JaftingStudy` already binds `content-prev` / `content-next` and has no category list at
all — **it is already the design this plan proposes**, which makes it a second reference rather than a
cheap third migration. Reconciling the two is where the real work is; see hole #7.

### The J-Base mechanism is proven, not assumed

Cross-ship `extends` of a `_base`-defined class is established in eight places across six ships —
`Window_ActorRibbon` (sks, cms, apt, passive, sdp), `Window_MoreData` (cms), `Scene_MenuFacetBase` (abs
ally-ai, abs loadout). Two ships also instantiate `Window_ControlLegend` directly
(`Scene_JaftingCreate:386`, `cms Scene_Menu:283`). Extending at class-definition time across ships works
and is normal here. `_base/core/models/` exists.

---

## Where it must live, and why there is no choice

`verify:ships` fails the build on **both** a cross-plugin source import and any non-`_base` file importing
from `_base/`. So a shared class cannot be imported by either consumer. The only mechanism is J-Base's
globally hoisted top-level bindings.

Precedent, already in the tree: `Scene_JaftingCreate` uses `Window_ControlLegend` — defined in
`_base/core/windows/` — with no import at all. Every one of its `import` lines is same-ship (`./`, `../`).
Do exactly that.

**Consequence for placement:** `vitest.config.js` excludes `windows/**` from coverage. Anything with logic
in it must therefore live in `managers/` or `models/`, not in a window, or it is untestable by policy and
lands on the wrong side of the "views are dumb" rule.

**Inside J-Base, ordinary relative imports are correct and expected.** The `verify:ships` rule bans
*non*-`_base` files importing from `_base/`; J-Base importing itself is normal and everywhere —
`Window_ControlLegend` opens with `import InputLegendResolver from './../managers/InputLegendResolver.js'`,
and `Window_Command` imports `./../models/BuiltWindowCommand.js`. So `Window_FilterableList` imports
`./../models/FilterCycle.js` exactly like its neighbours, and no TDZ question arises: the ESM import is the
dependency edge, and `entry.js` already lists `models/` before `managers/` before `windows/` anyway.

---

## Holes found while rooting through the code

These are the things that will bite whoever builds this. They are the reason this document exists.

### 1. The two consumers filter in different places

`Window_RecipeList` filters the **source** and then maps:

```javascript
const categoryRecipes = recipes.filter(recipe => recipe.categoryKeys.includes(currentCategory));
const commands = categoryRecipes.map(this.buildCommand, this);
```

`Window_SdpList` maps **first** and filters by having `makeCommand` return `null`:

```javascript
if (isMaxRank && this.usingNoMaxPanelsFilter()) return null;
if (SdpFamilyFilter.panelMatchesFilter(panel, this.familyFilterKey) === false) return null;
```

...then discards them with `.filter(command => command !== null)`.

**Settle it on filtering the source.** It is the cheaper of the two (no command is built for a row that is
about to be thrown away), it is the only one that lets a comparator run over a known-good list, and it
deletes a null contract that should not exist.

### 2. That null filter violates a standing rule

`.filter(command => command !== null)` is precisely the shape CLAUDE.md forbids — a guard against a null
that only arrives because the same file chose to produce it. Moving the filter to the source removes the
cause rather than the symptom, so this is a deletion, not an exemption.

### 3. BUG: SDP's "hide maxed" toggle never refreshes the list

Traced end to end:

- `Window_SdpList.toggleNoMaxPanelsFilter()` flips the boolean and **does not** call `refresh()`.
- `Scene_SDP.onFilterPanels()` calls that, then `onPanelHoveredChange()`, then `clampSdpListSelection()`.
- `onPanelHoveredChange()` refreshes the header, mastery, parameter list, reward list and cart — **never
  the panel list**.
- `clampSdpListSelection()` only reads `commandList().length` and calls `select`/`deselect`.
- J-Base's `Window_Command.prototype.commandList()` returns `this._list` directly; nothing rebuilds on read.
- `Scene_SDP` does not override `update()`.

So pressing the toggle changes nothing on screen until some *other* action refreshes the list — cycling the
family filter does, because `setFamilyFilterKey()` **does** call `refresh()`. The asymmetry between the two
setters is the bug.

Nothing in `test/` references `toggleNoMaxPanelsFilter`, `usingNoMaxPanelsFilter` or `onFilterPanels`, which
is why it survived.

**The migration fixes this structurally** — the base's toggle setter refreshes exactly like its filter-key
setter — but write the failing test first so the fix is proven rather than assumed.

### 4. Cycle state lives in scene state, so it cannot be tested or shared

`Scene_SDP` keeps the cycle in `this.j()._sdp._familyFilterCycle` and `._familyFilterIndex`, and manipulates
them inline across `rebuildFamilyFilterCycle`, `getActiveFamilyFilterKey` and `cycleFamilyFilters`. That is
the logic worth centralizing and it currently sits in a scene, where coverage does not reach it.

Lift it into a model. The scene should hold one object and ask it questions.

### 5. `clampSdpListSelection` is essential and completely non-obvious

After a filter change the selection can be out of bounds, and — the subtle half — after a filter that
matched nothing the index is `-1`, so the *next* non-empty filter must re-select or the player is left with
a populated list and no cursor. `Scene_SDP` handles both. Crafting has no equivalent because it never
re-filters in place, and whoever converts it will not think of this.

It belongs in the base, called on every filter or toggle change.

### 6. Cycling with one position buzzes

`cycleFamilyFilters` plays a buzzer and re-activates when `cycle.length <= 1`. Preserve it; it is the only
feedback that the cycle is not broken, just short.

### 7. THE BIG ONE: the two references disagree about empty positions, and both are deliberate

`SdpFamilyFilter.buildCycleForActor` **excludes** families the actor has no unlocked panels in. An empty
tab is unrepresentable.

`Scene_JaftingStudy.stepCategoryBy` **deliberately includes them**, and says why in the source:

> Categories with nothing for sale are stepped onto rather than skipped. A shoulder button that sometimes
> moves one place and sometimes three reads as broken, and an empty shelf is information — it says to come
> back later rather than that nothing exists.

Both positions are reasoned and neither is wrong. The SDP argument is that a filter over your own panels
should never present a dead end; the study argument is that a *vendor's* empty shelf is a fact about the
world worth showing, and that variable-step shoulder buttons feel broken.

**So this is policy, not mechanism.** `FilterCycle` must accept whatever positions it is handed and have no
opinion about emptiness. Each ship decides at cycle-build time. Writing "present members only" into the base
— which an earlier draft of this plan did — would silently delete a documented design decision.

**RESOLVED 2026-08-16.** The base stays policy-free, so both existing behaviours survive untouched: SDP goes
on handing over only non-empty families, the study shop goes on handing over all of them.

**Crafting creation steps onto empty lanes**, matching the study shop. The shoulder button always moves
exactly one place, and an empty Dairy tab reads as "go learn some dairy recipes" — which is the same claim
`recipe-system.md` already makes when it says an unmakeable cuisine is a goal rather than a disappointment.
Early game nearly every lane is empty, so the behaviour is loudest exactly when it carries the most
information.

Relevant data: `material-mastery` is unlocked by two stations (Alchemy, Survival) and has **zero** recipes;
`survive-extra` (Accessorizing) has zero recipes and is unlocked by no station at all.
`CraftingCategory.hasAnyRecipes()` already exists — `Window_CategoryList` uses it for `setEnabled` — and
remains useful for styling even though it no longer gates the cycle.

### 7b. The two references also disagree about selection and sound

Same seam, smaller stakes, and equally easy to flatten by accident:

| | `Scene_SDP` | `Scene_JaftingStudy` |
|---|---|---|
| after a filter change | `clampSdpListSelection()` — keep the row if still valid, re-select after an empty filter | `recipeListWindow.select(0)` — always jump to the top |
| feedback | `playBuzzer()` when the cycle is too short to move | `playCursor()` on every successful step |

**RESOLVED 2026-08-16.** **Clamping is the base default**, and `select(0)` becomes an override the study
shop may keep if its simpler feel is preferred there. Clamping is strictly more careful: it handles the
`-1`-after-an-empty-filter case that `select(0)` does not consider at all, and it preserves the player's
place when comparing rows inside one family.

The sound was never a conflict. `playBuzzer()` fires when the cycle **cannot** move (fewer than two
positions); `playCursor()` fires when it **does** move. Those are different events and the base does both.

### 8. The `no-late-window-command-state` gate applies to the base itself

`Window_Command.initialize` ends by refreshing, which calls `makeCommandList`, before subclass fields or
constructor bodies have run. The base **must** seed both the filter key and the toggle in `initMembers`. All
three existing lists already do this and each explains it in a comment; the base inherits the obligation and
should carry that explanation once, for all of them.

### 9. Crafting has no comparator

`Window_RecipeList` renders recipes in config order. SDP sorts by family → subgroup → tier. The base needs a
`compareItems` hook with a stable no-op default so crafting can adopt the base without inventing an order in
the same change.

### 10. The study shop's sort is a partition, not a comparator

`Window_StudyRecipeList` splits into `unknown` then `known` (per the doc ruling that known recipes sort to
the bottom greyed out rather than vanishing). That expresses fine as a comparator, but check it during
migration rather than assuming — it is the one of the three whose ordering carries a design decision.

### 10b. The category description loses its reader — and the study shop already shows the fix

`Window_CategoryList.buildCommand` does `.setHelpText(category.description)`, and
`Scene_JaftingCreate.onCategoryListIndexChange` pushes `currentHelpText()` into
`Window_CreationDescription`. That is the only path by which `CraftingCategory.description` — "Cooking of
the finest calibur…" — ever reaches the screen. Delete the category list and the field has no reader,
because the strip is icon and name only.

`Scene_JaftingStudy` already answers this: its `onStudyIndexChange` "repoints the price tag and the
description at whatever is now highlighted", so the description follows the **highlighted row**, not the
category. Do the same in creation. The category description then either moves onto the strip or becomes
genuinely dead data — decide, do not drift.

### 10c. A dead pass-through in SDP's command loop

```javascript
const command = this.makeCommand(panel);
if (!command) return null;
return command;
```

Returns `command` when truthy and `null` when falsy — which is what `return command` already does. It
disappears with the rest of the null handling in hole #1. Note also that `makeCommand` destructures `panel`
immediately, so a `panelsMap` miss would **throw**, not return null — while `buildCycleForActor` guards the
same miss with `if (!panel) return`. That asymmetry should be resolved once, in `sourceItems()`, by mapping
rankings to panels there.

### 11. Killing the drill-down collapses a session phase

`CraftingCreationSession` is a state machine whose `Phase` includes `BrowsingCategories` and
`BrowsingRecipes`, with `#categoryKey` set by `enterRecipeBrowsing(categoryKey)` and cleared on the way back.
With no category step, `BrowsingCategories` has no meaning: the session opens in `BrowsingRecipes` and the
filter key is view state, not session state.

Decide deliberately whether `#categoryKey` survives at all. It is currently *session* state used as *view*
state, and the filter cycle is the better owner.

### 12. Input semantics are already generic — do not invent new ones

J-Base's `Window_Selectable` already exposes the semantic handlers, and `InputLegendResolver` maps them to
physical buttons and legend labels:

- `content-next` / `content-prev` — L2/R2, already bound to cycling in `Scene_SDP`
- `context` — already bound to the hide-maxed toggle, legend label `'hide maxed'`

The base binds these. Each ship supplies its own legend label (`'hide maxed'`, `'craftable only'`).

---

## The design

Three pieces in J-Base. Mechanism only; every judgement stays in the ship.

### `_base/core/models/FilterCycle.js`

Owns the ordered positions and the current index. No rendering, no window, no scene state.

- a **position** is `{ key, name, iconIndex }`
- `ALL` and `UNKNOWN` are reserved keys
- `setPositions(positions)` — rebuilds, **preserving the active key when it survives** (today's
  `cycle.indexOf(previousKey)` behaviour), else falls back to index 0
- `next()` / `previous()` — wrap with `(i + delta + len) % len`
- `activeKey()` / `activePosition()`
- `canCycle()` — false when there are fewer than two positions, so the scene knows to buzz

**It has no opinion about empty positions** (hole #7). It cycles what it was handed. The ship decides what
to hand it, and that decision is the difference between SDP's behaviour and the study shop's.

Fully unit-testable, and it is where the coverage lives.

### `_base/core/windows/Window_FilterStrip.js`

Renders the active position's icon and name. Replaces `Window_SdpFamilyStrip` and
`Window_CreationCategoryBadge` outright. Dumb: `setPosition(position)` and a `refresh`.

### `_base/core/windows/Window_FilterableList.js`

Extends `Window_Command`. Owns the orchestration and nothing else.

State, **seeded in `initMembers`**:

- `_filterKey` — defaults to `FilterCycle.ALL`
- `_actionableOnly` — defaults to `false`

Surface, following the repo's boolean naming convention:

- `setFilterKey(key)` — no-op when unchanged, otherwise refresh
- `filterKey()`
- `isActionableOnly()` / `toggleActionableOnly()` — **refreshes**, unlike today's SDP toggle

`makeCommandList` is the orchestrator and is not overridden by ships:

```
clearCommandList()
sourceItems()
  .filter(item => this.matchesFilter(item, this.filterKey()))
  .filter(item => this.isActionableOnly() === false || this.isActionable(item))
  .sort(this.compareItems.bind(this))
  .map(this.buildCommand, this)
  .forEach(this.addBuiltCommand, this)
```

Ship hooks:

| Hook | Meaning | Default |
|---|---|---|
| `sourceItems()` | the unfiltered domain list | `[]` |
| `matchesFilter(item, key)` | does this row belong to the active tab | `true` |
| `isActionable(item)` | can the player still *do* something with this row | `true` |
| `compareItems(a, b)` | ordering | `0` |
| `buildCommand(item)` | the `BuiltWindowCommand` | must be implemented |

**Who owns which method name**, because two of these already exist with different contracts and a silent
override is the easy failure here:

| Name | Owner | Note |
|---|---|---|
| `makeCommandList()` | **base** | ships must not override it; that is the whole point |
| `buildCommands()` | **base** (private to the pipeline) | `Window_RecipeList` and `Window_CategoryList` each have one today — both are absorbed |
| `buildCommand(item)` | **ship** | already the right name and contract in `Window_RecipeList` / `Window_CategoryList` |
| `makeCommand(panel)` | — | SDP's singular builder. **Rename to `buildCommand` in step 4** so all three ships agree |

A `compareItems` returning `0` is safe to leave in the pipeline rather than special-casing the sort:
`Array.prototype.sort` has been specified stable since ES2019, so a no-op comparator preserves source order
exactly. That is what lets crafting adopt the base **without** its recipe order changing in the same commit
that re-parents it (hole #9).

`isActionable` must read as "still rankable" for SDP and "craftable right now" for crafting, and every
future consumer implements it.

### Scene-side helper

The cycle-to-view wiring is identical everywhere and must not be copied a third time:

1. `cycle.next()` / `previous()`, or buzz + re-activate when `canCycle()` is false
2. push `activePosition()` into the strip
3. push `activeKey()` into the list
4. clamp the selection (bounds **and** the `-1`-after-empty case)
5. fire a "hovered row changed" hook for the scene's detail panes

Put steps 2-5 behind one method the scenes call. Whether that is a `Scene_Base` mixin in J-Base or a small
manager is an implementation choice; what matters is that `clampSelection` has exactly one definition.

**The helper owns what to do with positions, never where they come from.** `Scene_SDP` builds its cycle from
the menu actor's unlocked panels; `Scene_JaftingStudy` builds its from `$gameParty.getUnlockedCategories()`;
crafting creation will build its from the categories the calling station unlocked. Those three have nothing
in common and must not be generalized — the ship hands `setPositions()` a finished array and the helper
takes it from there. This is the same boundary as hole #7, one level up.

---

## Order of work

Holes #7 and #7b are resolved, so this is unblocked and can be worked start to finish.

**Steps 1-4 landed 2026-08-16.** `bun run hotfix` green, 14,325 tests. `FilterCycle` is at 100% on all four
coverage metrics and 90% mutation score; its one survivor — forcing the `total === 0` guard in `#step` to
false — is equivalent by design, because `activePosition()` already answers `EMPTY_POSITION` for an empty
ring, so the poisoned index is never read. Steps 5 and 6 remain.

**SDP first.** It is the richer reference (comparator, toggle, `ALL`/`UNKNOWN`, buzz, clamp), so a wrong
abstraction fails loudly against known-good behaviour. The study shop is **not** a cheap third — it is the
second reference, and it is where the disagreements surface.

1. **Write the failing test for hole #3** — toggling actionable-only rebuilds the command list. It fails on
   today's SDP.
2. `FilterCycle` + its unit tests.
3. `Window_FilterStrip`, `Window_FilterableList` in `_base`. Reachable from `_base/core/entry.js`.
4. **Migrate SDP.** `Window_SdpList extends Window_FilterableList`; rename `makeCommand` → `buildCommand`;
   move its two `return null` guards into `matchesFilter` / `isActionable`; move rankings→panels into
   `sourceItems()` and guard the `panelsMap` miss there; delete `.filter(command => command !== null)` and
   the dead pass-through; `SdpFamilyFilter` keeps predicate, comparator and cycle-builder and loses the rest;
   `Scene_SDP` drops its inline cycle state for a `FilterCycle`; delete `Window_SdpFamilyStrip`. The step-1
   test now passes.
5. **Migrate the study shop — second, not last.** `Window_StudyRecipeList extends Window_FilterableList`,
   known/unknown partition as the comparator, `Scene_JaftingStudy`'s `stepCategoryBy` / `refreshCategory` /
   `_categoryIndex` replaced by the shared cycle, `Window_CreationCategoryBadge` → `Window_FilterStrip`.
   **This is the step that proves the abstraction**, because it is the one with a conflicting policy — but
   only for *behaviour*. Its position source (`$gameParty.getUnlockedCategories()`) is deliberately not
   shared; do not try to generalize it. If the behaviour needs a special case, that special case is the
   base's real shape.
6. **Migrate crafting creation.** `Window_RecipeList extends Window_FilterableList` with a `craftable`
   predicate for `isActionable`. Delete `Window_CategoryList`, `onCategoryListSelection` and the category
   rectangle; collapse `CraftingCreationSession.Phase.BrowsingCategories`; point `Window_CreationDescription`
   at the highlighted recipe the way the study scene already does (hole #10b); re-layout the reclaimed width
   onto the ingredient / tool / output panes; legend label `'craftable only'`.
7. `bun run hotfix`, and confirm coverage did not drop — `FilterCycle` is in `models/`, so it is measured.

---

## Verification

- `bun run hotfix` green — this is the gate, and it runs the suite.
- Coverage still 100% on measured files. The windows are excluded; `FilterCycle` is not, and it is where the
  logic went on purpose.
- `verify:ships` proves no cross-ship import crept in — the whole design depends on hoisted globals.
- `verify:no-late-window-command-state` proves the base seeds its filter state early enough.
- Scene/window wiring belongs in `test/setup/rmmz-view-harness.js`; read
  `docs/testing-scenes-and-windows.md` first, the load order is unforgiving.
- Worth a mutation pass on `FilterCycle` — wrap-around, preserve-key-on-rebuild and the `canCycle` boundary
  are exactly the branches a coverage-only suite will execute without constraining.

---

## Open

Nothing here blocks. Each is decidable at the point the code reaches it.

**Status at close.** None of these gated the engineering, and two settled themselves during execution.
The remaining pair are authoring calls in the `ca` repo, not plugin work — they did not justify holding
this item open, and they are recorded here so the reasoning is findable rather than rediscovered.

- **What `ALL` sorts by** in crafting. Unsorted `ALL` over a large learned roster is worse than tabs;
  craftable-first is the obvious answer and reuses the predicate `isActionable` already provides. Decide when
  the scrap economy shows how fast the roster grows. **Still open.**
- **Whether `#categoryKey` survives** on `CraftingCreationSession` once the phase collapses. **Settled: it
  did not.** Nothing in `jafting/ext/create` carries it any more; `categoryKeys` on the recipe is the only
  surviving spelling.
- **Where `CraftingCategory.description` goes** once the category list dies (hole #10b) — onto the strip, or
  retired. **Settled by #10b's own fix:** the description follows the highlighted recipe, the way the study
  scene already did it.
- **The two dead categories** (`material-mastery`, `survive-extra`) — real data with no purpose, worth a
  decision of their own now that the cycle no longer hides them. **Still open**, and now visible in-game:
  both still sit in `ca/chef-adventure/data/config.crafting.json`.

### Decided without asking

- **Names** — `FilterCycle`, `Window_FilterStrip`, `Window_FilterableList`, `isActionable`. Jeremy delegated
  naming 2026-08-16.
- **Both sounds ship** — buzzer on a cycle that cannot move, cursor tick on one that does. See #7b.
