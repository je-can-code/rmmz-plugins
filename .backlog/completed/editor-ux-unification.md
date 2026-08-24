# Editor: UX / UI unification (design system + board layout pass)

## Source

- All nine boards under `jmz-data-editor/app/src/presentation/boards/`:
  - `_index/IndexBoard.tsx` (WIP placeholder today)
  - `enemies/EnemiesBoard.tsx`
  - `skills/SkillsBoard.tsx`
  - `states/StatesBoard.tsx`
  - `sdp/SdpBoard.tsx`
  - `quests/QuestBoard.tsx`
  - `crafting/CraftingBoard.tsx`
  - `proficiency/ProficiencyBoard.tsx`
  - `jabs/JabsConfigBoard.tsx` (+ `JabsTeamsTab.tsx`, `JabsJuiceTab.tsx`)
- App-bar buttons (currently per-board labels): `app/src/components/core/SaveButton.tsx`, `app/src/components/core/ReloadButton.tsx`.
- Existing shared building blocks worth keeping / formalizing:
  - `app/src/presentation/components/board/EditorBoardSplitLayout.tsx` (sidebar + content split — solid)
  - `app/src/presentation/components/board/VirtualizedSidebarList.tsx` (virtualized list with search + icon row — solid)
  - `app/src/presentation/components/icons/IconIndexField.tsx`
  - `app/src/presentation/components/traits/TraitEditor.tsx`
  - `app/src/presentation/components/usableItem/UsableEffectsEditor.tsx`
- Reference pattern that already works and should be templated: the **Crafting board's card-per-group layout** (`Ingredients`, `Tools`, `Outputs` as bordered cards with a header strip). This is the visual rhythm every other board should converge toward.

## Context

The editor has grown organically — every board picked the layout pattern that fit the immediate data set, and the result is **nine boards that read like nine different apps**. The bones are good (side rail nav is the right choice for a database-style editor; virtualized sidebar lists work; the JABS AI trait chip row, the formula hint suffixes on enemy params, the recipe / quest / SDP sidebar group dividers are all genuinely good); the gaps are about **shared vocabulary**, not fundamental architecture.

Cross-board issues observed from a sweep of all nine screens:

- **Floating decorative section headers** (large cyan titles like `Base Parameters`, `JABS Battler Data`, `Extra Drops`, `JABS Teams`) do the *job* of grouping content but without an actual container, so the eye has to invent the boundaries. They also all read at the same visual weight, which makes a board with three logical groups *look* like a board with seven equally-important things.
- **Accordion-soup on data-heavy boards**: the States editor tab has **19 accordions** in a 2-column grid, mostly plugin-driven (Regen & DoT, Critical damage, Drops & gold, Elements, Level, Skill proficiency, HP cost reduction, SDP multiplier, Passive Affixes, Skill slots, Aggro Generation, Walk speed, Gap close, Shield, Cast & cooldown, Stacking & reapply). Vanilla MZ work has to scroll past all of it. Skills has 11 accordions in the Editor tab alone with the same problem in miniature.
- **Three-column content layouts** with no clear "primary → secondary → metadata" flow (Enemies, SDP). Fields land in whichever column had room rather than by relatedness.
- **Per-board save/reload labels**: `SAVE ENEMY DATA`, `SAVE SKILLS DATA`, `SAVE STATES DATA`, `SAVE PROFICIENCIES`, `SAVE QUESTS`, `SAVE SDP`, `SAVE RECIPES`, `SAVE JABS`. The board name is already in the rail; the labels repeat it inconsistently and break muscle memory.
- **Empty vertical real estate** on lighter boards (Proficiency, JABS) sits unused at the bottom while denser boards (Enemies, Skills, States) feel cramped up top.
- **Color usage** has no system: cyan for structural headers, but also cyan-ish blues/greens/pinks/golds for chips, buttons, status accents, and decorative titles — so saturation doesn't mean "this is meaningful", it just means "I'm here."
- **Index board is unused real estate** (literally `"this is the index- WIP"`).

The two boards already pointing the way:

