---
status: open
area: feature
---

# Editor: Weapons board (RMMZ-native parity)

## Source

- New board file: `jmz-data-editor/app/src/presentation/boards/weapons/WeaponsBoard.tsx`
- Existing scaffolding ready to consume:
  - Domain model `jmz-data-editor/app/src/core/domain/entities/RPG_WeaponDomainModel.ts` (today wraps `name`/`note` only; needs surfaced editable fields).
  - Context `jmz-data-editor/app/src/presentation/context/resources/weapons.context.tsx` (already wired through `createResourceContext` against `Weapons.json`).
  - Route registration `jmz-data-editor/app/src/platform/compositionRoot/routing.config.tsx` (`weaponsBoard` entry + `APP_ROUTES` push).
- Reusable patterns to lift:
  - Tabbed editor shell + `EditorBoardSplitLayout` + `VirtualizedSidebarList` + save/reload buttons: `jmz-data-editor/app/src/presentation/boards/skills/SkillsBoard.tsx`, `…/states/StatesBoard.tsx`.
  - Trait picker: `jmz-data-editor/app/src/presentation/components/traits/TraitEditor.tsx`.
  - Icon picker: `jmz-data-editor/app/src/presentation/components/icons/IconIndexField.tsx`.
  - Param row (core 8 + MaxTP) reference: `jmz-data-editor/app/src/presentation/boards/enemies/EnemyBaseParameters.tsx` (the `<maxTp:N>` notetag flow via `MaxTpParser`).
  - System enums via `SystemService` (weapon types, animations).

## Context

`Weapons.json` is one of the last vanilla database boards still missing from the editor. Authors currently need to fall back to RMMZ's native editor for any weapon definition work — even though the sidebar, contexts, and domain wrapper already exist. The other database boards (skills/states/enemies) have established the **two-tab "Base / Note" shell** plus the sidebar list and save/reload pattern, so this is mostly assembly of existing components against the weapon-specific field set.

The "core 8 params + MaxTP" call-out matters because RMMZ stores MaxTP outside the `params` array as a separate concept; the editor models it through the `<maxTp:N>` notetag (see `MaxTpParser`), which the enemies board already integrates next to the base params. Weapons should follow the same convention so authors think of MaxTP as a first-class stat alongside HP/MP/ATK/DEF/MAT/MDF/AGI/LUK.

## Severity

**Low–medium** — no game-side breakage, but authoring friction is real until parity lands; every weapon tweak still routes through the native editor.

## Gain

**High** authoring throughput once shipped: closes the last vanilla-DB blocker for treating the editor as the daily-driver tool, and unblocks all downstream plugin-specific extensions (Elementalistics, CriticalFactors, SkillExtend on equipped skills, etc.) which need a working weapons board to attach to.

## Work

- **Domain model.** Expand `RPG_WeaponDomainModel` to surface (and round-trip through `toRmmz()`) the editable fields:
  - `iconIndex`, `description`, `price`, `wtypeId`, `animationId`.
  - `params[0..7]` (MHP, MMP, ATK, DEF, MAT, MDF, AGI, LUK) — keep the eight-slot tuple shape.
  - `traits[]` — array of `RPG_Trait` consumed by `TraitEditor`.
  - MaxTP via existing `MaxTpParser` (read on hydrate, write on `syncNote()`), matching the enemies board pattern.
- **Board shell.** New `WeaponsBoard.tsx` mirroring the skills/states two-tab layout (`Base` + `Note`) with:
  - Sidebar: `VirtualizedSidebarList` keyed off `weapons.context` data, icon column via `iconIndex`.
  - Save + reload buttons (full `SaveButton` / `ReloadButton` pair on the app bar, matching the parity sweep that just shipped for quests/proficiency).
- **Base tab fields.**
  - Name (text), Description (multiline), Icon (`IconIndexField`).
  - Weapon type (`Select` keyed off `SystemService.weaponTypes`).
  - Animation (`Autocomplete` keyed off `SystemService.skillAnimationAutocompleteOptions`).
  - Price (number).
  - Core 8 params + MaxTP as a single horizontal/grid row, reusing the enemies-board param row layout so MaxTP visually slots next to LUK.
  - Traits — embed `TraitEditor` against `selectedWeapon.traits`.
- **Note tab.** Raw `note` text editor matching the skills/states "Note" tab (monospaced, full-height textarea, no preview/diff for v1).
- **Routing.** Register a `weaponsBoard` entry alongside the existing boards (icon suggestion: `Build` or similar from `@mui/icons-material`).
- **Tests.** Domain-model round-trip test (params + traits + maxTp → `toRmmz()` → re-hydrate equality), plus a smoke test that `WeaponsBoard` renders without throwing against a minimal `Weapons.json` fixture.

## Out of scope (this item)

- Any plugin-specific notetag UI (J-Elementalistics elements, J-CriticalFactors crit channels, J-SDP attached panels, J-SkillExtend hooks, JAFTING refinement metadata, J-Resources resource mods, etc.). Those land as **follow-up extensions** on top of the base board, mirroring how skills grew JABS/JAFTING/etc. panels post-parity.
- Re-ordering the sidebar list (alphabetical / by type / etc.) — first pass mirrors RMMZ id order.

## Notes

- Pair with `editor-armors-board.md` and `editor-items-board.md`; they share the trait/icon/param/animation building blocks and should land in the same sweep so authoring patterns stay consistent across all three vanilla equipment boards.
- Once the base board is in place, follow-up plugin panels are mostly notetag round-trip work via the existing parser conventions (`SkillJabsNoteParser.ts` is the cleanest template).