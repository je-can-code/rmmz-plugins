# Editor: jmz-map-editor, a map editor that beats MZ's

## Status

Planned 2026-09-29. Decisions D1 through D11 were settled one at a time with Jeremy and are recorded under
[Decisions](#decisions). He approved [Work](#work) the same evening, and building started on
`feat/jmz-map-editor` in `jmz-data-editor`. Progress, 2026-09-29 evening: every spike answered; P0 (built as
two halves, Go and TypeScript, against one written contract) and P11 (row copy and paste, and the list of the
maps an enemy appears on) merged after review. P2 is built and in review. Running: P1, P4, and P7 as two halves
(the list and catalog; the eight hand-built editors and the plugin-header parser), plus a fix to P0's
out-of-order undo.

**2026-10-10 13:30: merged, and a bug found while mapping.** The overnight work went in as PR #26 that morning.
Then, mapping, Jeremy found that a character graphic whose name starts with `$` draws only part of its image. Seen
with `$o_tree-heartwood`, one frame of which is 279 by 261. Not looked into yet; he put it off until later.

**2026-10-10 06:05: the overnight run is done**, everything merged and pushed on `feat/transfer-location-picker` at
`3a43f2a` (still no PR; that and the merge are Jeremy's asks). Since weather: stamps and blueprints with linked copies,
a placement record, editing a blueprint that reaches every copy, per-tag fields and J-ABS fields, the copy panel; a
saved state that means saved; the landing check and door pairs; exit-strip footprints; the J-ABS battler panel and
brush; and the fixes the hands-on passes found. Each built, reviewed or tested hands-on, and merged; the details are
under P8, P9 and P10.

**2026-10-08: weather done**, four features (under P9), all merged and pushed at `f3ea798` by 11:00: map weather, a
season on the clock, weather in Map Properties, and the sky's weather. Every one agrees with the headless game by its
numbers. On 10-07 the Switches & Variables window landed, and quest states joined it as a third column (`bd992e3`).

**2026-10-06: P9 started, one feature at a time, lights and the clock first** (the order is under P9). By 16:46 all
seven lighting and time features were merged onto `feat/transfer-location-picker` and pushed. They were checked against
the headless game: the dark, the night sky and every event's fresh-save page matched pixel for pixel or page for page.
Then, by 18:15, quest-gated pages (J-OMNI-Quests' `<pageQuestCondition>`, judged as on a fresh save: 207 of 207 pages
agree with the game) and a review pass over the clock and pages (animated light pieces redraw only on screen) were
merged too, at `45e7aad`. Next proposed: the switch preview, turning switches on and setting quest states to see later
in the story.

**2026-10-05: Jeremy's first wishlist round, on `feat/transfer-location-picker` (pushed, no PR yet).** A map
picker wherever a map and a tile are chosen (Transfer Player, Set Vehicle Location, the transfer quick panel; see
P10). And the move route editor, which he called "this sad sad popup" for being blind and "an unorganized pile of
chips": it now shows the route on the real map, walked through the map's own passability, starting where the earlier
Set Movement Routes and Set Event Locations on the same page leave the walker (the player starts on the event running
it; a click moves the start, preview only); steps are listed as runs ("Move Left ×3") with an editable count; the
palette is a numpad-layout move compass, a turn compass and ON/OFF setting rows, and the number pad types moves
(Shift turns). The same editor serves an event page's own Custom movement.

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

**2026-10-08: four features, in this order.** Jeremy, after weather: "yeah go for it". What is already there from P0: the
`blueprints` editor-data document (`jmz-editor/blueprints.json`, schema 1, `{ blueprints: [] }`), document keys for
editor-only documents, and the history core's transactions across documents. Event copy and paste exists
(`core/events/eventClipboard.ts`); no stamp or blueprint code does.

1. **Stamps.** Everything copied off a map, tiles across layers, events, or both, lands in a **Stamps** pane, newest
   first. Clicking one makes it the brush; placing it paints the tiles with their autotile edges refreshed and drops
   the events with fresh ids, as one undo step. Plain copies, never linked. **Merged 10-08 at `3dd7840`:** Ctrl+C or
   Ctrl+X with the Select tool takes the area's tiles (every layer, or the chosen one) and its events, or only the
   selected events; the panel sits beside Tiles and keeps 24 per session; Ctrl+V places the newest at the pointer, on
   any map. The old event copy and paste is gone, folded into stamps; Ctrl+D still duplicates. On another tileset the
   events go down and the tiles are skipped with a note; past the map's edge tiles are cut off like a brush and events
   skipped with a note; an event landing on another event refuses the whole placement. A 20 by 15 stamp with ten
   events places in about 25 ms. The same build fixed ghosts and overlays shifting under a screen tone. Layouts saved
   before it need Reset Layout, or Panels, to show the Stamps panel.
2. **Blueprints.** Saving a stamp names it and keeps it in `jmz-editor/blueprints.json`. Placing a blueprint drops
   linked copies: the link sits in each event's note, appended to any text there on one line, with no `<` or `>` in
   its values, and never on Map002's action templates (S4). The pane lists the blueprints and how many copies each
   has. Reviewed before merging. **Merged 10-08 at `53b257a`** after review and a fix round. The link is
   `<blueprint:[ID, EVENT]>` on its own line after whatever the note holds: ID is eight random lowercase letters and
   digits, kept through renames; EVENT is the event's id inside the blueprint; features 3 and 4 add values after them,
   and today's reader already keeps those. Chef Adventure's validator needs `blueprint` on its allowlist. Counts are
   read from the notes and stored nowhere: live on open maps, unsaved copies in other windows through the sync between
   windows, and the rest through a new `GET /api/event-notes` (a full count of 385 map files takes about a third of a
   second cold). `blueprints.json` is `{ blueprints: {} }` keyed by id, written at once and never over a copy that
   changed elsewhere. A blueprint with copies anywhere cannot be deleted, and **an undo or redo that would take it
   away is refused too, in the same words** (the orchestrator's call, on D8's precedent of refusing a cross-map undo
   with its reason; Jeremy may overrule it). A pasted copy whose blueprint is gone comes back plain, with the dead link
   taken out. Map002 is recognised from J-ABS's action-map setting, and every way of putting a copy there refuses.
3. **Linked changes.** A blueprint opens as its own document with its own history, and a change to it reaches every
   copy on every map as one step that one undo rolls back (D8). Copies keep offsets for numbers, overrides for
   choices, and pins (D6), clamped to each field's range. The field model is the heart of it: a copy differs from its
   blueprint field by field. Page settings are fields (move speed and frequency are numbers; conditions, image,
   trigger, priority and options are choices), and module tags in comments are fields through a module seam that
   says whether each is a number with a range or a choice: lighting now, J-ABS when battlers land. A tag nothing
   declares is a choice, never a number, since an enemy id looks like one. Position is never linked; the name is a
   choice. Reviewed before merging.
4. **Copies that drift.** A copy changed outside the editor (in MZ, say) has its offsets re-derived from its new
   values rather than overwritten; a number can be pinned or unpinned from the copy's panel; a copy can be detached.
   Reviewed before merging. **State at 10-09 13:55, with 1 to 3 merged and pushed at `78b9ba7`:** the re-deriving is
   already done, inside 3b's planner: when a change reaches a copy whose number is no longer what its link predicts,
   the link is read afresh (a pin moves to the copy's value; otherwise the offset becomes the copy's value less the
   blueprint's), so a hand edit, in MZ or in the editor, is kept as that copy's intent. What remains is the author's
   side: pinning and unpinning a number from a copy's panel (nothing writes a pin yet), and detaching a copy (its link
   taken out; its placement forgotten). Held for Jeremy's hands-on try first.

**Jeremy's hands-on try, 2026-10-09 14:18: undo refused.** He stamped a 5 by 5 bundle of battlers, saved it as a
blueprint, placed it a few times, changed one battler's graphic in the blueprint, then raised that same copy's speed by
hand, and Ctrl+Z said "'Change graphic (page 1)' cannot be undone: 'Edit Comment' later changed what 'Change graphic
(page 1)' changed." His question: "so... I can't undo at all if I manually changed something that was a stamp?" It was
a bug: the blueprint step's patch on each copy was wider than the field it changed, so a later edit to another field
of that copy read as a collision. **Decided (the orchestrator's call, his to veto): a blueprint step's undo compares
field by field and cell by cell, and where a copy was changed since in the same field, undo leaves that copy as it is
and says so, never refusing.** It is the undo side of hand-painted cells staying. The refusal stays for every other
cross-document step. The speed edit itself sat in the event window's own history, per D8, which is why Ctrl+Z in the
map reached past it to the graphic change. Fixed and merged at `540042e`: a blueprint change now touches each copy
only in the fields it changes.

**A hands-on test the same afternoon** (an agent driving the real editor on the GPU while Jeremy was away) found the
worst problem yet: hand-tweaking one tag on a battler copy froze all of that copy's tags, because a page's whole
command list was one choice and J-ABS declared no fields. Jeremy suggested splitting battler comments into one comment
per tag in Chef Adventure's data; not needed, since a tag in a separate comment froze too. **Fixed in the field model
and merged at `31eae8d`:** every comment tag line is its own field (an undeclared one is a choice keyed by its tag,
`p1.<motion>`, then `#2` for a repeat, never a number), and J-ABS declares its battler tags: `sight`, `pursuit`,
`alertedSightBoost`, `guardRange` and `alertDuration` as whole numbers and `moveSpeed` and `alertedPursuitBoost` with
fractions, all 0 and up with no top (J-ABS's patterns allow no minus and set no limit); `level` (J-LevelMaster's tag,
declared only while it is on) allowing negatives; `enemyId`, `teamId`, `respawnAnimation`, `aiTrait`, `aiRole`,
`jabsConfig`, `respawn` and `noRespawn` as choices. Checked on all 4,734 shipped battlers and their 20,584 tag fields.
Found on the way, for rmmz-plugins: J-ABS's `TeamId` pattern carries the `/g` flag, so reading a team id can fail on
alternate tries (one shipped battler uses it); and `guardRange` is read as a whole number on events though
`docs/notetag-reference.md` says fractions are allowed.

**Settled 2026-10-09, Jeremy: a copy's tiles follow too.** Asked whether repainting a blueprint's tiles should
repaint every placed copy, he chose yes: "A I think is the correct answer, but I don't think the editor needs to
REMEMBER, I just think it needs to know how to look up the usages", kept "in CA itself alongside blueprints" as a
record of which blueprints sit on which map (his sketch: `used.json`, map id to blueprint id to a count). The record
holds each placement's spot (map, blueprint, x and y), since a count cannot say where to repaint; counts fall out of
it. Events stay out of it: their note link (S4) already says which blueprint they copy, and travels with them if MZ
moves them. A tile is a choice under D6: when a blueprint's cell changes, a copy's cell still reading the old tile
follows, and a cell painted over by hand stays (autotiles compare by kind, and edges are refreshed around whatever
changed). Before repainting, the editor checks that a placement still matches the blueprint well enough to be where
the record says, so a map resized or shifted in MZ is flagged rather than painted over.

Item 3 is therefore built in three parts:
- **3a. The placement record and where-used.** `jmz-editor/blueprint-uses.json` (his `used.json`, named like the
  folder's other files), through the editor-data route with its overwrite protection, kept in step with placing, undo
  and redo, the editor's own Resize (its anchor shifts origins), and deleting or duplicating a map; the match check as
  a pure function; and a where-used list in the panel (map and spot; a click goes there). Reviewed before merging.
  **Merged 10-09 at `afb7082`** after review. The record is map, then blueprint, then a list of top-left corners
  (`{"maps":{"1":{"k3x9q2mf":[{"x":22,"y":17}]}}}`); blueprints holding no tiles are not recorded. It is kept in step,
  in the same undo step as the tiles, by placing, Resize, the Select tool's move and copy, stamps' cut, copy and paste,
  and the tree's delete, duplicate, copy, paste, new map and Forget; discarding a map's edits restores its part. Resize
  drops a placement left wholly off the map, warning first. The match check passes a placement whose tiles all match
  (autotiles by kind), reports a slide of up to two tiles, and otherwise needs half its tiles matching: on 6,351 pieces
  from 328 maps, 96.5% still pass with a quarter of their tiles painted over. A follow-up, running: each map's part
  reaches the disk only with that map's own save, merged into the file there, so unsaved placements never do; the
  whole-file conflict choice goes, since it could throw away a map's undo steps; and a placement cut off at an edge is
  judged only by the part placed, so growing the map never flags it. That follow-up merged at `8244b76` (a map's part
  is merged on the server, under the editor-data lock; the record is never unsaved, saved whole or conflicted;
  placements record the part that went down, as record version 2) and was reviewed on its own, which fixed four ways
  two windows could leave it wrong. **Known limits, left as they are:** a window closed without saving can leave its
  unsaved placements in another window's view of the record, for a later save there to write; and undoing a map's
  delete restores its part as it was read at the delete. Either should only make a placement read "No longer where it
  was", since the match check comes first, though a phantom placement over ground that happens to look like its
  blueprint could pass that check and be repainted.
- **3b. The field model, with no UI.** What item 3 describes above, plus the tile cell rule and the shape of the
  link's extra values. D6 says a copy's intent survives a rebalance and results clamp, so an offset survives being
  clamped: offsets are stored in the link, and re-derived only when a copy no longer holds what its link predicts (an
  edit made elsewhere, item 4). Nothing writes, so no review. **Merged 10-09 at `5139933`.** Fields: the name and the
  note's own text are choices; per page, speed (1 to 6) and frequency (1 to 5) are numbers, and conditions, image,
  move type, move route, walking, stepping, direction fix, through, priority and trigger are choices, as is the
  command list less module tags. Lighting declares its tags through a new `commentTag` seam (radius from 0.01 with no
  top and intensity 0 to 100 are numbers; colour and effect are choices; lights on a page are keyed by order). A tag no
  module declares stays inside the command list, so an enemy id never moves by an offset. The link grows to
  `<blueprint:[ID, EVENT, KEY+N | KEY-N | KEY=V, ...]>`, for example `<blueprint:[k3x9q2mf, 2, p1.speed+2,
  p1.light1.radius=3.5]>`: offsets and pins only, an offset of 0 never written, and values it does not recognise kept as
  written. Pages pair by position; a copy whose page count differs from the blueprint's, whose note cannot take its
  link cleanly, or whose tag line cannot hold a value it must follow has drifted, and a change that adds or removes
  pages says which old page each new one continues. Checked against all 7,971 shipped events: nothing outside the
  changed fields moves.
- **3c. Editing and propagation.** A blueprint opens as its own document, and a change reaches every copy through 3a
  and 3b as one step, undone from either side under D8's rule, with a policy, picked and reported, for maps nobody has
  open. **Editing never ships without propagation:** editing alone would move the reference, and every copy still
  matching the old blueprint would later read as hand-edited. Reviewed before merging.
  Built 10-09 as two halves on one branch, merged together after one review: 3c-1, a blueprint opened and edited in
  its own tab, each step carrying what the field model needs (before and after, and which old page each new page
  continues); then 3c-2, each step reaching every copy. Rules for both: **the blueprint, its copies' new values and
  the record's parts reach the disk in the same act**, or a discard or crash leaves the blueprint ahead of its copies
  and every copy reads as hand-edited on reload (propagation writes at once, as the tree does, and undo writes again;
  writing a map at once never saves the author's other unsaved edits on it). One blueprint step is one undo step,
  however many maps it reaches. **For this cut a blueprint's size and set of events are fixed:** removing an event
  would delete events on every map, and growing would paint over cells its copies never owned.
  **Built 10-09 and reviewed.** A blueprint opens from its card in a tab of its own with its own history and needs no
  saving: about a quarter of a second after an edit, one write carries `blueprints.json` and every map with copies, and
  the server writes all of them or none (renames back to back, then one flush per folder). Open maps change on top of
  their unsaved edits, which never reach disk; maps nobody has open are written without opening, and the step joins
  their history when they open later. Undo works from the blueprint tab or any touched map, refusing with the reason
  when a later edit changed the same thing. A stroke over 50 copies on 20 maps commits in about 4 ms. On real maps the
  untouched copies followed, a hand-painted cell and a hand-edited light colour stayed, undo restored every file byte
  for byte, and a column-shifted map was flagged rather than repainted. **Known limits, left as they are:** if a second
  window opens a map in the quarter second while the first is writing a change to it, and saves it at once, that map's
  file can keep a change the rest took back; after the "could not be taken back" alarm, Save all reaches the blueprint
  and open maps but not maps nobody has open; and maps pulled into a blueprint's window stay there after its tab
  closes, so it is that window, not the map's, that asks about their unsaved edits.

3a and 3b run side by side; 3c needs both.

**Another tileset, settled 2026-10-09:** a stamp or blueprint placed on a map with another tileset puts down only its
events (a blueprint's still linked), leaves the tiles out with a note, and refuses a tiles-only one; a map whose
tileset changes later has its placements flagged, never repainted. Letting tiles through sheet by sheet where two
tilesets share a picture sheet (Elemental Earth and Air share all but the ground) was offered and declined: Jeremy,
"events-only is fine ... If I need more, I'll ask for more later."

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

**2026-10-06: built one feature at a time, lights and the clock first.** Jeremy: "dissect each distinct feature into
its own thing so we can add them one by one like modular features". Each feature lands as its own commit and switches
off with its plugin. He chose J-Lighting, J-Lighting-Time and J-TIME ahead of J-ABS, and approved this order the same
morning ("and including TIME. Perfect."):

1. Light rings: each light's reach drawn in its colour, from the first page that carries a light tag.
2. The light panel: radius, colour, intensity and effect, writing the same tag back.
3. The dark: a map's `<ambient>` darkness drawn, with light pools cut through it by J-Lighting's own falloff.
4. Effects: flicker, pulse and glitch animate.
5. The clock: an hour control. The sky's tone and darkness follow `config.lighting-time.json` and compound with the
   map's own darkness; maps tagged `<noToneChange>` stay put.
6. Time-gated pages: events show the page the clock allows (`<hourRangePage>` and the rest of J-TIME's page tags).
   Decided by Jeremy the same day: an event shows the page a fresh save would show at the clock's time (the game's own
   page rule, with every switch and self switch off), and an event with no page active then shows faded rather than
   vanishing. Turning switches on to preview later in the story is a feature of its own, for later.
7. Map darkness: controls in Map Properties that write `<ambient>`, plus `<noToneChange>` for a map without a sky.

One chip, **Lighting**, sits beside Shadows in the map view's bar and shows or hides everything J-Lighting draws, the
darkness and the lights together. Jeremy: "it'll toggle light visibility- both ambient and the light radius". It
appears only while J-Lighting is enabled. Chef Adventure's usage when this started: 810 light events on 70 maps,
`<ambient>` on 29 maps, `<noToneChange>` on 180, and 551 time-gated pages.

After lighting, the same treatment goes to J-ABS (sight and pursuit rings, the battler panel, a battler brush, a link
to the enemy, J-Motion's motions), J-Pixelistics (area footprints, and landing strips for relative transfers flagged
when they run off the other map) and J-RegionEffects, then P8 and P10.

**2026-10-07: the switch preview became a Switches & Variables window.** Jeremy, building on the Common Events
button: switch toggling and variable management "as another popout button". In his words, he wants "setting the names
for variables and switches", and, "for the sake of managing events", to "see with variable74 set to 99 ... (like being
able to see a named enemy spawn on the map or something)" and "see with switch74 set to ON to see a set of events
appear/disappear." So:
- names are real edits to `System.json`;
- on/off toggles and values are a preview that the page rule judges against, never written to the game;
- a chip beside the clock says when a preview is on, and "Back to a fresh save" clears it;
- the preview and the clock's hour are remembered between sessions.

Later, as features of their own: quest states in the same window, self switches, and where each switch and variable
is used. After this window, the proposed order is weather, blueprints, exits and door pairs, then battlers.

Quest states landed the same day as the window's third column: a quest set to a state, or an objective set, is judged
by `<pageQuestCondition>` as the plugin would, and a quest left alone follows its objectives. All 207 quest-gated pages
still agree with the game on a fresh save.

**2026-10-08: weather, four features.** Jeremy gave the go that morning ("you should be clear to do weather"). The
season was first planned inside the sky's weather; it became a feature of its own the same morning, because it moves
pages with no weather plugin on at all. Feature 1 first, then 2 and 3 side by side, then 4, which needs 2:

1. **Map weather.** A map tagged `<weather:PRESET>` shows that preset moving, drawn with J-Weather's own effects at the
   depth the game draws them, above or below the tone and the dark exactly as the game stacks them. `<noWeather>` shows
   none. A **Weather** chip beside Lighting shows or hides it and appears only while J-Weather is enabled; with Animate
   off, the weather holds still. Presets come from `config.weather.json` through the existing `GET /api/config/weather`.
   **Merged 10-08 at `3e08e68`:** seven presets on eight maps agree with the game by their numbers (count, picture,
   tint, blend and depth exactly; motion, size and opacity within tolerance, being random). The game draws weather as
   the last child of the base sprite, so the tone tints it and J-Lighting's dark covers it; the editor stacks it the
   same way. A map with no weather pays nothing for it when it opens.
2. **A season on the clock.** In the game the date decides the season, and the editor's clock held only an hour, with
   the date fixed at the fresh save's (Dec 16 2026, always winter). Choosing a season moves the clock's date to the
   start's day in the first month of that season after the fresh save (Mar 16, Jun 16 or Sep 16 2027; winter is the
   fresh save itself), and every date and season page tag is judged against the moved date. Remembered between
   sessions like the hour, and shown wherever the clock is. **Merged 10-08 at `053454e`:** the chip reads "21:00 Night ·
   Summer", and the dates come from J-TIME's parameters. All 551 time-gated pages agree with the game at six moments
   across the seasons. Chef Adventure ships no date- or season-gated pages yet, so the parity run adds a fixture map to
   the game's copy (53 events, one per tag, near misses on each side), and its 56 pages agree at every moment. J-TIME's
   months are all 30 days long, but its date ranges go through the real calendar, so Feb 30 reads as Mar 2 there.
3. **Map Properties.** A weather dropdown that writes `<weather:PRESET>`, listing the presets from the config, and a No
   weather toggle for `<noWeather>`. Written in place under the light panel's rule: a write that would change how any
   other tag reads is refused. Reviewed before merging, like every feature that writes data. It also settles a loose
   end from lighting: the `<noToneChange>` toggle shows while any plugin that reads it is on, not only J-Lighting.
   **Merged 10-08 at `b2b8f2f`** after review. The control is called **Look**, as the data editor's Weather board and
   J-Weather's help call a preset. With both tags present, No weather shows ticked and the Look says it never shows,
   since the opt-out outranks it in the game. Every shipped note round-trips: all 384 maps, 850 edits each read back
   exactly with every other tag unchanged; the reviewer added about 1.7 million random writes against a model of the
   game's reader and CRLF notes, and found no way to lose data. The sky toggle appears once, in Lighting while
   J-Lighting-Time is on and otherwise in Weather. Only J-Lighting-Time and J-Weather read `<noToneChange>`; J-TIME
   stopped at 2.0.0, though its help text and `docs/notetag-reference.md` still say it reads it.
4. **The sky's weather.** J-Weather-Time's weather on maps without a tag, outdoors as the plugins themselves decide it.
   A picker beside the clock sets the condition and strength. A fresh save's forecast is random, so the picker starts
   clear. Tagged outdoor maps take the sky's strength, as they do in the game (feature 1 draws them moderate). The sky's
   faces follow the plugin and the clock's season and hour (stars on clear nights, fireflies on clear summer nights).
   Remembered between sessions like the hour, and shown only while J-Weather-Time is enabled.
   **Merged 10-08 at `f3ea798`:** 416 sky checks agree with the game across 16 cases (seven conditions on an untagged
   map, five faces of a clear sky by season and hour, tagged maps taking the sky's strength, and roofed and opted-out
   maps staying clear under heavy rain), and item 1's 224 still agree. The plugins' rule for outdoors: `<noWeather>`
   means none; any `<noToneChange>` means roofed, whatever its value; an untagged outdoor map shows the sky at the sky's
   strength; a tagged map always shows its own look, at the sky's strength outdoors and its own under a roof; and
   `<climate:NAME>` adjusts the strength. J-Weather-Time's own "clear" always shows something (sunlight, scorcher,
   frigid, stars or fireflies), so the picker starts at **No sky weather** and "clear" is a choice like any other.
   Conditions a month can never roll are greyed, settling days pull the sky toward clear as the plugin does, and the
   sky is offered only with J-TIME on too, since J-Weather-Time throws at boot without it. Not built: pages switched by
   the sky's weather (`<weatherTypePage:X>` and two similar tags), which Chef Adventure does not use. What "agrees" means
   changed slightly here: a layer of 8 to 12 particles failed the spread check by chance alone, so the mean speed and
   size of a layer may now differ between the game and the editor by the larger of 20% of their range or three standard
   errors; item 1's checks follow the same rule, and only small layers get the wider allowance.

**State at 10-08 11:00:** weather is done, all four features merged and pushed on `feat/transfer-location-picker` at
`f3ea798`. Next proposed, unchanged: blueprints (P8), then exits and door pairs (P10), then battlers.

Done when: a tagged map's weather matches the game's per preset (the same effect, count, colour, size, speed, direction
and depth; random particles are compared by those numbers and by eye, never pixel for pixel), the speed budgets hold on
Map361 and Map102 with weather showing, each feature switches off with its plugin, and the tags round-trip with nothing
lost. Chef Adventure on 10-07: `<weather:...>` on 82 maps, `<noWeather>` on 35.

**2026-10-09 overnight: wrap it up.** Jeremy, going to bed at 21:15: "do everything we discussed and totally wrap up
all our fantasies about the editor. I wanna start editing tomorrow. I think that includes battler details and all that
for JABS and feel free to include any other of my dozens of plugins for map data if it makes sense". Stability for
tomorrow's editing outranks breadth, so every feature that writes data is still reviewed before it merges. The queue,
in order:
1. Running at 21:15: the copy panel (P8 item 4) and door pairs (P10 item 2); each reviewed, then merged. **Both merged
   by 01:05 on 10-10** (door pairs at `5465197`, the copy panel at `82cccd4`).
   - **Door pairs:** right-click a tile, "New transfer…": an edge tile starts an edge pair, any other a door; the
     current map on the left, "Leads to" on the right; landings cyan where the player can stand and red where not, with
     the reason; Place stays off until both pass; one click, one step from either map, both files written together
     through a new `PUT /api/map-changes`. The default door sprite is `!EX_Dungeon_Doors` character 5, the picture most
     shipped doors use, counted live. Made beside the inn's bathroom and the salt mine's strips, the events match the
     shipped ones byte for byte; the inn's front door differs only in its name and in landing one tile north of the way
     out (the inn lands two, his words said one). The review fixed a window freeze and placed and took back a pair on
     all 384 maps byte for byte. Known limit: a pair placed into an unopened map, then a blueprint change reaching that
     map, then the map opened: that blueprint change can no longer be undone from anywhere (the history's forget gets
     past it).
   - **The copy panel:** a "Blueprint" section in a copy's event window, `Copy of "useless" (event 21)`, Open
     blueprint, a summary ("1 field set by hand, 1 pinned, 1 at an offset."), Follow the blueprint again, Unlink, and a
     row per field ("Follows the blueprint", "+1", "Pinned at 3", "Set by hand") with Pin, Unpin or Follow; the quick
     panel carries the summary; the Note box shows the note's own text and keeps a refused edit as typed; where-used
     marks copies with fields set by hand. Unlink keeps the placement in the record, so the tiles and the other copies
     placed with it still follow. Commands that name other events of a tile-less blueprint read "These commands name
     other events in the blueprint, so this copy keeps its own". Values left behind by an undo still read "Set by hand".
2. **J-ABS battlers** (merged 02:59 at `c0c10d7` after review: the panel shows each value the game uses with its
   source, "This battler", "Enemy" or "Default", the other source's value beneath and an × to hand the row back to the
   enemy; a page picker for events with several battler pages; the brush copies each enemy's own most common battler
   (128 of 143 keep one picture) at the enemy's own level, and says so; the enemy opens in the data editor, whose boards
   no longer land on row 1 for links from elsewhere. J-LevelMaster reads `lv`, `lvl` or `level`; the panel writes
   `<level:N>`, the only spelling Chef Adventure uses. Not shown: passives granted by an enemy's skills (Tsukumogami's
   state 99 from Ghastly Plating). **A J-ABS bug, not fixed:** `Game_Event.js:356` reads `jabsBattlerRole` from a
   `Game_Enemy`, but only database rows define it, so AI roles in enemy notes never reach battlers on the map; about 20
   Chef Adventure enemies carry one, and a page's own `<aiRole>` still works.) **The brush's level, Jeremy, 10-10
   06:11:** "I assumed both? You drop a battler, it is the first battler, and so it comes at its default level (which
   means no level tag). Using the quick battler data panel, update the level to something different and the tag gets
   added ... and now the map remembers 'the level' of this map. Or alternatively, the map gets a 'default level'
   setting that is purely for the editor". Built as: the map's editor-only "new battlers start at level" setting if
   set, else the level that enemy already carries on the map, else the map's most common battler level, else no tag;
   the map learns by reading its own battlers, so undo un-teaches it. Merged 06:55 at `dfb5e98`: ties go to the
   higher level; the pointer says why ("Level 12 · this enemy's level here"); Map Properties' "Battlers" section
   ("New battlers start at level", shown with J-ABS and J-LevelMaster on) is kept in `jmz-editor/new-battler-levels.json`
   and never in the map file; a deleted map's setting stays in that file for a new map reusing its id. The battler kind
   and its quick panel (the enemy, by name from
   `Enemies.json`; level; sight; pursuit; the alerted boosts; motion; AI; team; respawn), marking which values the event
   sets and which the enemy's database note supplies, the event winning as `ca/CLAUDE.md` records; a link that opens
   the enemy in the data editor; and a battler brush (pick an enemy, click to place a battler carrying its tags).
   Reviewed. **No rings:** asked whether sight and pursuit rings should draw for every battler or only the selected one,
   Jeremy dropped them (21:22): "visibility of enemy sight/pursuit and alert extras can be skipped. I don't really build
   maps based on them and rarely change the defaults. Most enemies are probably 4/6 sight/pursuit ... sight and pursuit
   isn't collision based, it's just 'are you within X or Y range?'" The values still show in the panel.
3. **J-Pixelistics**: `<areaEvent:[W,H]>` footprints drawn on the map, since most map-edge exits are one wide area
   event; relative transfers' landing strips if any exist. **Merged 10-09 at `31eaf59`:** a W by H rectangle right and
   down from the event's tile, from the active page's last whole-line tag, as `Game_Event.js` reads it; drawn as a
   faint band in the marker's colour, exits with chevrons pointing the way the player arrives, clipped bands with a red
   edge and a "!" and a plain warning in the quick panel; a click inside picks the event; with the Events chip, while
   J-Pixelistics is on. All 471 shipped areas draw where the plugin puts them (436 exits), and six run past the edge:
   Map229/3, Map233/4, Map251/2, Map268/1, Map240/15 and Map072/38. Map361's cold open is unchanged (alternating runs:
   base 492.8 to 519.3 ms, branch 491.8 to 505.0); its 500 ms budget was already missed about half the time.
4. **Other plugins' map data**, as a survey of every enabled plugin's map and event tags ranks them by what an author
   gains.
5. **Cleanup**: a map whose file is deleted outside the editor reads unsaved (closing it warns); a failed re-read no
   longer leaves a false "unsaved". **Merged 01:46 at `e513918`,** with two more: the blueprint writer's wait looped
   forever in the same case the door review fixed for pairs (a frozen window), now fixed; and every undo or redo
   refusal names maps as the tree shows them. A deleted map's file is written back by saving; a file coming back
   unchanged reads saved, changed is an "Externally modified" step; a failed read retries from 1 to 30 seconds. Deleting
   a map in the tree while another window holds it now makes that window ask before closing. 1,500 more seeded runs of
   undo, redo, save and discard passed; no separate review, for the clock, with the hands-on pass covering it.
6. **A final hands-on pass** over everything on the real GPU, with screenshots for Jeremy's phone, then his morning
   summary. **Done 02:59;** it found that a door pair's undo was refused after any later edit to the map or after the
   editor's own save, that Show Text took one undo step per letter, that quick settings kept another map's event, that
   Ctrl+V did nothing right after switching map tabs, and smaller wording slips. **Fixed and merged by 05:50 on 10-10**
   (`076e1f3`, then `661791d`): a pair's undo is judged by its own events and fields and never by the editor's own
   saves, and when it truly cannot go through it says what to undo first and where; typing lands as one step per burst
   (a pause of a second, or leaving the box) in every command editor; quick settings follows the map in view; clicking
   a map's tab gives it the keyboard; a copy's title reads "Event 57 · Copy of event 14 of "Needler nest""; and the
   battler panel explains that a battler always keeps at least one AI trait. Still running at 05:50: the deleted-file
   bar's words and Save, an occupied tile shown in the door dialog's readout, and map names instead of numbers in
   messages.

**The plugin survey, 21:30** (383 maps, 7,933 events; every working event tag sits in page comments, one per line, read
from the active page only; no plugin reads an event's own note):
- J-ABS: `<enemyId>` on 4,732 events across 223 maps (143 enemies); `<moveSpeed>` 2,918; `<sight>` and `<pursuit>`
  about 1,000; the three alert tags 960; `<jabsConfig:inanimate>` 865 (tool gates and props) and `noIdle` 146;
  J-LevelMaster's level 458 (444 of 454 differ from the database: real overrides); J-Passive's `<passive:[ids]>` 620,
  mostly one affix (Brine, Clay); `<aiTrait>` about 90. The enemy's `Enemies.json` note supplies the same tags; the page
  wins value by value, except that AI traits and roles on a page replace the database's set, `inanimate` forces the
  neutral team and hides the HP bar, name and idle, `<passive>` adds to the database's passives (an affix listed there
  is fixed rather than rolled), and `<gapCloseTarget>` is the database's (unused on pages). 37 events have several
  battler pages, 21 of them changing enemy. Many pages repeat the database (inanimate 860 of 866, sight 216 of 366).
  The rules are `parseEnemyComments` in J-ABS's `Game_Event.js`.
- J-Motion: `<motion:[type, ...]>` on 4,140 events, 4,122 of them battlers (stretch 1,644, breathe 1,397, float 1,148,
  swing 432, ghost 98), defaults in `config.motion.json`. **In tonight's battler panel** as a motion picker (P9 already
  said J-Motion's motions belong there).
- J-Pixelistics: `<areaEvent:[W,H]>` on 471 events across 187 maps, 445 of them exits. **Tonight's one extra plugin**:
  footprints drawn, draw-only. `<relativeTransfer>` is unused.
- **Found, not built, for Jeremy to choose:** J-Escriptions' floating labels (`<text>` 323 events, `<icon>` 211,
  `<proximityText>` 187, `<proximityIcon>` 173; "Jump" and "Save Point" lead), drawn with a ring for proximity; animated
  J-Motion previews on the map; area footprints resizable from the quick panel; per-page battler state, and a flag on
  page tags that only repeat the database; J-Message's choice conditions in the Show Choices editor (5 uses);
  J-Regions-Skills and -States as map properties (2 maps, 1 a test map); J-TIME's and J-OMNI's choice tags and
  `<timeBlock>` (test maps only).
- **Tags that do nothing, for Jeremy:** `<proximity:1>` on Map320 event 5 is a skill tag; `<noDangerIndicator>` on two
  events and `<battleMap:109>` on Map083 belong to plugins that are switched off.

Rules for the night: every merge leaves the branch launchable and usable; never a third data-writing build while two
are unreviewed; **no new build launched after about 04:00**, so the last review and the hands-on pass finish before he
is up; from the plugin survey, at most one more plugin is built (the most used with the smallest surface), and the rest
are recorded here as found, not built, for him to choose.

**Priority, Jeremy, 2026-10-06 13:13:** lighting and time matter most, because "it'll help me immersive build the world
with less guesswork." The battler features are "cool but less important": enemies wander, and their ranges are
generally the same. So J-ABS goes to the back of the line.

### P10. Transfers

Needs P5 and the J-RegionEffects rules. Placing a pair (both ends, one transaction), the landing-spot
walkability check (`ca/tools/mapgen/validate.js`'s `checkPassage`, plus module deny rules), and one-way
placement.

Done when a pair places, undoes and redoes as one step, and a landing on a blocked tile is refused with the
reason shown.

**Already built (2026-10-05, Jeremy's first wishlist item after shipping):** the landing-spot picker. Transfer
Player's "Pick on the map" opens a picker in the event window: the map field, then the real renderer to click a tile,
starting centred on where the transfer lands now. It reads maps without holding them (`lookAtDocument`), so an event
window never counts as keeping a copy it cannot save. P10's "click the landing spot on the other map" reuses it
(`LocationPicks` and `LocationPickerDialog` in `jmz-data-editor`, branch `feat/transfer-location-picker`). Jeremy's
rule the same day: anywhere a map and a tile on it are chosen, the picker is offered. Set Vehicle Location and the
transfer quick panel have it too, and the built-in catalog's tests fail any map field left without one.

**2026-10-09: exits and door pairs, from a survey of the shipped maps.** Jeremy chose this as next after blueprints
("build what comes next and I'll test the whole roster"). A read-only survey of all 384 maps found his habits, which
the tool follows rather than inventing its own:
- 939 transfers in 883 events on 303 maps, all to a fixed spot; of 744 exits, 723 have a return on the target map.
  The return event sits behind the player's arrival facing: 1 tile in 75% of exits, 2 in 14%, 94% behind in all.
- Kinds: invisible map-edge exits (539: player touch, below characters, one page, arriving facing the way of travel);
  invisible interior exits and stairs drawn in tiles (242: player touch, below, one page); door sprites (31: player
  touch, same as characters, one page or a locked page and an unlock page, arriving facing up, returning one tile below
  the door facing down); teleports (15, Through on); tile graphics (16); bomb walls (9, event touch, page 2).
- 98% play Move1 (volume 90, pitch 100) straight before the transfer, and 91% end with it; fade black 95%. The common
  pages are `<areaEvent>` comment, Move1, Transfer (434) and Move1, Transfer (304); door sprites run Open1, a door route
  (turn left, wait 3, turn right, wait 3, turn up, Through on), a player route (Move Forward), Move1, Transfer (24).
- Map edges: 358 of 435 are one wide `<areaEvent:[W,1]>` or `[1,H]` event one tile deep, mostly 3 to 9 wide; the return
  is always on the opposite edge, landing 1 tile in from it (85%) at the centre of the return strip (76%).
  `<relativeTransfer>` is never used.
- Names: maps from 300 up use "Transfer (target map name)", the newer habit; older maps use "teleport ...".
- Odd, for Jeremy to look at: 1/1 lands on Map002 at (16,12), outside its 10 by 15; 188/18 lands on a blocked tile,
  (23,7) on Map181; 7 edge exits arrive facing the wrong way (240/14, 266/5 and 268/1 among them); the areas of 229/3,
  233/4, 251/2 and 268/1 run past the map's edge; 207/1 lands where 206/1 does, 337/9 where 337/8 does and 251/2 where
  244/2 does, probably copied by mistake; 232/3 goes to Map327, which has no events.

The work, in order:
1. **The landing check.** A tile is a landing when the player can stand on it: RMMZ's passability from the tileset's
   flags (top layer first, ★ tiles skipped), events in the way, and J-RegionEffects' region and terrain-tag deny rules
   while it is enabled. The landing picker marks blocked tiles and refuses them with the reason; existing transfers whose
   landing fails it (or lies off the map) are marked on the map and in the transfer's quick panel. **Merged 10-09 at
   `4166ee2`.** A tile is a landing when it is on the map, no event a fresh save shows there blocks the player (same as
   characters, not Through), and at least one step leads off it as the engine steps (`canPass`, module rules included):
   stricter than the validator's whole-tile test, which fails 8 stairs and ladder landings the player really stands on,
   and it refuses about 403 open tiles walled in on every side. J-RegionEffects' rule is mirrored from its source
   (regions kept clear, from its parameters and the map's note; open regions exempting the terrain rule; denied terrain
   tags), so region 10 and terrain tag 1, live in Chef Adventure, now show amber under the Passability chip. Over all
   939 shipped transfers it flags exactly Map188's event 18 (into a wall at 23,7 on Map181); Map001's event 1 lands off
   Map002 but is a debug guide whose transfer sits in a choice, so no transfer kind claims it.
2. **Placing a pair.** Both ends, one step that undoes from either map, written to disk together the way blueprint
   changes are. Kinds from his habits: an edge pair (one wide area event per edge, the return on the opposite edge, each
   landing 1 tile in at the centre of the other strip, arriving facing the way of travel); a building pair (below); and
   a one-way transfer. Each page is Move1 then Transfer (with the `<areaEvent>` comment first for wide ones), fade
   black, named "Transfer (target map name)".

   **How a building is entered, Jeremy, 2026-10-09**, asked whether the return door goes one tile behind the arrival:
   "I don't really use 'auto door creation' (which is a native function in RMMZ, but less good). 'doors' are just...
   usually a door from the outside ... and then you enter a building, and there is no 'door to go outside', its just...
   a obvious dip in the tiles." His example is the Comfy Bear Inn, "the only real inn in the game": a door drawn in the
   wall outside, and inside a one-tile slot in the bottom wall with the exit at its foot and the landing just above it.
   He added, the same evening: "outside, the door is a 'same as player' level event so you walk up to it, and the door
   does an opening animation and you step in. Then when you arrive inside, you just are 'pop' one step away from the
   exit, wherever the exit is. Typically its north to enter and north above the exit slot. I don't think there are any
   other door types." So a building pair is:
   - **outside**, a door event, same as characters, player touch, whose page is his opening animation: Open1, the door's
     route (This Event, wait on: turn left, wait 3, turn right, wait 3, turn up, Through on), the player's route (Move
     Forward), Move1, then the transfer, arriving facing up (28 shipped pages carry these routes);
   - **inside**, the exit the author places in the slot: an invisible walk-on event (below characters, player touch),
     Move1 then the transfer back to one tile below the outside door, facing down;
   - the landing inside is one tile north of the exit, so the author picks the exit, not the landing.
   The inn's own events are the model for anything this leaves open; a locked door's second page stays a hand edit.

   **His shape for the tool, the same evening:** "I think a 'left and right' notion for doors makes sense in two
   different windows or panes. Also, if there was a dropdown for the door sprite and movement sound (defaulting to NONE
   for sound and ... probably one of my most common door sprites for doors), that would be ideal." So placing a pair
   shows the two maps side by side, the door's map on the left and the exit's map on the right, each a real map view to
   click in; a dropdown picks the door's sprite, defaulting to the one his shipped doors use most; and a dropdown picks
   the movement sound played before the transfer (the Move1 of his older pages), defaulting to none. The door's own
   opening sound stays part of its animation unless he says otherwise. Both dropdowns remember the last choice for the
   session: Jeremy, "Default being 'this is what happens when you don't choose one' but also 'you just chose this move
   sound so now this is the default till you close the map editor' makes sense". A fresh start goes back to the built-in
   defaults. And two sounds, not one: "if you wanted to make a 'I moved through this passageway' sound different from
   'the passageway moved for me' (aka I walked through the door, and the door creaked open as I passed) I wouldn't
   object". So a **door sound** dropdown (the creak as the door opens, defaulting to Open1, which his doors play today)
   sits beside the **movement sound** dropdown (the sound of passing through, defaulting to none), both remembered for
   the session.

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