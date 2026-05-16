---
status: open
area: feature
---

# Editor: Items board (RMMZ-native parity)

## Source

- New board file: `jmz-data-editor/app/src/presentation/boards/items/ItemsBoard.tsx`
- Existing scaffolding ready to consume:
  - Domain model `jmz-data-editor/app/src/core/domain/entities/RPG_ItemDomainModel.ts` (today wraps `name`/`note` only; needs surfaced editable fields).
  - Context `jmz-data-editor/app/src/presentation/context/resources/items.context.tsx` (already wired through `createResourceContext` against `Items.json`).
  - Route registration `jmz-data-editor/app/src/platform/compositionRoot/routing.config.tsx` (`itemsBoard` entry + `APP_ROUTES` push).
- Reusable patterns to lift:
  - Tabbed editor shell + `EditorBoardSplitLayout` + `VirtualizedSidebarList` + save/reload buttons: `jmz-data-editor/app/src/presentation/boards/skills/SkillsBoard.tsx`.
  - Invocation, Damage, and Effects sections from the skills board (currently inline accordions inside `SkillsBoard.tsx`). These should be **extracted into shared sub-components** as part of this work so items and skills consume the same building blocks.
  - Effects editor: `jmz-data-editor/app/src/presentation/components/usableItem/UsableEffectsEditor.tsx`.
  - Trait picker: `jmz-data-editor/app/src/presentation/components/traits/TraitEditor.tsx`.
  - Icon picker: `jmz-data-editor/app/src/presentation/components/icons/IconIndexField.tsx`.
  - Scope / occasion / hit-type enums: `jmz-data-editor/app/src/core/enums/RmmzSkillScope.ts` and siblings (already used by the skills board).

## Context

`Items.json` is the last vanilla DB board on the wishlist, and it's also the **most structurally interesting** of the three because items share the entire `UsableItem` shape with skills — same `scope`, `occasion`, `hitType`, `damage` block, `effects[]`, and `traits[]`. Today the skills board owns inline accordions for the Invocation and Damage blocks; the cleanest way to land items parity is to **extract those into reusable sub-components first**, then mount them in both boards. That way subsequent plugin-specific extensions only need to be authored once per concept (e.g. damage-formula linting, effect catalog filters).

Items also carry a few item-only fields not present on weapons/armors: `itypeId` (item type — Regular / Key / Hidden A / Hidden B), `consumable` (boolean), and they typically lack the eight-slot `params[]`. Don't bolt the equipment param row onto items; items live on the **usable-item axis**, not the equipment axis.

## Severity

**Low–medium** — same authoring-friction story as the weapons/armors boards, with extra blast radius because the extraction work directly improves the skills board's maintainability.

## Gain

**High** dev-side: extracting Invocation/Damage/Effects into shared components is a meaningful refactor win for the skills board on its own. **High** authoring-side: finishes the vanilla-DB editor parity story, unblocks healing-item / key-item authoring without bouncing to RMMZ, and sets the template for downstream plugin panels (e.g. J-DropsControl item drops, J-OTIB item boosts, J-Resources item-resource sinks).

## Work

- **Shared sub-components (do first — used by both items and skills).**
  - `components/usableItem/UsableItemInvocationSection.tsx` — wraps speed, success rate, repeats, TP gain, hit type, message lines. Extract from the existing skills-board accordion, keep the same field set.
  - `components/usableItem/UsableItemDamageSection.tsx` — wraps damage type (`Select`), element (`Select`), formula (monospace `TextField`), variance, critical. Extract from skills-board accordion.
  - Refactor `SkillsBoard.tsx` to consume the extracted components; **no behavior change** for the skills board (round-trip + visual diff stays neutral).
- **Domain model.** Expand `RPG_ItemDomainModel` to surface (and round-trip through `toRmmz()`):
  - `iconIndex`, `description`, `price`, `itypeId`, `consumable`.
  - `scope`, `occasion`, `speed`, `successRate`, `repeats`, `tpGain`, `hitType`.
  - `damage` block (`type`, `elementId`, `formula`, `variance`, `critical`).
  - `effects[]` — array of `RPG_UsableEffect` consumed by `UsableEffectsEditor`.
  - `traits[]` — array of `RPG_Trait` consumed by `TraitEditor`. (RMMZ items can carry traits even though the native editor rarely exposes them; surface anyway for plugin-driven cases.)
- **Board shell.** New `ItemsBoard.tsx` with two tabs (`Base` + `Note`):
  - Sidebar: `VirtualizedSidebarList` keyed off `items.context` data, icon column via `iconIndex`.
  - Save + reload buttons on the app bar.
- **Base tab fields.**
  - Name (text), Description (multiline), Icon (`IconIndexField`).
  - Item type (`Select` over RMMZ's four `itypeId` values — Regular / Key / Hidden A / Hidden B).
  - Price (number), Consumable (`Switch` / yes-no toggle).
  - Scope (`Select` from `RmmzSkillScope.ts`), Occasion (`Select`).
  - Invocation section (shared `UsableItemInvocationSection` component).
  - Damage section (shared `UsableItemDamageSection` component).
  - Effects list (shared `UsableEffectsEditor`).
  - Traits — embed `TraitEditor` against `selectedItem.traits`.
- **Note tab.** Raw `note` text editor, same as the other boards.
- **Routing.** Register an `itemsBoard` entry (icon suggestion: `Inventory2` from `@mui/icons-material`).
- **Tests.**
  - Round-trip test on the expanded item domain model (damage block + effects + traits → `toRmmz()` → re-hydrate equality).
  - Verify the extracted Invocation / Damage components render identically inside the skills board (snapshot-style check is fine).
  - Smoke test that `ItemsBoard` renders against a minimal `Items.json` fixture.

## Out of scope (this item)

- Any plugin-specific notetag UI (J-DropsControl drop tables, J-OTIB one-time boosts, J-Resources resource items, JAFTING ingredient flags, J-CriticalFactors crit channels, J-Elementalistics element overrides on healing items, etc.). Those land as follow-up extension panels.
- Migration of the skills-board accordion to the extracted components is in-scope as a behavior-preserving refactor; **expanding** the invocation/damage UIs (new fields, new layouts) is **not** in-scope here — keep them visually identical and only move code.

## Notes

- Land after `editor-weapons-board.md` / `editor-armors-board.md` so the trait/icon/save-reload patterns are already proven and shared.
- Once items has effects + damage + traits surfaced, the J-OTIB / J-DropsControl follow-ups are mostly notetag-parser round-trip work on top of an already-correct base board — same shape as the JABS skill extension panel sitting on top of the vanilla skills board today.