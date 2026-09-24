# J-TIME: stop saving what the game rebuilds

## Source

- `src/plugins/time/core/_models/Game_Time.js` (`initMembers`, `handleUpdateTime`, and the bare
  `SerializableRegistry.register(Game_Time)` at the bottom of the file)
- `src/plugins/time/core/windows/Window_Time.js` (the only reader of the HUD latch)
- `docs/save-system.md` (the "Deciding what is transient" section)

## Context

`Game_Time` registers bare, so the save codec writes every field it owns. Most of them belong in a
save: the calendar (`_seconds` through `_years`), and `_active`, `_visible` and `_blocked`, which
plugin commands and events set and a player expects to survive a load. Two groups do not:

- **`_hasBeenUpdated`** is a HUD latch. `handleUpdateTime` raises it on every tick and `Window_Time`
  lowers it after redrawing. It means nothing across a load, because the window draws the current
  time in its constructor anyway.
- **The seven `*PerTick` fields** (`_tickFrames`, `_secondsPerTick`, `_minutesPerTick`,
  `_hoursPerTick`, `_daysPerTick`, `_monthsPerTick`, `_yearsPerTick`) are copies of plugin
  parameters. Decoded values win over seeded defaults, so a save freezes the rates it was written
  with, and retuning `framesPerTick` or any increment never reaches a loaded game. This is the
  save-system doc's "store an id, not a database row" problem, with plugin parameters in the role of
  the row. Nothing changes them after construction except `setTickSpeed`, which nothing outside its
  own tests calls.

This item originally proposed splitting `Game_Time` into a save DTO and a runtime manager. The save
codec's `transients` declarations now do that job in one registration, and the tone state the item
listed moved to J-Lighting in #113, so the split is no longer needed.

## Work

- Give the registration a `transients` block: `_hasBeenUpdated` re-seeds to `false`, and each
  `*PerTick` field re-seeds from the same `J.TIME.Metadata` value `initMembers` reads.
- Leave the calendar, `_active`, `_visible` and `_blocked` persisted.

## Definition of done

- [ ] `Game_Time`'s registration declares `_hasBeenUpdated` and all seven `*PerTick` fields as
      transients
- [ ] a test encodes a `Game_Time` and asserts none of those eight fields is in the output, then
      decodes it and asserts each came back at its cold value, with a calendar field and `_active`
      surviving the round trip beside them
- [ ] in-game: raise `framesPerTick` in the plugin parameters, load a save written before the change,
      and time runs at the new rate
- [ ] in-game: hide the time window with `hideMapTime`, save, reload, and it is still hidden
- [ ] `bun run hotfix` green and coverage still 100%

## Notes

- Saves written before the change need no migration. The codec assigns transients after decoded
  fields, so a stored `_tickFrames` is simply overwritten on load (`docs/save-system.md`, assignment
  order).
- If a speed command is ever wired to `setTickSpeed`, `_tickFrames` becomes player state and has to
  leave the transients.
- Removing the `$gameTime` global (74 references in plugin source, none in Chef Adventure's data) is
  separate. It belongs with the other legacy-global items (`abs-action-map-bootstrap-refactor.md`,
  `abs-input-controller-registry.md`, `game-enemies-factory-rename.md`) and the
  `LEGACY_GLOBAL_THIS_PROPERTIES` cleanup in `src/build-tools/verify-ships.js`.
- Do not conflate with `$gameSystem.playtime`: J-TIME is a fictional calendar, not the real-time
  session clock.
