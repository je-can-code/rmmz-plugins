# Editor: Armors board (RMMZ-native parity)

## Source

- New board file: `jmz-data-editor/app/src/presentation/boards/armors/ArmorsBoard.tsx`
- Existing scaffolding ready to consume:
  - Domain model `jmz-data-editor/app/src/core/domain/entities/RPG_ArmorDomainModel.ts` (today wraps `name`/`note` only; needs surfaced editable fields).
  - Context `jmz-data-editor/app/src/presentation/context/resources/armors.context.tsx` (already wired through `createResourceContext` against `Armors.json`).
  - Route registration `jmz-data-editor/app/src/platform/compositionRoot/routing.config.tsx` (`armorsBoard` entry + `APP_ROUTES` push).
- Reusable patterns to lift:
  - Tabbed editor shell + `EditorBoardSplitLayout` + `VirtualizedSidebarList` + save/reload buttons: `jmz-data-editor/app/src/presentation/boards/skills/SkillsBoard.tsx`, `…/states/StatesBoard.tsx`.
  - Trait picker: `jmz-data-editor/app/src/presentation/components/traits/TraitEditor.tsx`.
  - Icon picker: `jmz-data-editor/app/src/presentation/components/icons/IconIndexField.tsx`.
  - Param row (core 8 + MaxTP) reference: `jmz-data-editor/app/src/presentation/boards/enemies/EnemyBaseParameters.tsx` (the `<maxTp:N>` notetag flow via `MaxTpParser`).
  - System enums via `SystemService` (armor types, equip types).

## Context

`Armors.json` rounds out the equipment side of the database alongside weapons. Same story as the weapons board: the sidebar/context/domain-wrapper scaffolding already exists, but authors still bounce back to the RMMZ native editor for any armor edit. Since armor and weapon UIs only diverge on a couple of fields (`etypeId`/owning equip slot replaces `wtypeId`/`animationId`), the two boards should land together and share the param/trait/icon assemblies verbatim.

`etypeId` (equip type) in RMMZ is the **owning equip slot** — slot 2 = Shield, 3 = Head, 4 = Body, 5 = Accessory by convention (slot 1 = Weapon is reserved for the weapons table). Surface this as a `Select` keyed off `SystemService.equipTypes` rather than a free-form number, so authors don't accidentally collide with the weapon slot.

## Severity

**Low–medium** — same authoring-friction story as the weapons board.

## Gain

**High** authoring throughput; pairs with the weapons board to close the equipment side of the editor parity story and unlock downstream plugin extension panels (J-SDP attached panels on armor pieces, J-Resources gating, JAFTING refinement metadata, etc.).

## Work

- **Domain model.** Expand `RPG_ArmorDomainModel` to surface (and round-trip through `toRmmz()`):
  - `iconIndex`, `description`, `price`, `atypeId` (armor type), `etypeId` (equip slot).
  - `params[0..7]` — same eight-slot tuple as weapons.
  - `traits[]` — array of `RPG_Trait` consumed by `TraitEditor`.
  - MaxTP via existing `MaxTpParser` (read on hydrate, write on `syncNote()`).
- **Board shell.** New `ArmorsBoard.tsx` mirroring the weapons/skills/states two-tab layout (`Base` + `Note`) with:
  - Sidebar: `VirtualizedSidebarList` keyed off `armors.context` data, icon column via `iconIndex`.
  - Save + reload buttons on the app bar (same pattern as the rest of the boards).
- **Base tab fields.**
  - Name (text), Description (multiline), Icon (`IconIndexField`).
  - Armor type (`Select` keyed off `SystemService.armorTypes`).
  - Owning equip slot / `etypeId` (`Select` keyed off `SystemService.equipTypes`).
  - Price (number).
  - Core 8 params + MaxTP — reuse the exact param row used by the weapons board so the two equipment boards look identical from the stat-row up.
  - Traits — embed `TraitEditor` against `selectedArmor.traits`.
- **Note tab.** Raw `note` text editor (monospaced, full-height textarea), same as the other boards.
- **Routing.** Register an `armorsBoard` entry (icon suggestion: `Shield` from `@mui/icons-material`).
- **Tests.** Domain-model round-trip test (params + traits + maxTp + etypeId → `toRmmz()` → re-hydrate equality), plus a smoke test against a minimal `Armors.json` fixture.

## Out of scope (this item)

- Any plugin-specific notetag UI (J-SDP attached panels, J-CriticalFactors armor crit-mitigation, J-Resources gating, J-Elementalistics resistance flavor on top of vanilla element-rate traits, JAFTING refinement provenance, etc.). Those land as follow-up extension panels.
- Modeling armor "sets" or cross-piece bonuses — vanilla RMMZ has no concept of this; punt to a dedicated future item if needed.

## Notes

- Land with `editor-weapons-board.md` so the shared param row, trait editor wiring, MaxTP notetag flow, and tab shell are designed once for both.
- The `etypeId` slot picker is the only meaningful structural difference vs the weapons board; everything else is field rename + JSON file rename.