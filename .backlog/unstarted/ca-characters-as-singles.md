# Chef Adventure: every character sprite a `$` single

## Severity

**Low.** Nothing is broken: every reference resolves today. Jeremy, 2026-10-29: "I actually 100% want this to be
consistent across the board... I really want to cleanup my /characters directory." It is its own cleanup effort,
done separately from the tier-1 enemy work.

## Gain

`img/characters` holds one format. Every sprite is a `$` single, or a `!$` single for objects that sit flush on a
tile, and each one is named so the folder sorts by kind. No event points at "slot N of sheet X", every sprite keeps
its own frame size, and nothing in the folder goes unused.

## Decision (2026-10-29)

**Singles, not a sheet per subgroup.** Jeremy weighed both and agreed on singles.

- A sheet per subgroup only covers enemies. NPCs, doors, torches and effects would still need a rule of their own,
  so the mix would just move somewhere else.
- An 8-character sheet forces one cell size on all eight. A 48px stump and the 141x150 leafy treant
  (`$m_treant-leafy-large.png`) cannot share a sheet without padding every slot out to the biggest.
- Singles were already the majority (189 of 346 files), and every sprite added on 2026-10-29 is one:
  `$m_slime-cube-*`, `$m_raptor-*`, `$m_treant-*`, `$m_swordfish-*`, `$m_seedspitter*` and `$m_wolf-*`.

## Source

- `ca/chef-adventure/img/characters/`: the files themselves
- `ca/chef-adventure/data/Map*.json`: each event page's `image` (`characterName` and `characterIndex`), each
  page's `moveRoute`, and every Set Movement Route command (205) whose route has a Change Image step (code 41)
- `ca/chef-adventure/data/CommonEvents.json` and `Troops.json`: the same 205 / code 41 routes, plus Change Actor
  Images (322) and Change Vehicle Image (323)
- `ca/chef-adventure/data/Actors.json` (`characterName`, `characterIndex`) and `System.json` (`boat`, `ship`,
  `airship`)

## Context

Measured 2026-10-29. Treat it as a snapshot: Jeremy is still placing torches, so re-measure before starting.

- **346 files:** 182 `$` singles, 130 plain 8-character sheets, 27 `!` object sheets and 7 `!$` singles.
- **139 files are referenced nowhere.**
- **6,916 event-page images:** 4,361 point into 8-character sheets and 2,555 at singles. The sheet pointers use
  **210 distinct slots from 87 sheets**. The busiest are `!Other2` #7 (506 pages), `!Flame` #0 (379), `m_bats` #1
  (233) and `!Light1_mvt` #2 (208).
- **Everything else:** 11 Change Image route steps, 2 actors and 3 vehicles. Commands 322 and 323 are unused,
  `js/plugins.js` names no character files, and no reference points at a missing file.

## Work

1. Re-run the inventory over every path under Source. Before trusting the count, also search every other JSON
   under `data/` (map-editor blueprints, plugin configs) and the plugin notetags for character file names.
2. Settle a naming scheme per kind with Jeremy before cutting anything: monsters (`$m_`), objects (`$o_`, or
   `!$o_` when flush), effects (`$a_`), and NPCs and actors, which have no prefix today.
3. Cut every slot that is in use out of its sheet into a single that keeps the source sheet's frame size. A `!`
   sheet's slots become `!$` singles, so they keep the object behaviour: no 6px lift and no bush depth.
4. Re-point every reference to its new file with `characterIndex` 0. Edit maps one event line at a time, so each
   file keeps its own format: MZ writes one event per line, while the JMZ editor pretty-prints.
5. Jeremy decides whether the 139 unused files, and the 87 sheets once they are emptied, get deleted or archived
   outside the project.

## Definition of done

- [ ] Every file in `ca/chef-adventure/img/characters` starts with `$` or `!$`:
  `ls ca/chef-adventure/img/characters | grep -v -E '^(\$|!\$)'` prints nothing.
- [ ] The inventory finds every reference resolving to an existing file, every `characterIndex` at 0, and no file
  left unreferenced unless Jeremy kept it on purpose.
- [ ] In game: on a busy map, a torch, a door, a bat and an NPC look and animate exactly as they did before.

## Notes

- Raised during the tier-1 enemy work, which had just added the cube, raptor and treant singles.