- **Crafting** uses bordered cards with explicit header bars (`Ingredients`, `Tools`, `Outputs`). The cards group related content, the layout reads at a glance, and the three-column choice there is justified because each column is a different conceptual stage of a recipe. **This is the template.**
- **JABS** uses horizontal sub-tabs (`Teams`, `Juice`) to scope dense form areas — the correct move for that board's structure, and a pattern the States board should adopt for the Vanilla / Plugin split.

## Severity

**Medium** — no data correctness issues; nothing breaks. But authoring friction compounds: each new board that ships in the current pattern (Weapons / Armors / Items per the `editor-*-board.md` backlog trio) bakes in another N variants of the inconsistency unless this lands first or in parallel.

## Gain

**High and broad**: a single visual vocabulary across nine boards (twelve, once weapons/armors/items land) makes the editor feel like one app, cuts cognitive load when context-switching between databases, and gives every future plugin-extension panel a recipe to follow. The `<BoardSectionCard>` work alone is probably the single largest perceived-quality win available; the rest compounds on top of it.

## Work

Phased; each phase is independently shippable and each phase 2 sub-task can ship board-by-board.

### Phase 1 — Design system foundations (do once, used everywhere)

Build the shared vocabulary before migrating any board.

- **`<BoardSectionCard>` component** (`app/src/presentation/components/board/BoardSectionCard.tsx`).
  - Props: `title: string`, `subtitle?: string`, `actions?: ReactNode` (optional right-aligned action slot for "Manage X" buttons etc.), `collapsible?: boolean`, `defaultExpanded?: boolean`, `density?: 'comfortable' | 'compact'`, `accent?: 'neutral' | 'primary' | 'jabs' | 'plugin'` (semantic, maps to one accent color each — see theme work below).
  - Renders MUI `Paper` with a bordered header strip + content area. Same visual rhythm as the existing Crafting cards.
  - When `collapsible` is `true`, the header strip carries an `ExpandMore` toggle; otherwise no toggle (flat card).
  - Replaces the floating cyan `<Typography variant="h…">` section titles everywhere.
- **`<BoardAppBar>` / standardized app-bar action slot**.
  - Normalize the per-board labels: just `Save` and `Reload` — drop the board-name suffix entirely. The active board is already named in the side rail.
  - Single component owns positioning + responsiveness so individual boards don't each re-implement the absolute-positioned floating buttons.
  - Make space for one optional **`<BoardSelectionBreadcrumb>`** slot showing the currently-selected entity (`Skills > 7: Primal Carve`, `SDP > ENC_9: Master of Sorcery`). High-value for context awareness when scrolling deep in a dense board.
  - `Reload Project` lives in the same bar but visually grouped with the project-path display (different concept; should not read as a sibling of `Save` / `Reload`).
- **Theme tokens / accent discipline** (`app/src/presentation/theme/` or whatever the existing theme module is).
  - Pick **one** accent for structural elements (card headers, tab indicators, dividers) — the current cyan is fine, just commit to it being the *only* place it appears.
  - Reserve a palette of saturated colors **only** for status / semantic chips (success / warn / danger / info / JABS-AI-role). Document the mapping in a small `theme-tokens.md` so future panels don't recolor things arbitrarily.
  - Keep the existing JABS AI trait chip colors as-is — they're working.
- **`<BoardEmptyState>` component**.
  - Shared "no entity selected" + "no entities exist yet, click to add one" placeholder. Used by every board's main content area when the sidebar selection is null and by the Index board.

### Phase 2 — Per-board migration (depends on Phase 1)

Ordered roughly by pain × impact. Each sub-task is independently shippable — they share no migration coupling once the components from Phase 1 exist.

#### Tier A — biggest wins

- **States board** (`StatesBoard.tsx`).
  - **Add a sub-tab split inside the `Editor` main tab**: `Vanilla MZ` and `Plugin extensions`. Same horizontal tab pattern the JABS board already uses.
  - `Vanilla MZ` sub-tab: `General`, `Details`, `Messages`, `Removal Conditions`, `State duration`, `Traits` — six flat cards, no accordions.
  - `Plugin extensions` sub-tab: the remaining 13 accordions, regrouped into themed cards with internal accordions where they really are independently togglable: e.g. a `Damage over time` card containing Regen & DoT + Critical damage + Elements; a `Combat behaviour` card containing Aggro Generation + Walk speed + Gap close + Shield + Cast & cooldown + Stacking & reapply; a `Costs & rewards` card containing HP cost reduction + Skill proficiency + SDP multiplier + Drops & gold + Level; a `Skill plumbing` card containing Skill slots + Passive Affixes.
  - Final card count target: ~6 vanilla cards + ~4 plugin cards (each with internal accordions), down from 19 floating accordions.
