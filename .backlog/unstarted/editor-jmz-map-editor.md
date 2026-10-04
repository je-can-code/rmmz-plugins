# Editor: jmz-map-editor, a map editor that beats MZ's

## Status

Planned 2026-09-29. Decisions D1 through D11 were settled one at a time with Jeremy and are recorded under
[Decisions](#decisions). He approved [Work](#work) the same evening, and building started on
`feat/jmz-map-editor` in `jmz-data-editor`. Progress, 2026-09-29 evening: every spike answered; P0 (built as
two halves, Go and TypeScript, against one written contract) and P11 (row copy and paste, and the list of the
maps an enemy appears on) merged after review. P2 is built and in review. Running: P1, P4, and P7 as two halves
(the list and catalog; the eight hand-built editors and the plugin-header parser), plus a fix to P0's
out-of-order undo.

**2026-10-02: shipped.** jmz-data-editor PR #24 and ca PR #98 (the editor's own data) are squash-merged. After
checkpoint 3 the editor also gained markers on image-less events with an Events panel, collapsible panels and
sides (Ctrl+B, Ctrl+Shift+B), a Panels menu, Layers in torn-out windows, and `bun run map-editor-ca`. 5,268 tests.
Remaining for after the weekly usage reset: P9 (plugin modules), P8 (blueprints), P10 (transfer pairs), and the
Nimbus-room acceptance test.

**2026-10-01 09:45: checkpoint 3 is ready, and the usable core is complete.** Merged after review: P6 (the event
window in its own window: pages, conditions, image, movement, the command list; opens in about a quarter of a
second through the real NW.js path; all 7,970 shipped events round-trip), a permanent centre editor area,
torn-out maps with their own palette, and event clicks that land at any display scale and zoom. 5,081 tests pass.
Left: P9, P8 and P10, a final pass, the Nimbus-room acceptance test and the PR.

**2026-09-30 20:35: checkpoint 2 is ready.** Merged after review: P3 (palette, marks, layer strip, stack view,
passability editor, every tool, Shift and Space; the palette wired to the tools), P5 (selection, moves, clipboard,
fresh ids past the end, quick panels for chests, transfers, decor and dialogue, wired to the selection), the
workspace fixes from checkpoint 1, the "Externally modified" undo step, the data editor's Clear and visible `===`
rows, and red flags on unregistered plugin commands. 4,101 tests pass. Next: P6, the event window.

**2026-09-30 11:30: checkpoint 1 is ready.** P1, P4 and P7 merged after review (P1's gate passed), plus a fix
sharing WebGL contexts across map views. P3 and P5 wait for Jeremy's hands on the canvas. Launch from the
integration worktree: `bun run nw:dev --project-root /mnt/exdrive/dev/gaming/ca/chef-adventure --maps`.

**Order after 2026-09-30, to fit the usage budget:** the core loop comes first (P1, P4, P7, then P3 and P5, then
P6), so the editor is usable for painting and eventing before the Chef Adventure extras (P9's plugin modules,
P8's blueprints, P10's transfer pairs) begin.

**Checkpoint 1, Jeremy's verdict (2026-09-30 11:50):** "this is fluid and amazing." Maps open and look right, side
by side works, the overlays and undo work, the command list "I honestly like this a LOT", and the Enemies link
lands on the exact event. The window runs on the RX 6950 XT. Bugs he found: dragging a tab off the app made KDE
create a sticky note (tear-out was only a button per group); a popout closed after a split inside it scatters
its maps around the tree; the properties column got crushed; collapsing a branch holding the selected map
re-opens it; the data editor has no Del. His answers to the list below, 12:10: show the `===` rows instead of
hiding them; editor data in `jmz-editor/` is right ("different games may have different blueprints"); keep the
data editor's pretty-printed JSON, which he prefers to MZ's one-row-per-line layout for editing by hand; record
an outside change as an undoable step ("Externally modified"); painting ground stays beneath objects; a
contested layer goes to what is being painted; Shift suspends autotiling; unregistered plugin commands raise
"angry red flags", and he wants a list of the nine; shadows off is right.

**Saved for Jeremy at checkpoint 1 (answered above):**
- the defaults taken in S1, S2, S3 and S6, each marked in its answer;
- P11: Skills and Enemies hide their `===` separator rows, so a multi-row paste writes over them unseen, as MZ
  would but without MZ showing them first;
- P0: editor-only data lives in `<project>/jmz-editor/<key>.json` (the builder's pick);
- P0: the data editor's existing save routes re-indent every file and write `<` as `<`, so any save there
  reformats the file; should they move to the new writer that keeps MZ's layout byte for byte?
- P0: Map046, Map138 and Map362 were written by tools, not MZ, so their first save rewrites them in MZ's layout
  with nothing else changed.
- P0 undo, chosen by the builder: when a map changes outside the editor, a clean map reloads and its undo
  history is cleared (a map with unsaved edits keeps them and is flagged). Recording the outside change as an
  undoable step would suit D8 better; worth his call. (The builder's other undo rule, that a step spanning
  several maps could not be undone once any of them had newer steps, broke D8's blueprint and door-pair
  promises and is being replaced: such a step undoes whenever its own targets are untouched since.)
- P2 (for checkpoint 2, painting): wall faces on a map's top row are stored open on 18 maps and joined on 8,
  and the builder chose open; painting ground keeps B to E tiles on layers 3 and 4 as well as overlays, where
  MZ wipes them; and MZ's Shift (suspend autotiling, behind 6,833 stored cells) has no equivalent yet, which
  P3 should add. MZ's auto-shadows when painting walls are not built; the game never draws them. And a default
  taken after P2's review: painting ground keeps layer 2 in Area-mode tilesets (D5), but replaces it in World
  mode (the Overworld tileset), where MZ's second-column and deep-sea pieces belong to the ground. On Area
  tilesets too, a ground paint clears deep sea and the other A1 water overlays on layer 2 (they only make sense
  over water: 41 maps hold 8,270 such cells), while tall grass and other overlays stay.
- P4, chosen by the builder: map-tree changes write to disk at once while maps save with Ctrl+S or Save; deleting
  a map takes its whole branch as one undoable step, with no confirmation; cut then paste moves a map and keeps
  its id, so transfers still arrive; new maps go under the selected one at 17x13 with the parent's tileset;
  resizing removes events left outside the new size, after a warning. After review: deleting a map branch asks
  first with an inline confirm (tree history lives only in memory, so a delete could not otherwise be undone
  after the window closes), and resizing lists the transfers from other maps that land on this one rather than
  rewriting them.
- P7, chosen by the builders: folding is display-only and never writes MZ's `collapsed` flag; new or pasted
  commands land above the focused row, as in MZ; the common events view cannot add or delete common events;
  and common events save through the data editor's existing route, which reformats the file (see the P0
  question about the existing save routes).
- P7 found nine plugin commands in the maps that no plugin registers, so they do nothing in the game: J-JAFTING
  (3), J-JAFTING-Refinement (4), J-ABS "Refresh JABS Menu" and J-Log "hideLog". Fix or delete?
- P0 review, found and being fixed: the data editor's API answers every origin (`Access-Control-Allow-Origin: *`)
  and its POST routes ignore Content-Type, so while it runs, any web page could overwrite database files. That
  predates this build, and the data editor on `main` still has it until the PR merges.

## Context

Chef Adventure's last third, roughly 100 maps across chapters 4 and 5, gets built from nothing (56 of them
already sit in `MapInfos.json` as 0x0 placeholders). MZ's map and event editor is functional but an artifact
of its time, and mapping and eventing are most of why MZ stays open at all: Jeremy playtests through NW.js
directly, and MZ is otherwise open only for a few database bits.

What he groans at, in his words and his order (2026-09-29):

- two maps cannot be up side by side;
- two event editors cannot be up from two separate events;
- "basically the ability to be concurrent";
- the event commands: a massive list on three tabs, "with subsections, but come on, surely we can do better?";
- the lag, "even though its written in QT";
- auto-layering is "SUPER helpful", but some maps need manual layering before the tileset plays nice.

This editor can beat MZ's rather than clone it for one structural reason: MZ's editor cannot be extended, so
it can never know what J-ABS, J-Lighting, J-TIME, J-Motion or J-RegionEffects do with an event. This one can.

### What the shipped maps actually hold

Surveyed across all 383 maps on 2026-09-29. These numbers are what sized the work.

- **Events are mostly data.** 7,970 events on 8,955 pages, and 79% of them (6,262) run no logic at all:
  - 5,376 carry only comments: 4,587 J-ABS battlers (`<enemyId>`, usually with `<motion>`, `<moveSpeed>`,
    `<jabsConfig>`, the sight, pursuit and alert tags, `<passive>` or `<level>`), and ~790 J-Lighting
    lights, 274 of them time-gated by `<hourRangePage>`.
  - 886 have no commands at all: lamps, waterfalls, butterflies, placeholder markers.
- **The logic is concentrated.** 1,708 events run real commands, using 54 command types. Among those events
  the top 10 types cover 73%, the top 30 cover 95% and the top 40 cover 98.5%. Most used, counted by events:
  Play SE 959, Transfer Player 883, Show Text 420, Set Movement Route 290, Common Event 223, Wait 215, Control
  Switches 173, Plugin Command 168. A "top 5 cover 89%" figure is only true when the comment-only events are
  counted, which flatters it; quote the logic-events numbers.
- **Pages are simple.** 91% of events have one page. 774 pages carry conditions, mostly switch 1 (595) and
  self switch (173).
- **Plugin commands:** 57 distinct in use, led by J-OMNI-Quests (`progress-quest` 264, `set-quest-tracking`
  135, `unlock-quests` 83).
- **Tiles**, placements by sheet: A2 217,771; A4 155,970; A1 67,967; B 49,956; A5 48,133; A3 3,261; C 2,078;
  D 1,767; E 215. Shadows on 236 maps, regions on 20, a parallax on 117, encounters on 1.
- **The heavy maps**, which become the speed fixtures: Map361 `_FullEnemyMap` (600 events) and Map102
  (75x75, 108 events).

## Source

What exists to build on:

- `jmz-data-editor/server/internal/models/db/rpg_map.go`: `RpgMap`, with command lists carried as raw JSON
  so nothing is lost in transit.
- `GET /api/maps/{mapId}` (`server/internal/api/handler.go`, `LoadMap`), read today only by the boss and
  skill boards.
- `server/internal/store/json.go`: strict decoding that refuses fields the models cannot account for.
  `server/internal/models/db/round_trip_test.go` is the "nothing is lost" test pattern to copy.
- `nw-app/main.js`: starts the Go API and the UI, opens the window with `nw.Window.open`, and already parses
  `--project-root` and `--api-base`.
- `ca/tools/mapgen/snapshot.js`: draws a map through the engine's own autotile quadrant tables, copied from
  `js/rmmz_core.js`.
- `ca/tools/mapgen/autotile.js` (the learned A2 shape table) and `terrain.js` (an A4 wall-side table, plus
  the blob, span, box and ring shapes).
- `ca/tools/mapgen/validate.js`: `Game_Map#checkPassage` reproduced, with a flood fill and a landing-square
  check. `ca/tools/map-atlas.js`: connectivity, gates and one-way transfers.
- `rmmz-plugins/docs/headless-playtesting.md`: boots the real game on a virtual display with an injected
  probe and screenshots it. It is the ground truth for engine parity, and never for timing, because software
  rendering makes frame counts meaningless.

- Every database table already has `GET`/`POST` routes (`common-events`, `system`, `animations` and `actors`
  included). `GET /api/plugin-metadata` serves `js/plugins.js` raw, and `app/src/services/jabs/JabsPluginsReader.ts`
  already parses it.
- `app/vite.config.ts` has a single entry (`index.html`) and the path aliases (`@core`, `@services` and so on).

Missing today: a map write route, a `Tilesets.json` model and route, a `MapInfos.json` route, an image route
beyond `GET /api/iconset`, a file-change stream, and any reading of plugin headers (`@command`, `@arg`).

## Principles

Drawn from the groans. Every decision below answers to these.

1. **Concurrent by default.** Any number of maps and event editors open at once, side by side, across
   monitors. Nothing blocks anything else, so there are no modals.
2. **Fast, and measured.** Drawing the map never goes through React. Speed budgets are tested against the
   heavy maps above.
3. **Commands are typed, not hunted.** Search as you type, ranked by what Chef Adventure actually uses.
4. **Auto-layering by default, manual layering on demand.**
5. **Game-aware.** Battlers, lights and doors are first-class objects on the map, not comment text.

## Baseline interactions

Required whatever the decisions below say. Jeremy, 2026-09-29: "basic keyboard and mouse functionalities
should exist", naming copy and paste, delete, and drag and drop "and so on".

- **Copy, cut, paste, duplicate and delete** for events and for maps, several at once included. Pasting
  works across maps and across windows.
- **Drag and drop:** move events around the map, reorder and re-nest maps in the map tree, and drag a map
  from the tree into any pane to open it there.
- **Multi-select:** drag a box on the map; Shift and Ctrl clicks in lists and in the tree.
- **Undo and redo for all of it**, deletes and tree moves included.
- **Standard shortcuts:** Ctrl+C, X, V, D, Z and Y, Delete, F2 to rename, Enter to open, Esc to deselect,
  arrow keys to nudge selected events, and right-click menus everywhere.
- **Mouse-wheel zoom, and hold the right mouse button to drag the map around**, so neither the arrow keys nor
  the scrollbars are ever needed. Jeremy: "Sweet god that would be such an upgrade." A right click that does
  not move still opens the context menu.

## Decisions

### D1. Where it lives: settled 2026-09-29

Its own app, in the `jmz-data-editor` repo, on the same Go backend. Jeremy: "Perfect, I dare say."

- **Its own window and its own bundle.** The whole window is the workspace, and it never loads the data
  editor's board code. NW.js can open it in a separate renderer process (`new_instance`), so a slow board
  never stalls a paint stroke.
- **The same repo and backend,** so it shares the Go server, the models, the strict loading and the pickers
  instead of copying them and letting the copies drift.
- **Two ways in:** a button in the data editor opens it as a new window, and a `--maps` flag on the NW.js
  shell boots straight into it.
- **The two apps link to each other:** a battler opens its enemy in the data editor, and the data editor can
  list the maps an enemy appears on.
- **One cost, taken on purpose:** two windows editing one project must stay in sync, so the backend announces
  file changes to every open window. That also catches edits made in MZ or by scripts.

### D2. Panes and windows: settled 2026-09-29

- **One main window split into panels** (maps, the tileset palette, layers, the map list) that can be
  resized, rearranged, stacked as tabs or closed. Any panel can be torn out into its own real window, still
  live and in sync. Jeremy: "Things can hang out with each other until they need their own space."
- **Single-click selects.** One event, or a box dragged around several, shows its quick settings in a slim
  panel beside the map, and the map updates live as they change: a light's radius, a battler's sight range.
- **Double-click opens the full event editor in its own window**, by default, so MZ muscle memory still
  works and any number can be open at once. Jeremy's proposal: "Can't imagine I'll ever want an event and
  map side-by-side."
- In Jeremy's words, the split is "single vs double clicking for preview and editing vs full details and
  editing", and "events ON THE MAP should be there with their data points (light, enemies, etc)."

### D3. Drawing the map: settled 2026-09-29

- **The map renders exactly as the engine does.** Jeremy: "non-negotiable." The same autotile tables, layer
  order and shadows the engine uses, checked against it rather than eyeballed.
- **The game look is the default** (Jeremy's call): water animation, the parallax and the lighting are on,
  and each can be switched off.
- **Layers are selectable, and picking one highlights what sits on it**, as MZ already does. Jeremy leans on
  it when he gets hands-on with layering "to make it beautiful". How manual layering works is D5.
- **Overlays, each switchable:** the grid, regions and passability ("definitely required"); each light's
  radius, and the light itself as the clock moves; J-ABS sight and pursuit rings.

What the overlays must follow, verified in source on 2026-09-29:

- **Sight and pursuit are true circles.** J-ABS measures straight-line distance
  (`JABS_Battler.distanceToPoint`), as Jeremy said. Each has a second, alerted ring (`alertedSightBoost`,
  `alertedPursuitBoost`), and pursuit is leashed at 20 tiles for every role but guardians
  (`JABS_AiManager.shouldDisengageTarget`), so the pursuit ring stops there. Effective values resolve through
  the same precedence J-ABS uses when it builds a battler.
- **Lights:** the radius is in tiles, and fractions are allowed. Intensity is edge hardness, not brightness:
  0 is a soft pool and 100 a flat disc (`LightDeclaration`, `LightingTagParser`). The preview draws with
  J-Lighting's own falloff. The clock drives darkness and tone through J-Lighting-Time's `TimeToneResolver`,
  and time-gated pages show only at the hours they allow.

**Speed budgets** (proposed 2026-09-29), measured by a script in headless chromium against the fixture maps:

- a brush stroke is drawn by the next frame on Map102: stroke frames under 16.7 ms, with no dropped frames
  mid-stroke (reworded after S3, since time to the screen cannot be measured);
- panning and zooming hold 60 fps on Map102 with the game look and every overlay on;
- a map opens in under half a second cold, and near-instantly after that;
- selecting, box-selecting and dragging events on Map361 never drops a frame;
- an event window opens in under half a second.

The renderer and this script are the first things built, so a budget that cannot be met is found before
anything depends on it. Zoomed all the way out, the editor draws the whole map at once, which is more than
the game ever draws, so the game running at 60 fps proves the approach but not the budget.

### D4. The command list: settled 2026-09-29

- **A search box finds any command by name**, ranked by what Chef Adventure actually uses. Jeremy: required,
  emphatically.
- **Plugin commands sit in the same list and edit the same way**, since they are "just a bunch of inputs, no
  different than regular commands". They carry a `Plugin:` prefix (Jeremy's suggestion), and their inputs
  come from the plugin headers (`@command`, `@arg`).
- **Commands edit in place.** Clicking a row unfolds it into its inputs, like an accordion, and it folds back
  when done. Show Text gets a face picker and a text box with **no four-line cap**, because Jeremy's message
  window holds more than four lines.
- **Conditional branches and choices fold**, as they do in MZ, and on top of that **drag and drop is how
  commands get rearranged**: rows drag into and out of blocks, with a marker showing where they will land.
  Jeremy: a slick drag-and-drop surface "would be OUTSTANDING."
- **Every row reads like a sentence**, with the face beside a line of dialogue and a play button on a sound.
  Jeremy loves this one.

### D5. Layering: settled 2026-09-29

**The fight, in Jeremy's words (2026-09-29):** tiles "intended to be layered on top of stuff", his example
being the bottom corner of a diagonal cliff, have to be placed by selecting layer 3, dropping the tile, and
switching back to auto. Auto-layering "isn't smart enough to recognize 'oh, this is something that needs to
be placed at a higher layer than the ground-layer'", so it replaces the ground and the tile's transparent
corner shows up as "a violently white corner".

**What MZ's auto mode already does,** read from where tiles sit across all 383 maps: A-sheet tiles stay on
layers 1 and 2. The ground goes on layer 1, and overlay-style A kinds land on layer 2 over it: right-half A2
kinds (39,531 cells) and A1 kinds 1 to 3 (about 8,300). B-E tiles stack on layers 3 and 4, newest on top:
41,775 cells hold one on layer 4 alone, 6,027 hold two, and only 66 hold one on layer 3 alone.

**What the maps show:** 1,493 cells across 31 maps hold an A-sheet tile on layer 3 or 4, which auto mode
never produces, so each was placed by hand. They are overlay-style tiles: a right-half A2 tall-grass autotile
laid over base grass (791 cells, `Outside (VisuStella)` kind 36, a kind MZ already overlays on layer 2, which
suggests layer 2 was taken on those cells), waterfalls (A1), a few A4 walls, and 24 A5 pieces like the cliff
corner; 36 distinct tiles in all. The three main tilesets involved are in Area mode (mode 1). Transparency
alone does not pick them out: 48 see-through A5 tiles sit on the ground layers across 14,347 cells, and some
hand-layered tiles are opaque. Once S5 confirmed that auto mode never puts A5, A4 or A3 on layer 2 either,
the full count of hand-layered cells came to 15,833 across 68 maps.

**Side effects, checked:** RMMZ applies the ladder, bush, counter and damage-floor flags from every layer
(`Game_Map.checkLayeredTilesFlags`), so ground left under an overlay still counts. Today that is harmless:
the ~700 overlay cells sitting over bush grass are bush tiles themselves, and of the A5 overlays over bush,
only 4 cells can be stood on.

**Decided.** Jeremy: "GENERALLY i think you described the common scenario," with one correction.

- **Auto-layering stays the default and learns which tiles go on top.** Any tile can be marked "goes on top"
  in the palette, remembered per tileset. Painting a marked tile over existing ground lays it over instead of
  replacing it.
- **Ground still replaces ground**, with the pen and the paint bucket alike, so trying different ground or
  wall tiles across big fills works exactly as it does in MZ. Jeremy: "I wouldn't expect ground tiles to layer
  atop other ground tiles." Repainting the ground under an overlay leaves the overlay where it is.
- **Pre-filled from the maps:** the tiles already hand-layered start out marked. S5 counted 88 tiles or kinds
  above their auto layer; P2 found three of them are Overworld pairs MZ layers itself, per its help, so 85 were
  hand-layered and 80 start marked once the kinds MZ already overlays are taken out.
- **On an empty cell a marked tile lands on the ground layer**, so maps showing a parallax through keep
  working.
- **Manual mode stays:** pick a layer and paint exactly there, with the rest dimmed (D3).
- **A stack view:** hover a cell to see all four layers, the shadow and the region, including which tile's
  flags apply, and fix one layer without repainting.
- **Layer controls:** a button strip (Auto, 1, 2, 3, 4), and Shift+wheel steps through it (Jeremy's idea).
  Holding a key paints one stroke on the chosen layer and drops back to auto on release, which replaces
  today's switch-drop-switch-back. The brush cursor shows which layer it will paint, and before a click a
  ghost preview shows where the tile will land.
- **Suggested:** a swap tool that replaces one tile with another across the whole map, for trying a new
  ground or wall everywhere at once rather than one contiguous fill at a time.

### D6. Battlers, lights, transfers and stamps: settled 2026-09-29

- **Saved files do not change.** Battlers and lights stay the comment tags J-ABS and J-Lighting read, and
  transfers stay Transfer Player commands, so the game never knows the editor exists.
- **Single-click shows a quick panel suited to the kind of event** (D2): enemies, doors and other transfers,
  chests, lights. A battler's panel shows its enemy, level, sight, pursuit and motion, marks which values the
  event sets itself and which come from the enemy's database entry, and redraws the rings as sliders move.
- **Transfers are one family.** Doors are "one of many transfer-type events", so every kind (doors, stairs,
  map edges, teleports) can be placed as a pair: drop one end, click the landing spot on the other map, and
  both ends get wired, with the landing checked for walkability. One-way transfers stay possible, because
  points of no return are deliberate.
- **Stamps, with Jeremy's extended definition:** a stamp is anything captured off a map: one event, a group
  of events, a chunk of tiles across layers, or tiles and events together. Everything copied lands in a stamp
  history pane, and the keepers get pinned and named. It replaces today's habit of designing one enemy event
  and copy-pasting it around the map, which Jeremy calls "Slop ©".

- **Two kinds of stamp, one linked and one not.** Plain stamps in the history pane are "just an ease of
  multiple things at once": every placement is an independent copy. Saving a stamp promotes it to a
  **blueprint** (named in D10), kept in a saved collection. Blueprints are linked: "change the super-stamp™,
  change them all."
- **Tweaked copies keep offsets, not overrides** (Jeremy's idea). A copy with 6 sight, placed from a
  blueprint with 4, holds +2, so raising the blueprint to 5 moves the copy to 7. The intent ("this one is
  sharper-eyed than normal") survives a rebalance. Jeremy, on the shape below: "yes that sounds right.
  Perfect."
  - numbers are relative by default, and can be pinned to a fixed value when the map itself is the reason (a
    sight of 3 because the corridor is three tiles long);
  - choices with nothing to add (which enemy, which motion, a light's colour, passive states) simply override;
  - results clamp to each field's valid range;
  - the game still reads plain numbers: a copy's tags always hold final values, the offsets live with the
    link, and changing a blueprint rewrites every copy on every map;
  - a copy edited somewhere else, such as in MZ, has its offset re-derived from its new value rather than
    being overwritten.
- Where a copy's link and offsets are stored is an implementation decision. The candidate is the event's
  note field, which only 1 of the 7,970 events uses today, provided no plugin reads event notes.

### D7. The map tree and MZ: settled 2026-09-29

- **The editor owns the map tree:** creating, renaming, nesting, reordering and deleting maps.
- **MZ retires from the workflow.** What still keeps it open is "little bits" the data editor lacks, Jeremy's
  example being copy and paste of full rows. Those gaps get fixed alongside this work, and with MZ never open,
  nothing can rewrite `MapInfos.json` from a stale copy in memory.

### D8. Undo: settled 2026-09-29

- **History follows the thing, not the window.** Every map, event window and blueprint keeps its own undo
  history, docked or torn out, and undo acts on whatever has focus. Jeremy: "per-map undo-ability is vital.
  If they are separate windows, they are separate trackings of undo." He noted that this makes separate
  windows more inviting; since a docked panel tracks its own history too, tearing things out stays a free
  choice and D2 needs no change to get it.
- **A blueprint is its own thing, with its own history**, which is how Jeremy expected it to work. Undoing a
  blueprint change, sight 5 back to 4, rolls every copy on every map back with it.
- **Pairing is the only map-to-map action.** A door lives on one map; placing a pair also creates the return
  transfer on the other map, so that one action undoes as a single step from either side. A one-way transfer
  only ever touches its own map.
- **Saving never touches history.** Jeremy: "saving is just saving data, not resetting the undo history."
- **A history panel, the way paint apps do it** (Jeremy: "The only ones that seem to do it right are like,
  paint-type apps"): every step listed by name, and clicking any row jumps back to that point.

### D9. Coverage: settled 2026-09-29

Jeremy: "Sounds correct yeah."

- **Every event command gets an editor.** Most built-in commands are "just a bunch of inputs", exactly like
  plugin commands, so each one is a short declarative description that generates its form. About eight get
  hand-built editors: Show Text, Show Choices, Conditional Branch, Control Variables, Set Movement Route,
  Transfer Player, Plugin Command and Script.
- **Common events come along**, reusing the same command-list editor. Map properties are a form, and tileset
  passability flags are edited here too, beside the passability overlay that already shows them.
- Assumed rather than discussed: troop battle events stay out, since Chef Adventure battles through J-ABS.

### D10. Names: settled 2026-09-29

- **The app is `jmz-map-editor`.** Jeremy: "The natural counterpart to the jmz-data-editor."
- **Blueprint and stamp.** The linked, saved kind is a **blueprint**; the short-lived copy is a **stamp**.
  Jeremy: "Blueprint represents the layout of the structure of something, and immediately makes sense. Stamp
  is the short-lived copy pasta version."

### D11. Open source: settled 2026-09-29

`jmz-data-editor` is already public on GitHub under MIT (since 2021), so the map editor is open by default;
Jeremy floated it as "Open source RMMZ." His condition for supporting projects without his plugins: only if
it is not a heavy lift, since vanilla RMMZ alone is not worth much bother.

It is not a heavy lift, because it is the shape the build wants anyway. **The core editor (painting, events,
commands, panes) works on any MZ project, and each plugin's awareness is its own module** (battler panels,
light previews, sight and pursuit rings, the time-of-day clock) that switches on when that plugin is enabled
in `js/plugins.js`. Separate modules also make separate work packages.

## Work

**The renderer is the gate.** P1 builds the renderer and the speed script before anything that draws depends
on either. If Map102 cannot hold 60 fps zoomed all the way out, or a brush stroke cannot reach the screen
within one frame, work stops and the rendering approach changes before P3 or P5 onward begins.

### Shape

- **One branch, one PR:** `feat/jmz-map-editor` in `jmz-data-editor`. Packages are built in isolated
  worktrees and merged onto that branch as each one finishes.
- **Each package names** what it owns, what it consumes, the tests it ships, and when it is done. Each is
  written to be picked up with nothing beyond this document, `jmz-data-editor/CLAUDE.md`, and the packages
  it depends on.
- **Checkpoints are Jeremy's hands on the canvas**, not phases: after P1 (real maps panned and zoomed), after
  P3 (painting), and after P5 to P7 (events). Each is a review moment inside the one PR.

| Package | Needs | Runs alongside |
|---|---|---|
| S1 to S6, spikes | nothing (S1 before P0, the rest before whichever package uses the answer) | each other |
| P0, seams | S1 | nothing |
| P1, renderer and speed script (the gate) | P0, S3, S6 | P2, P4, P7, P11 |
| P2, autotiles and layering | P0, S5 | P1, P4, P7, P11 |
| P3, palette and tools | P1, P2 | P5 onward |
| P4, workspace shell | P0, S2 | P1, P2, P7, P11 |
| P5, events on the map | P1 | P3, P4, P7 |
| P6, event window | P5, P7's list component | P8, P9, P10 |
| P7, command list and catalog | P0 | P1 to P5 |
| P8, stamps and blueprints | P5, S4 | P6, P9, P10 |
| P9, plugin modules | P5 | P6, P8, P10 |
| P10, transfers | P5, P9's J-RegionEffects rules | P6, P8 |
| P11, data editor gaps | nothing | anything |

### Spikes

Each answers one question, and the answer is written into this document before the package that needs it.

- **S1. Windows under NW.js.** The UI is a page served over HTTP with no `nw` access, while `nw-app/main.js`
  has it. Find how the data editor's button, the `--maps` flag and double-clicked event windows open real
  windows, and whether each can get its own renderer process (`nw.Window.open` with `new_instance`, relayed
  through `main.js` if the page cannot call it).

  **Answer (2026-09-29): all three work, each window in its own renderer process.** Pages post
  `{type: 'open', url}` on `BroadcastChannel('jmz-shell')`. `main.js` listens through a hidden window it opens on
  the UI's origin without `new_instance`, checks the URL's origin, opens it with
  `nw.Window.open(url, {new_instance: true})`, and keeps a URL-to-window map so a second request focuses the
  open window. `--maps` is read by `main.js` from `nw.App.argv`, and it opens `map.html` itself. BroadcastChannel
  works across windows with and without `new_instance`, so the planned sync stands. On Xvfb, a window busy for
  1.5 s stalled none of the others, and each extra window cost about 40 to 50 MB. Dead ends: `new-win-policy`
  never fires for `new_instance` windows, postMessage cannot reach them, `setNewWindowManifest` is ignored, and a
  plain `window.open` always shares the opener's process. Found on the way: `process.argv` in NW.js holds only
  the binary path, so the shipped `--project-root` and `--api-base` flags never arrive (P0 reads `nw.App.argv`);
  `localhost` and `127.0.0.1` are different origins, so the app uses one; in a plain browser nothing hears the
  channel, so pages fall back to `window.open`. Prototype: branch `feat/jmz-map-editor-s1`, `spikes/s1-windows/`.
  - **Taken as defaults, open to Jeremy at checkpoint 1:** the channel relay rather than `node-remote`, which
    would hand every page Node's `require` and `process` and open duplicates on repeat double-clicks; and the
    app stays open while any window is, with unsaved edits asking before a window closes, where today's
    `main.js` quits everything when the data editor closes.
- **S2. Tear-out under NW.js.** Do dockview's popout groups (dockview 8.3.1; `dockview-react` supports React
  19) become real, live NW.js windows?

  **Answer (2026-09-29): yes, as they come, with no code on the NW side.** Each popout is a real top-level
  window, and React stays live in it. P4 adds four things:
  1. a blank `public/popout.html` and an explicit `popoutUrl`, or Vite's fallback boots a second whole app in
     the popout;
  2. a per-panel window scope giving each popout its own emotion cache and pointing MUI's Modal, Popover and
     Popper at the popout's body, since dockview copies styles only once, when the popout opens;
  3. a `keydown` listener on every popout window for app-wide shortcuts, which the main window never hears;
  4. `"chromium-args": "--disable-popup-blocking"` in `nw-app/package.json`, or restoring a saved layout with a
     torn-out panel gets blocked. Taken as the default (it is a desktop app loading only its own origin); the
     alternative is restoring torn-out panels only after the first click.

  Constraints: popouts always share the main window's renderer process (event windows from S1 get their own);
  hiding the main window stops its `requestAnimationFrame`, so a torn-out map schedules frames on its own window;
  `new-win-policy` stops firing after a reload, so nothing builds on it; dockview accepts only same-origin
  http(s) popout URLs, so the app stays served over http; floating groups work but cannot leave the main
  window. Not tested: dragging tabs between windows, several monitors, a real window manager. Prototype:
  branch `feat/jmz-map-editor-s2`, `spikes/s2-popout/`.
- **S3. A GPU for the speed script.** SwiftShader frame counts mean nothing (`rmmz-plugins/docs/
  headless-playtesting.md`, "What this cannot tell you"), so find how to drive the editor in chromium on the
  machine's real GPU: headless with hardware GL if Chromium allows it, otherwise a real window. Parity
  screenshots may use SwiftShader; timings may not.

  **Answer (2026-09-29): headless Chromium runs on the real GPU, so no visible window is needed.** The display
  runs on an RX 6950 XT (Navi 21, Mesa 26.2.3 RADV), 3840x2160 at 60 Hz, scale 1.5. Recipe: Playwright with
  `channel: 'chromium'` and `--use-angle=vulkan`, `DISPLAY` and `WAYLAND_DISPLAY` stripped, a 2560x1440 viewport
  at scale 1.5, and `JMZ_SPEED_GPU=NAVI21` so the script refuses to time on any other renderer. Traps:
  `--disable-vulkan-surface` forces software compositing, `--use-angle=gl-egl` picks the integrated Radeon
  610M, and `--use-gl=egl` falls back to SwiftShader. Headless `requestAnimationFrame` runs on a steady 60 Hz
  timer rather than vsync, so dropped frames on it are the pan and zoom gate, and they respond to GPU cost
  alone; GPU time comes from one timer query per frame. Evidence: the WebGL renderer string names the RX 6950
  XT, and 40k pixi sprites ran at 60 fps with 0 drops in 5 of 5 runs (0.6 to 0.7 ms of GPU a frame), against
  8 fps and about 252 drops a run on SwiftShader. The script cannot measure time to the screen (the frame
  clock, compositor, KWin and scanout); Chrome itself reports 16 to 24 ms from input to paint even for 2.5 ms
  frames. NW.js ships ANGLE on GL, not Vulkan. Harness: `scripts/speed/` on branch `feat/jmz-map-editor-s3`.
  - **Taken as defaults, open to Jeremy at checkpoint 1:** the brush budget in D3 is reworded so it can be
    measured; the NW.js app gets `--use-angle=vulkan`, so what ships is what gets measured; and the editor shows
    its WebGL renderer, so checkpoint 1 confirms the real window runs on the RX 6950 XT and not the integrated
    GPU.
- **S4. Event notes.** Does any plugin read an event's note field (`event().note`, `$dataMap.events[n].note`,
  J-ABS action maps included)? Map002 event 12, "stab 3", carries `<moveSpeed:6.0>` in its note, so the field
  is not provably unused. The answer decides where blueprint links live: the note field if nothing reads it,
  otherwise a page-1 comment tag.

  **Answer (2026-09-29): one reader, on one map.** When an action spawns, J-ABS merges its template event's
  note and page comments from the action map (Map002, `actionMapId` 2) into one synthetic note, and parses
  only the `<vis*>` sprite tags from it (`abs/core/managers/DataManager.js`, `JABS_Engine.js`,
  `models/JABS_Action.js`). Nothing reads the note or `.meta` of an event on any other map: RMMZ core fills
  `.meta` on load and nothing reads it, and J-Base leaves the note out of comment parsing on purpose
  (`_base/core/objects/Game_Event.js`). Stab 3's `<moveSpeed:6.0>` is never read, since moveSpeed comes only
  from comments, and its page speed is already 6. Chef Adventure's validator (`ca/tools/validate/checks/
  notetags.js`) reads every event note too, so an editor tag there needs an allowlist entry. Exactly one of
  the 7,970 events has a note. Checked: every J-* source file and built bundle, the six enabled third-party
  plugins in full, and script text in every data file.
  - **A page-1 comment is the worse home.** 1,165 events have an empty page 1 (1,163 of them action-button),
    and a comment makes such a page startable, which calls `lock()` and turns the event toward the player.
  - **Decided: the note.** Jeremy, the same evening: "NOTHING should be reading event NOTES, only their
    comments (as if they were notes) of the current page. So if something IS reading them, they SHOULDNT
    be." The note therefore belongs to the editor, and J-ABS's read of action-template notes is a defect
    (see [Notes](#notes)). Until that is fixed, links are appended to any existing text, on one line, with no
    `<` or `>` in values, and never placed on Map002's events.
- **S5. MZ's auto-layering, the ambiguous cases.** Five minutes of Jeremy's hands in MZ: are A5 tiles on
  layer 2 (4,199 cells) and A4 tiles on layer 2 (9,981 cells) placed by auto mode or by hand? What happens to
  layers 3 and 4 when an A tile is painted over them? Does World mode (0) change any of it? Tileset 1
  (Overworld, 56 maps) is the only World-mode tileset.

  The protocol Jeremy was given on 2026-09-29: a new 20x10 map `_LayerTest` on tileset 12 (Outside
  (VisuStella), Area mode), filled with plain A2 left-half grass, everything painted in Auto, cells two apart.
  Row y=1, one tile over grass: (1,1) the see-through A5 cliff corner, (3,1) a solid A5 tile, (5,1) an A4 wall
  top, (7,1) an A4 wall side, (9,1) the right-half A2 tall grass, (11,1) an A3 roof. Row y=3, B stacking: (1,3)
  one B tile, (3,3) two different B tiles, (5,3) three different B tiles, (7,3) a B tile then plain grass,
  (9,3) a B tile then a solid A5. Row y=5, overlays meeting: (1,5) tall grass then a different right-half A2,
  (3,5) tall grass then plain grass, (5,5) tall grass then a solid A5, (7,5) the cliff corner then tall grass.
  Optionally, (9,1) and (1,5) repeated on a second map with tileset 1. He saves and names the map id; the
  answers are read from the saved map file, layer by layer, and written here.

  **Round 1 answers (Map384 `_LayerTest`, decoded 2026-09-29).** The grass fill did not reach the saved
  file, so every test cell was empty underneath. On that basis:
  - A5, A4 (ceiling and wall face alike) and A3 tiles land on layer 1.
  - A right-half A2 kind (the tall grass, a fence) lands on layer 2 even with nothing under it, and a second
    right-half A2 kind replaces the first there. Over an A5 tile it lands on layer 2 and the A5 stays on
    layer 1.
  - B tiles: the first goes to layer 4; the second pushes it down to layer 3 and takes layer 4; a third
    drops the oldest. Jeremy saw the third stamp delete the first.
  - **Painting a ground tile (the A2 grass autotile, or an A5) wipes every layer above it:** layer 2
    overlays and layer 3 and 4 B tiles alike. D5 deliberately differs here, keeping overlays in place when
    the ground under them is repainted.

  **Round 2 answers (same map, rows 7 to 9 painted with grass first):** an A5 tile (the cliff corner and a
  solid one alike), an A4 ceiling, an A4 wall face and an A3 roof each **replace** the grass on layer 1, and
  the tall grass lands on layer 2 with the grass kept beneath it. Auto mode therefore never puts A5, A4 or A3
  on layer 2, so the corpus's layer-2 A5 and A4 cells were hand-placed as well. Counting every A-sheet tile
  above its auto layer, hand-layering covers **15,833 cells across 68 maps, 88 distinct tiles or kinds**
  (14,340 on layer 2, 1,472 on layer 3, 21 on layer 4): about ten times the layers-3-and-4 count alone. A1
  kinds 1 to 3 were not tested and are assumed to overlay on layer 2, as right-half A2 kinds do. The
  answers live here, so Map384 can be deleted whenever Jeremy likes.
- **S6. `@pixi/tilemap` 5.0.2 on pixi.js 8.21 under Vite 8 (Rolldown).** It builds, draws an RMMZ tileset
  through the engine's quadrant tables, and a throwaway fills Map102 inside the frame budget. If not, P1
  uses a custom instanced mesh on Pixi.

  **Answer (2026-09-29): yes, once two library bugs are fixed.** It installs with bun and builds under Vite
  8.2.2 in both the dev server and the production build. Through the engine's quadrant tables it draws Map102
  within ±2 per channel of an engine-order reference: all four tile layers, shadows, star tiles drawn above the
  rest, and A1 animation run on the GPU. As shipped it breaks twice: an edit made after the first render never
  reaches the screen (`tile()` skips `onViewUpdate`, and `checkValid` answers wrongly), and inside a moved or
  zoomed render group the map is transformed twice (`extract` triggers it too). Small patches fix both. CPU
  costs on Map102 (24,001 quads, 16x16-tile chunks): full build 6 ms, first render about 30 ms, cold open about
  130 ms, a one-tile edit and the render showing it 0.7 ms or less, the whole map zoomed out about 0.1 ms of CPU
  per render. **On the real GPU** (S3's recipe, 5 runs, a 3840x2160 canvas): 0 dropped frames panning, zooming
  and holding the whole map on screen; main thread p99 0.2 to 0.4 ms and GPU 0.33 to 0.45 ms a frame; stroke
  frames 0.56 to 0.66 ms at the median with no drops mid-stroke; cold open about 130 ms. About 16 of the 16.7
  ms frame is left for overlays and event sprites. The GPU timer sometimes reads about 5.9 ms, which is waiting
  rather than work (the card was 3 to 7% busy). Chunks keep 16-bit indices safe; a
  whole map in one tilemap needs 32-bit indices, or 1,714 cells corrupt. Map031's table tiles differ from
  `snapshot.js` and are unchecked against the real game, so Map031 becomes a P1 parity fixture. The page
  exposes `window.__s6` hooks (pan, zoom, paint a tile, a frame recorder) and `app/spikes/s6/drive.ts` drives
  them. Prototype: branch `feat/jmz-map-editor-s6`.
  - **Taken as defaults, open to Jeremy at checkpoint 1:** P1 vendors a fixed copy of `@pixi/tilemap` (MIT)
    rather than patching its internals at runtime, and switches to an instanced mesh if the vendored copy
    fights the budgets. The game look draws no auto-shadows by default, because J-Base turns
    `Tilemap._addShadow` into a no-op and the game never draws them; a switch shows them for editing.

### P0. Seams

Built alone; nothing parallel starts until it lands. It owns every interface the later packages consume.

- **The second app.** `app/map.html` as a second Vite entry rooted at `app/src/mapEditor/`, importing nothing
  from `presentation/boards/`, with its window titled jmz-map-editor. The `--maps` flag, the data editor's
  button and the window helpers follow S1.
- **The document model** (`app/src/mapEditor/core/model/`): a map document (size, tileset, the six layers as
  a typed array, events as a sparse list, properties) and an event model (pages, conditions, image,
  movement, options, priority, trigger, command list). Command lists stay raw JSON until a catalog entry
  interprets them, so nothing is ever lost.
- **The history core** (D8): every edit is a named, reversible patch. Each document (map, event window,
  blueprint) owns a history, and a transaction groups patches across documents (a door pair, a blueprint
  propagating) so it undoes as one step from any of them. The history panel reads the patch names.
- **Cross-window sync:** a BroadcastChannel protocol so a map and its event windows share one live document,
  plus a client for the backend's file-change stream.
- **The renderer interface:** what a renderer receives (document, tileset textures, camera, layer visibility,
  the overlay set) and what it answers (frame timings; the cell and the event under a point).
- **The command catalog format:** one declarative entry per command code (parameters, field types,
  conditional visibility, the sentence the row reads as, a category, search keywords), a registry the
  hand-built editors plug into, and how plugin commands parsed from headers join the same catalog under a
  `Plugin:` prefix.
- **The plugin-module registry** (D11): enabled plugins are read from `js/plugins.js`, reusing
  `JabsPluginsReader`'s parsing. A module registers event kinds (a detector, a quick panel, overlays),
  palette entries, passability rules and catalog entries. Vanilla kinds (chests, transfers, decor, dialogue)
  live in the core, never in a module.
- **Editor-only project data:** where blueprints, "goes on top" marks and saved layouts live inside the
  project, versioned with the game.
- **Backend** (`server/cmd/api/main.go` and models): `PUT /api/maps/{id}`; `GET`/`PUT /api/mapinfos`;
  `GET`/`PUT /api/tilesets` with a new `RpgTileset` model; `GET /api/img/{folder}/{name}` for tilesets,
  characters, faces, parallaxes and system sheets; and a server-sent-events stream announcing file changes
  under `data/`. Every model gets a "nothing is lost" round-trip test against the real files, all 383 maps
  included.

Done when `--maps` boots an empty workspace, a map loads and saves through the model with nothing lost, and
every interface above has a test exercising it.

### P1. Renderer and speed script: the gate

Consumes the P0 model, renderer interface and image route; owns `app/src/mapEditor/render/`.

- Pixi v8 with `@pixi/tilemap`, or the fallback S6 chose.
- **Engine-exact drawing:** the quadrant tables from `js/rmmz_core.js` (as `ca/tools/mapgen/snapshot.js`
  already copies them), A1 animation frames and waterfalls, table edges, shadows, the parallax, the upper
  layers, and event sprites (`$` and `!` sheets, direction, pattern, tile images).
- **The game look on by default** (D3): water animation, the parallax and lighting, each switchable. Lighting
  itself arrives with P9; P1 provides the layer it draws into.
- **Chunked drawing**, so an edit redraws only what changed. The camera zooms on the mouse wheel and pans
  while the right button is held; a right click that does not move opens the context menu.
- **The overlay layer:** grid, regions, passability (the engine's `checkPassage`, plus deny rules supplied by
  modules), layer highlight (D3), selection, hover and ghost previews.
- **The speed script:** Playwright on the machine's chromium, on the GPU path S3 found. It opens Map102 and
  Map361, records frame times while panning, zooming, painting and dragging events, times a map open, and
  fails on any D3 budget.
- **Engine parity:** the headless game (`rmmz-plugins/docs/headless-playtesting.md`) transfers to a shipped
  map with events frozen and lighting off, and its screenshot is compared against the editor's drawing of
  the same view. `snapshot.js` output is the cheaper comparator for day-to-day runs.

Done when every D3 budget passes on Map102 and Map361 and the parity comparison matches. **Checkpoint:
Jeremy pans and zooms real maps.**

**Gate result (2026-09-30): passed.** On the RX 6950 XT, 3 runs, with the game look and every overlay on:
stroke frames at worst 2.43 ms (Map102) with no drops; panning, zooming and the whole map on screen with 0
dropped frames and at most about 1 ms of main thread and GPU a frame; cold opens 258 to 280 ms, warm opens 18 to
35 ms. Event dragging and the event window are measured once P5 and P6 land. Parity against the headless game:
a maximum colour difference of 0 on every fixture (Map102, Map031, Map094's waterfalls at all four animation
steps, Map316's star tiles, and Map016 and Map017's objects on bushes).

### P2. Autotiles and layering

Owns `app/src/mapEditor/core/tiles/`: pure services, fully unit-tested.

- **Autotile shapes** for A1 (water, waterfalls and the special kinds), A2 (tables included), A3 (roofs and
  building walls) and A4 (wall tops and sides), extending mapgen's learned A2 table the way
  `ca/tools/mapgen/learn-tables.js` derived it.
- **The oracle test:** recompute every autotile shape in all 383 maps from its kind and its neighbours, and
  compare with what MZ stored. Every mismatch is fixed, or written down with its reason.
- **The layering engine (D5):** MZ's auto rules as the D5 section describes them and S5 confirms. A marked
  "goes on top" tile lands on the lowest free layer above the ground (layer 2, then layer 3), and on the
  ground layer when the cell is empty. Ground replaces ground and leaves overlays in place. Manual layer mode,
  the one-stroke override and the swap tool.
- **The "goes on top" marks,** stored per tileset, pre-filled from every A-sheet tile found above its auto
  layer (S5: 88 tiles or kinds across 68 maps), minus the kinds MZ already overlays on layer 2.

Done when the oracle test passes or every exception is documented, and every layering rule has a test with a
near-miss sibling.

### P3. Palette and painting tools

Needs P1 and P2. The palette panel (tabs A to E plus regions, multi-tile selection). As in MZ, the palette
shows each autotile kind as a single ready-made tile rather than the raw sheet, so the A tab reads as rows of
eight kinds: A1, then A2, A3, and A4 with its ceiling (top) and wall-face (side) rows alternating, then A5.
Jeremy flagged the difference between the sheet and the palette on 2026-09-29, and would welcome a clearer
view of autotiles than MZ's single tile, which is "not the world's most intuitive". One option: hovering a
kind shows a small painted patch of it, edges and corners included, with an A4 kind showing its ceiling and
wall face together. That gets designed with him at the P3 checkpoint. The tools (pen,
rectangle, ellipse, fill, eraser, shadow pen, region pen, eyedropper, select-move-copy of tile areas, swap);
the layer strip with Shift+wheel and the one-stroke override key; the stack view; and the tileset
passability editor beside the passability overlay.

Carried over from P2's review: on a cell with no ground, painting deep sea, an ocean decoration or a paired World
column still overwrites a marked tile, because those write their companion straight onto layer 1
(`core/tiles/layering.ts:186-197`); and MZ's Shift (suspend autotiling) needs an equivalent.

Done when every tool round-trips through undo and a Nimbus room can be painted start to finish.
**Checkpoint: Jeremy paints.**

### P4. Workspace shell

Needs P0 and S2. The dockview layout (panels, tabs, splits, tear-out per S1 and S2, layouts that persist);
the map tree (create, rename, nest, reorder, delete, copy and paste maps, all driving `MapInfos.json`); map
properties, including resizing with an anchor; the history panel; and every shortcut in
[Baseline interactions](#baseline-interactions).

Done when two maps sit side by side with a third torn out, all live and in sync, and every tree operation
round-trips through undo.

### P5. Events on the map

Needs P1. Selecting, box-selecting, dragging, nudging, creating, deleting, and copying and pasting events
across maps and windows. The quick panel framework (D2), with the vanilla kinds in the core: chests (the
two-page treasure pattern of a sound, an opening route, a self switch, a line of text and the item
granted), transfers, decor and dialogue.

Done when Map361's 600 events select, box-select and drag inside the budget. **Checkpoint: Jeremy places and
edits events.**

### P6. The event window

Needs P5, and embeds P7's command list through the catalog interface. Pages; conditions, with switch and
variable names from `System.json`; the character and tile image picker; movement with the move route editor;
options, priority and trigger.

Done when every event in the 383 maps opens and saves back with nothing lost, and an event window opens
inside the D3 budget.

Decided by Jeremy (2026-10-01): no arbitrary cap on a variable condition's value ("If I decide I want to set it
to MAX_INTEGER-1, I should be able to"); "Clear page" and "Delete page" are separate actions, and on an event's
last page "Delete page" becomes "Delete this event".

Confirmed by Jeremy (2026-10-01): MZ inserts a new or pasted page immediately after the page on screen,
shifting the later pages up by one; on the last page it appends. Questions about MZ's editor behaviour go to
him; no agent ever reads, unpacks or decompiles the MZ editor's binary.

### P7. Command list and catalog

Needs P0. The list component: search as you type, ranked by Chef Adventure's usage; accordion rows; folding
blocks; drag and drop with drop markers; rows that read as sentences, with faces beside dialogue and play
buttons on audio; copy and paste of command ranges. A catalog entry for every command code. The eight
hand-built editors: Show Text without a four-line cap, Show Choices, Conditional Branch, Control Variables,
Set Movement Route, Transfer Player, Plugin Command and Script. Plugin headers (`@command`, `@arg`, `@type`,
structs and lists) parsed into catalog entries. Common events.

**Round-trip guards:** Chef Adventure runs HIME_LargeChoices (consecutive Show Choices commands merge into
one list), and the editor must preserve that untouched. KMS_AreaEvent was guarded here too until
2026-10-03, when J-Pixelistics took over trigger areas as `<areaEvent:[W, H]>`, read from any comment
line on a page; the editor's top-of-page guard went with it.

Done when every command in the 383 maps and in `CommonEvents.json` renders its sentence, opens its editor,
and saves back with nothing lost.

### P8. Stamps and blueprints

Needs P5 and S4. The stamp history pane; the blueprint collection; links and offsets (D6), stored where S4
decided; propagation to every copy on every map as one transaction; pinning a number on a copy; and
re-deriving offsets for copies edited elsewhere.

Done when changing a blueprint updates every copy on every map, and one undo rolls them all back.

### P9. Plugin modules

Needs P5. Each module is its own package:

- **J-ABS:** the battler kind and its quick panel (enemy, level, sight, pursuit, motion, AI tags), marking
  what the event sets itself against what `Enemies.json` supplies, with the map event winning as
  `ca/CLAUDE.md` records; sight and pursuit rings with the alerted ring and the 20-tile leash (D3); a link
  that opens the enemy in the data editor.
- **J-Lighting and J-Lighting-Time:** the light kind and its panel, previews drawn with J-Lighting's own
  falloff, map ambience, and the clock control driving darkness and tone through `TimeToneResolver`.
- **J-TIME:** pages gated by `<hourRangePage>`, `<timeRangePage>` and `<timeOfDayPage>` show only at the hours
  the clock allows.
- **J-RegionEffects:** the terrain-tag and region deny rules, for the passability overlay and landing checks.
- **J-Motion:** the motion types offered in the battler panel.

Done when each module switches off cleanly with its plugin disabled, and round-trips its tags with nothing
lost.

### P10. Transfers

Needs P5 and the J-RegionEffects rules. Placing a pair (both ends, one transaction), the landing-spot
walkability check (`ca/tools/mapgen/validate.js`'s `checkPassage`, plus module deny rules), and one-way
placement.

Done when a pair places, undoes and redoes as one step, and a landing on a blocked tile is refused with the
reason shown.

### P11. Data editor gaps

Independent. Full-row copy and paste in the data editor's boards, any other "little bits" Jeremy names (D7),
and the data editor's half of the D1 link: listing the maps an enemy appears on.

### Integration and verification

Packages merge onto `feat/jmz-map-editor` as they finish. Before the PR: typecheck, lint, the vitest and Go
suites, the oracle test, the speed script, the parity comparison, and a screenshot pass across the fixture
maps. Then the acceptance test.

### Conventions for anyone building a package

- `jmz-data-editor/CLAUDE.md` is the authority on style, tests and UI copy: TypeScript, Allman braces,
  semicolons, single quotes, `#` private members, named exports grouped at the bottom of the file, JSDoc with
  typed `@param` tags, and short imperative comments on the line above the code.
- Tests live under `app/test/` mirroring `app/src/`, open with a block comment stating the contract, and
  carry `// Arrange`, `// Act` and `// Assert` in every test. Logic that decides what gets written to disk
  lives in services and value objects and is tested there, never inside a component.
- The Go side follows the existing models and routes, strict decoding included, with a "nothing is lost"
  round-trip test for every model.
- Commits are short, in Jeremy's voice, with no attribution trailers of any kind, and there is no emoji in
  code, comments or commits.
- Bun only; never npm, yarn, node or Python.

## Definition of done

- **The acceptance test (proposed 2026-09-29):** Jeremy builds a real Nimbus room in it, start to finish,
  without opening MZ. If it does not beat MZ on that room, the work stops and the remaining maps go back to
  MZ.
- Every package's done-when holds.
- Every shipped map loads and saves with nothing lost.
- Recomputing every autotile in the shipped maps reproduces what MZ stored, or each exception is understood.
- The speed budgets from D3 hold on Map361 and Map102, measured on the real GPU.

## Notes

- **Risks:** autotile rules beyond A2 (A3 has only 3,261 placements to learn from), matching MZ's
  auto-layering, and how painting and dragging feel, which only hands-on use can judge.
- **Machine time is not the constraint.** In `jmz-data-editor` a typecheck takes 4.2s, the 758 tests 4.5s,
  the build 0.6s and the Go tests about 1.5s (measured 2026-09-29).
- Chromium (`/usr/bin/chromium`) and Playwright's chromium-1228 are installed for the speed script and for
  screenshots; the headless game is documented in `rmmz-plugins/docs/headless-playtesting.md`.
- **Follow-ups outside this build**, from S4 (2026-09-29): J-ABS stops merging action-template notes into
  its synthetic note and reads page comments only; Chef Adventure's validator learns the editor's blueprint
  tag, and could flag any other tag in an event note as dead; stab 3's `<moveSpeed:6.0>` note on Map002 moves
  into a comment like stab 1 and 2, or goes.
- **Raised but not decided:** live reachability flags (rooms nothing can reach), a cross-map search with bulk
  edit, and mapgen's terrain shapes (blob, span, box, ring) as brushes.