- **Skills board** (`SkillsBoard.tsx`).
  - Collapse the 11 Editor-tab accordions into ~6 `<BoardSectionCard>`s with logical groupings:
    - `Identity & Usage` (General + Usage merged).
    - `Execution` (Execution + Additional Hits merged).
    - `Damage & Effects` (Damage + Effects merged; this is where the `editor-items-board.md` extraction lands too — same card on both boards).
    - `Resources` (resources / costs / gains).
    - `Skill relationships` (Skill extend + Skill slots merged).
    - `Messages`.
  - Mark the always-relevant cards as flat (no collapse); only put the genuinely-optional sections (Messages, Skill relationships) behind a collapsed default.
  - The `JABS` tab gets the same treatment in parallel — currently ~5× denser per Jeremy's note. Probably another `<BoardSectionCard>` pass with logical regrouping; scope that as a sub-task once the Editor tab is migrated and the card vocabulary is settled.
- **Enemies board** (`EnemiesBoard.tsx`).
  - Drop from 3 columns to 2 columns. Cards stack vertically inside each column.
  - Left column cards: `Identity` (name + level + exp + gold + SDPs), `Base parameters` (the stat row including MaxTP + the `MANAGE GROWTHS` action in the card's `actions` slot), `JABS AI traits` and `JABS battler roles` (the two chip rows that exist post-data-completeness work; just wrap each in its own card).
  - Right column cards: `JABS battler data` (basic params + alert params consolidated; team + behaviour + passive affixes can stay as inner accordions inside this card), `Traits`, `Drops & SDP` (Enable SDP Drop + SDP picker + drop chance + Extra Drops list, all in one card — these are the same concept).

#### Tier B — medium

- **SDP board** (`SdpBoard.tsx`).
  - Top strip → `Identity` card (key, name, icon, locked-by-default flag, tier picker, flavor text, description).
  - `Cost math` card (max rank, base offset, flat offset, mult scale, total cost to master, `COST PER LEVEL PROJECTIONS` button in the actions slot).
  - `Rank effects` card containing the per-rank effect list + the is-core / flat-growth / per-rank fields + **the Rank Rewards detail panel inline** (currently it floats on the right and reads disconnected from the effect it modifies).
- **Quests board** (`QuestBoard.tsx`).
  - `Quest header` card (key + name + category + level + tags + category/tag editor IconButtons in `actions`).
  - `Description` card (Unknown Hint + Overview).
  - `Objectives` card containing the objective id list on its left edge and the selected-objective detail (type, hidden/required toggles, description, fulfillment data, state logs) filling the rest.
- **Proficiency board** (`ProficiencyBoard.tsx`).
  - `Conditional` card at the top (key + applicable actors + skill rewards picker + earned-skill chips).
  - `Javascript rewards` card (the textarea, taking its own card so it doesn't visually compete with the actor list).
  - `Requirements` card containing the requirement list on its left edge and the selected-requirement detail (proficiency value + primary skill + secondary skills) filling the rest.
  - Use the freed bottom space for a small `Conditional summary` widget — read-only chip strip showing "n requirements, m secondary skills, k rewards, applies to p actors" so the user can sanity-check the whole conditional without scrolling.
- **JABS board** (`JabsConfigBoard.tsx`).
  - Drop the big floating `JABS Teams` header inside `JabsTeamsTab.tsx` (replaced by the card's own title).
  - Wrap the team editor form in a `<BoardSectionCard title="Team">` so it occupies space deliberately instead of floating.
  - The `Juice` tab already uses accordions per `JuiceConfig` sub-section; migrate those to `<BoardSectionCard collapsible>` so the visual rhythm matches the rest of the editor.

#### Tier C — polish only

- **Crafting board** (`CraftingBoard.tsx`).
  - Already correct in spirit. Migrate the existing `Ingredients` / `Tools` / `Outputs` cards to the shared `<BoardSectionCard>` component so the visual treatment matches every other board exactly.
  - Wrap the top strip (key + name + level + unlocked-by-default + masked-until-crafted + Modify Categories button + category picker) in a single `<BoardSectionCard title="Recipe">` card.

### Phase 3 — Index dashboard (`IndexBoard.tsx`)

Currently shows the literal string `"this is the index- WIP"`. Once Phases 1–2 give us a card vocabulary, turn it into a real landing surface:

- `Project` card: project path, last saved / reload generation, button to switch project, RMMZ project name from `System.json`.
- `Database totals` card: a `<BoardSectionCard>` grid showing one tile per board (`X enemies`, `Y skills`, `Z states`, `N recipes`, `M quests`, …) where each tile is a quick link to the relevant board.
- `Recently edited` card: list of the last few edited entries across all boards (driven by a tiny in-app touch-history map persisted to local storage), each row click → deep link to that entry.
- `Health / lints` card (optional, ship later): editor-side warnings such as "12 enemies have iconIndex of -1", "3 skills have empty damage formulas", "2 quests reference a missing category key". Read-only flags; the user fixes them on the relevant board.

### Phase 4 — Polish / QA pass

After all per-board migrations:

- Spacing audit: pick a consistent card-padding scale and verify every board honors it.
- Typography audit: identify how many distinct text styles are in use across boards and collapse to ~4 (page title, card title, field label, helper / monospace formula).
- Dark theme sanity check on every board (the only theme today — but verify nothing relies on absolute colors that won't survive a future light theme).
- Verify no per-board `position: absolute` floats survived (they should all be `<BoardAppBar>`-owned now).

## Acceptance criteria

- Every board uses `<BoardSectionCard>` for every logical group. No remaining free-floating cyan `<Typography variant="h…">` section headers in `app/src/presentation/boards/`.
- Every board's app-bar reads exactly `Save` / `Reload` (and the project-path block carries `Reload Project`). Grep `extraSaveText=` / `extraReloadText=` returns zero matches in the boards directory.
- States `Editor` tab visibly splits Vanilla / Plugin sub-tabs.
- Skills `Editor` tab visibly drops from 11 accordions to ≤ 6 cards.
- Enemies board is 2-column, with the drops + SDP fields in a single card together.
- Index board renders at least the `Project` and `Database totals` cards (Recently edited / Health are optional for the first cut).
- A new component-level test suite for `<BoardSectionCard>` covers expand/collapse, the `actions` slot, density variants, and accent variants.
- Snapshot or render-smoke test per board that the board mounts under the new components without throwing.

## Out of scope (this item)

- **No new editor functionality.** This is a pure layout / vocabulary refactor. Every field that exists today still exists in the same place semantically, just reframed inside cards. New fields land via their own items (e.g. the `editor-weapons-board.md` / `editor-armors-board.md` / `editor-items-board.md` trio).
- **No new theme** beyond accent normalization. A real light-theme / theming system pass is a separate item if/when it comes up.
- **No plugin-side changes.** All edits live under `jmz-data-editor/`; no `rmmz-plugins/` or `ca/` files touched.
- **No data migration**. `Save/Reload` labels change visually but the underlying save/load paths are unchanged.

## Notes

- Land Phase 1 before — or in the same PR window as — the `editor-weapons-board.md` / `editor-armors-board.md` / `editor-items-board.md` trio; otherwise those three new boards bake the old pattern in and have to be migrated immediately after.
- The shared `UsableItemInvocationSection` / `UsableItemDamageSection` extraction described in `editor-items-board.md` should consume `<BoardSectionCard>` from day one, so the skills board's migration to those components also picks up the new card rhythm for free.
- Crafting is the visual north star — when in doubt about whether a card looks right, A/B against the Crafting board.
- Honest scope estimate: Phase 1 is ~1 sitting; Phase 2 Tier A is the multi-sitting bulk of the work (States especially); Tier B / C / Phase 3 / Phase 4 are each ~1 sitting. The whole pass is realistically 2-3 PR-sized chunks if Phase 2 is split by tier.