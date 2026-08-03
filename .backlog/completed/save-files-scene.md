---
status: done
area: architecture
---

# `Scene_Files` — one scene for save, load, delete, and rewind

## What this is

A single scene that replaces vanilla's `Scene_Save` and `Scene_Load`, adds slot deletion, and exposes
the generation history the codec save format already keeps.

It is reached from three places, and **what it offers depends entirely on where it was opened from**:

| Entry | Commands offered | Confirm before loading? |
|---|---|---|
| Save platform (in-game) | Save, Load, Rewind, Back | yes |
| Main menu (in-game) | Load, Rewind, Back | yes |
| Title screen → Continue | Load, Delete, Back | no |

Commands that do not apply are **omitted, not greyed out**. A greyed `Rewind` on the title screen is an
invitation to wonder what you did wrong; an absent one just reads as a different screen. The player
should never learn that these are the same scene.

## Why it is one scene

Vanilla's `Scene_Save` and `Scene_Load` differ by six methods — `mode`, `helpWindowText`,
`firstSavefileId`, `onSavefileOk`, and their execute/success/failure trio. That is already a strategy
pattern wearing inheritance as a disguise. Delete has no home in vanilla at all despite needing the
identical list of slots, and Rewind needs it too.

One scene, one list, a mode that decides what selecting a row means.

---

## Before you start: what already exists

Read this section first. Every item here is something you would otherwise spend time rediscovering.

### The save format

`J-Base-Save` (`src/plugins/_base/ext/save/`) already provides everything this scene reads and writes.
Do not add storage logic to the scene.

| Need | Call |
|---|---|
| Does a slot hold anything loadable? | `SaveFileSystem.slotExists(slotName)` |
| The display block for a slot | `SaveFileSystem.readManifest(slotName)` → `.display`, or `null` |
| Every reachable generation, newest first | `SaveFileSystem.loadOrder(slotName)` |
| One generation's manifest | `SaveFileSystem.readManifestAt(slotName, generationName)` |
| When a generation was written | `SaveFileSystem.savedAtOf(slotName, generationName)` |
| Delete a whole slot | `SaveFileSystem.removeSlot(slotName)` |
| Which playthrough owns a slot | `SaveFileSystem.currentPlaythroughId(slotName)` |
| Write an arbitrary text file | `SaveFileSystem.writeSynced(filePath, contents)` |
| A slot's directory | `SaveFileSystem.slotDirectory(slotName)` |
| A generation's directory | `SaveFileSystem.generationDirectory(slotName, generationName)` |

Slot names come from `DataManager.makeSavename(savefileId)` — `file1`, `file2`, …

**`StorageManager.fsReadFile`, `fsRename`, and `fsUnlink` are vanilla RMMZ methods**, defined in
`project/js/rmmz_managers.js` around line 796. J-Base-Save calls them without defining them, and only
adds the six vanilla lacks (`fsExists`, `fsIsDirectory`, `fsMkdirRecursive`, `fsReaddir`,
`fsWriteFileSynced`, `fsSyncDirectory`, `fsRemoveDirectory`). Do not go looking for the first three in
plugin source; they are not there and nothing is wrong.

### What a manifest already carries

`DataManager.makeSavefileInfo` is extended in `src/plugins/_base/ext/save/managers/DataManager.js` and
writes, on top of vanilla's `title` / `characters` / `faces` / `playtime` / `timestamp`:

- `mapName` — the map's display name, falling back to the editor's name
- `leaderName`, `level`, `gold`
- `party` — actor ids, not members, so the block survives being read with nothing else loaded

The manifest itself also carries `savedAt` (ISO-8601) and `playtimeFrames`. **A row needs no additional
data source.** Reading a manifest never opens a world.

### The scene skeleton

`Scene_MenuFacetBase` (`src/plugins/_base/core/scenes/Scene_MenuFacetBase.js`) owns the chrome: a help
window across the top, a control legend across the bottom, and a bounded region between them. It exists
specifically to stop scenes drifting apart, and it has no pixel literals — every dimension derives from
`Graphics` and the line height. **`Scene_Files` extends it and puts nothing outside `facetAreaRect()`.**

Useful members: `facetAreaRect()`, `commandColumnWidth()`, `commandColumnRatio()`, `hasHelpWindow()`,
`controlLegendEntries()`.

`controlLegendEntries()` returns `{semantic: string|string[], label: string}[]`. See
`Scene_JabsLoadout.controlLegendEntries()` for a worked example. Semantics are logical input names, not
key names — the glyphs follow whichever device is in the player's hand.

**It is safe from the title screen, and this looks alarming until you check it.** `Scene_MenuFacetBase`
extends `Scene_MenuBase`, whose `create()` calls `updateActor()`, which is `$gameParty.menuActor()`. At
the title screen there is apparently no party — except that `Scene_Boot.startNormalGame` calls
`DataManager.setupNewGame()`, which calls `createGameObjects()`. So a throwaway new game is already
standing by the time the title screen draws, and Continue simply discards it. This is exactly what
vanilla `Scene_Load` relies on, since it is a `Scene_MenuBase` reachable from the title too.

Neither `Scene_MenuFacetBase` nor `Window_ControlLegend` reads any `$game*` object of its own. Verified,
so nobody has to re-derive it.

**The one rule that follows:** `Window_FilesList` must draw rows from `manifest.display` and nothing else.
The moment a row reaches for `$gameParty` or `$gameActors`, it is reading the throwaway new game rather
than the save it is describing — which would not throw, and would quietly draw the wrong party.

### Rules that will fail the build if ignored

- **`Window_Command` subclasses must seed state in the `initMembers` hook**, never in the constructor
  body or class fields. Vanilla's `initialize` refreshes, and refreshing calls `makeCommandList`, so by
  the time your constructor body runs the list has already been built against undefined state.
  `verify:no-late-window-command-state` enforces this.
- **Logic found in a view gets extracted into a service.** Scenes, windows and sprites are excluded from
  coverage on purpose. Every policy decision in this feature therefore belongs in the mode services
  described below, where it can be tested without PIXI.
- No `typeof`, no `instanceof`, no optional chaining, no `var`, no nested ternaries, Allman braces,
  single quotes, no trailing newline on plugin files.
- Nothing new on `J.*` outside `_metadata/initialization.js`.

---

## Where the files go

Everything lives in `J-Base-Save`, because the scene is the save system's own UI:

```
src/plugins/_base/ext/save/
  core/
    SaveFileMode.js              base class: what a mode allows and does
    SaveFileModeSave.js
    SaveFileModeLoad.js
    SaveFileModeDelete.js
    SaveFileModeRewind.js
    SaveFileEntry.js             one row's data, whether slot or generation
    SaveThumbnail.js             capture, crop, encode
  managers/
    SaveFileSystem.js            + thumbnail read/write (existing file)
  scenes/
    Scene_Files.js
  windows/
    Window_FilesCommand.js       the left command column
    Window_FilesList.js          the right chonky list
    Window_FilesConfirm.js       the yes/no prompt
  objects/
    Game_Interpreter.js          intercept command 352
  scenes/
    Scene_Map.js                 needsFadeIn alias
    Scene_Menu.js                commandSave / a new Files command
    Scene_Title.js               Continue → Scene_Files
```

Every new file must be reachable from `src/plugins/_base/ext/save/entry.js`.

---

## Phase 1 — the thumbnail

### 1.1 Capturing

`SceneManager.backgroundBitmap()` already holds a full-resolution capture of the map. `Scene_Map.terminate`
calls `SceneManager.snapForBackground()` on every exit that is not a battle, to build the menu's blurred
backdrop, so the picture exists before `Scene_Files` is ever constructed. This costs nothing extra.

**The bitmap is not blurred.** `Scene_MenuBase.createBackground` puts a `PIXI.filters.BlurFilter` on the
*sprite* and sets `_backgroundSprite.opacity = 192`; the bitmap itself is clean and full-opacity.

Two constraints follow from it being shared:

- `snapForBackground()` destroys the previous bitmap before replacing it. **Do not hold the reference.**
  Read `SceneManager.backgroundBitmap()` fresh at each save and encode immediately. Reading it repeatedly
  is correct and safe — nothing inside `Scene_Files` re-snaps, so a player who saves to one slot, stays in
  the scene and saves to another gets the same map picture both times, which is what they would expect.
  The rule bans caching the `Bitmap` object across the scene, not calling the accessor twice.
- **Draw from it, never onto it**, or you are scribbling on the live menu backdrop.

**Open question for the implementer to settle by looking:** `Scene_Map.terminate` hides the map-name
window and the menu button but not the whole window layer, and J-HUD draws party/target frames. Boot the
game, save at a platform, and look at what actually landed in the image. If UI is in it and that is
unwanted, snap fresh using the engine's own precedent:

```javascript
// Scene_Map.prototype.snapForBattleBackground, verbatim from rmmz_scenes.js
this._windowLayer.visible = false;
SceneManager.snapForBackground();
this._windowLayer.visible = true;
```

Decide by looking at a real capture. Do not guess, and do not build the fresh-snap path unless the
picture actually needs it.

### 1.2 Cropping

`Bitmap` exposes `.canvas`, which lazily creates a 2D canvas. So:

1. Read `$gamePlayer.screenX()` / `screenY()` for the crop centre.
2. Build a source rect of the target aspect (16:9), clamped so it never runs past the bitmap edges — at
   a map boundary the player is not centred on screen.
3. `drawImage(source, sx, sy, sw, sh, 0, 0, dw, dh)` into your own canvas.
4. `toDataURL('image/jpeg', 0.7)`.

JPEG over PNG deliberately: roughly 8–15KB against 40–90KB for a map render, and indistinguishable at
thumbnail size. Save size is not a goal here, but the load menu reads these, so cheap is still better.

### 1.3 Storing

Write it into the generation directory under a **fixed name** — `snapshot.jpg`. Nothing records the
filename anywhere, because there is exactly one per generation.

**It must NOT be listed in the manifest's `sections` array.** That array is the torn-write completeness
check: `readGeneration` requires every file it names to be present and to parse, so a thumbnail in it
would mean a missing image fails the whole generation into a rollback. A lost picture must never cost
somebody a save. Absent means "no image", full stop.

It must also not be embedded in the manifest. `DataManager.loadGlobalInfo` reads every slot's manifest
every time the load menu opens; a base64 blob in there is parsed on every open for images that may never
be drawn.

**Write real JPEG bytes, not the data URL.** `canvas.toDataURL` hands back
`data:image/jpeg;base64,…`, and writing that string to `snapshot.jpg` would produce a file that lies
about what it is and that no image viewer can open — which is precisely the opposite of the premise this
whole save format was built on. Strip the prefix and decode:

```javascript
const bytes = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
```

**No new filesystem primitive is needed for this.** `SaveFileSystem.writeSynced` is contents-agnostic —
it creates the parent directory and delegates to `StorageManager.fsWriteFileSynced`, which calls
`fs.writeSync(descriptor, contents)`, and Node's `writeSync` is overloaded for a string *or* a Buffer.
Verified empirically through that exact open/write/fsync/close sequence: the result is a genuine JPEG
that `file(1)` identifies as such. Hand `writeSynced` a Buffer and it does the right thing.

Add to `SaveFileSystem`:

- `static thumbnailPath(slotName, generationName)`
- `static writeThumbnail(slotName, generationName, dataUrl)` — decode as above, then `writeSynced`
- `static hasThumbnail(slotName, generationName)` — `StorageManager.fsExists` on the path

**Reading needs no method at all.** `Bitmap.load(url)` sets `_image.src = url`, and an `<img>` loads a
local file path directly, so the row does `Bitmap.load(SaveFileSystem.thumbnailPath(…))` and never
touches base64 on the way back in. Do not build a `readThumbnail` that re-encodes to a data URL; it is
a round trip that buys nothing.

The one thing that would break this is image encryption — `Bitmap._startLoading` diverts to
`_startDecrypting()` when `Utils.hasEncryptedImages()` is true, and would then try to decrypt a plain
JPEG. CA has `hasEncryptedImages` unset in `System.json`, so the branch does not apply. Worth knowing
before anyone turns encryption on.

Pruning is free: thumbnails live inside the generation directory, so retention deletes them with it.

### 1.4 Hooking the write

The thumbnail is written as part of a save, in `StorageManager.saveSlot`, alongside the manifest — the
same place and the same moment, so the two can never disagree about which generation they describe.

---

## Phase 2 — the modes (this is where the logic lives)

The scene has one list and four things selecting a row can mean. That is a strategy object, and putting
it here is what makes the entire feature testable despite living behind a scene.

`SaveFileMode` — the base class each mode extends:

| Member | Answers |
|---|---|
| `key()` | the command symbol, ex `'save'` |
| `label()` | the command's display text |
| `helpText()` | what the help window says while this mode is active |
| `isOfferedFrom(entryMode)` | whether this command appears at all, given how the scene was opened |
| `entries()` | the rows to show — slots for three of them, generations for Rewind |
| `isEntrySelectable(entry)` | Save allows empty slots; Load, Delete and Rewind do not |
| `requiresConfirmation(entryMode)` | everything except loading from the title screen |
| `confirmText(entry)` | including Delete's "this is permanent" wording |
| `execute(entry)` | do the thing; returns a promise where the underlying call does |

Four subclasses, one per command. `Back` is not a mode — it is a scene handler.

**Availability is a function of the entry mode only**, never of `$gameSystem`. This matters more than it
looks: `_saveEnabled` is an own enumerable field on `Game_System`, our codec seeds it, and nothing
declares it transient — so it **persists into savefiles**. Gating the menu's Save by toggling save access
around a platform would leak: the file captures `_saveEnabled: true`, and loading it later restores
saving-everywhere until the player touches another platform. Silent, and it would look like the gate
randomly stopped working. Keep the entry mode in the scene, where it lives and dies with the scene.

### Entry modes

Three of them — `platform`, `menu`, `title` — named for **where the scene was opened from**, not for
which commands they omit. Origin is the stable fact and it is the actual reason the sets differ; a name
like "without save" says nothing about what *is* offered, and stops being descriptive the moment a sixth
command exists.

The command set per origin lives in exactly one table, so changing what an origin offers is one row:

| Origin | Save | Load | Delete | Rewind |
|---|---|---|---|---|
| `platform` | yes | yes | no | yes |
| `menu` | no | yes | no | yes |
| `title` | no | yes | yes | no |

The main menu is the ordinary Start-button menu, opened anywhere menus are allowed, and Files sits in it
beside Equip and the rest. It offers Load and Rewind and no Save — saving stays the save platform's job,
and that is the whole point of having platforms.

**Delete exists only at the title screen.** It is the one irreversible thing here, and there is no reason
to hold a loaded knife mid-playthrough: nobody sets out to destroy a file while standing in a dungeon.
Putting it where you arrive with nothing loaded also means deleting can never interact with the game
currently in memory, which removes a whole category of question about what happens if you delete the slot
you are playing.

---

## Phase 3 — the windows

### 3.1 `Window_FilesCommand` — the left column

A `Window_Command` in `facetAreaRect()`'s left portion, width from `commandColumnWidth()`.

`makeCommandList` adds one command per mode where `isOfferedFrom(entryMode)` is true, then `Back`.
**The entry mode must be seeded in the `initMembers` hook** — `Window_Command.initialize` ends by
refreshing, which is what calls `makeCommandList`, so anything set in the constructor body arrives too
late and the list gets built against nothing.

### 3.2 `Window_FilesList` — the right list

A `Window_Command` (it is a list of selectable things with handlers) filling the rest of the facet area.

- **Two rows visible**, two slots by default. Both become plugin parameters later; hard-code sensible
  defaults now and do not build the parameter plumbing yet.
- Row height is therefore roughly half the facet area, which is what makes a 16:9 thumbnail comfortable
  rather than a squeeze.
- Each row draws: the thumbnail, the map name, the leader's name and level, gold, playtime, timestamp.
  All of it comes off `manifest.display`.
- An empty slot draws its slot number and nothing else. In Save mode it is selectable; everywhere else it
  is not.
- In **Rewind** mode the rows are generations, and they lead with **elapsed time** — "12 minutes ago" —
  because that is how people actually navigate this ("reload to five minutes ago"). The thumbnail rides
  along as confirmation rather than as the thing being read.

  **Wall-clock elapsed time is only useful within a session.** Computed from `savedAt`, a player who
  loaded a three-day-old save and immediately opened Rewind sees "3 days ago" on every row — three
  identical, useless labels. So: use the wall-clock delta while it is small, and past a threshold fall
  back to the **playtime delta** from `playtimeFrames`, which is the number that stays meaningful across
  sessions. "12 minutes ago" for the live case, "18 minutes of play earlier" for the resumed one.
  Playtime is also the secondary line in both cases, so the row never loses its absolute anchor.

Thumbnails are loaded lazily, per row, as it is drawn. Never up front for every slot.

### 3.3 `Window_FilesConfirm`

A small yes/no `Window_Command` centred over the list, text from `mode.confirmText(entry)`. Default cursor
on the safe option for Delete.

---

## Phase 4 — the scene

`Scene_Files extends Scene_MenuFacetBase`.

### Opening it

The engine's preparation helper runs **after** the push, because it operates on `_nextScene`:

```javascript
SceneManager.prepareNextScene = function() {
    this._nextScene.prepare(...arguments);
};
```

So `Scene_Files.prototype.prepare(entryMode)` stores the mode, and the correct order at a call site is
push-then-prepare — the reverse of what reads naturally. Rather than leave that trap lying around at
three call sites, wrap it in named statics and let nobody get it wrong:

```javascript
Scene_Files.callFromSavePoint = function()
{
  SceneManager.push(Scene_Files);
  SceneManager.prepareNextScene('platform');
};
```

…and `callFromMenu()` / `callFromTitle()` alongside it. Every entry point in Phase 5 calls one of these
three and nothing else.

- `create()` builds the command window, the list window, and the confirm window (hidden).
- Choosing a command sets the active mode, refreshes the list from `mode.entries()`, and activates it.
- Choosing a row either executes immediately or raises the confirm window first, per
  `mode.requiresConfirmation(entryMode)`.
- Cancel from the list returns to the command window. Cancel from the command window pops the scene.
- After a successful save: play the save SE, refresh the list so the new thumbnail and timestamp appear,
  and return focus to the command window. **Do not pop the scene** — the player is standing on a platform
  and may want to do something else. (Vanilla pops; this is a deliberate departure.)
- After a successful load or rewind: the scene is going away anyway, see the wiring below.

---

## Phase 5 — wiring the entry points

**No map data changes.** All 34 save platforms across 34 maps call common event 4, which ends in event
command `[352]`. Intercepting the command covers every one of them.

### 5.1 Save platform

`Game_Interpreter.prototype.command352` is `SceneManager.push(Scene_Save)`. Alias it to
`Scene_Files.callFromSavePoint()`.

### 5.2 Main menu

`Scene_Menu.prototype.commandSave` is vanilla (our CMS sets the handler but does not override the method)
and is also `SceneManager.push(Scene_Save)`. Point it at `Scene_Files.callFromMenu()`.

Note for JE: today the menu's save works anywhere the menu opens, and the menu opening only at platforms
is what enforces save points. Under the new scheme the menu offers Load and Rewind but not Save, so this
handler becomes a Files command rather than a Save command — rename the symbol and its help text.

### 5.3 Title screen

`Scene_Title`'s Continue handler pushes `Scene_Load`. Point it at `Scene_Files.callFromTitle()`.

### 5.3b Slot count

`DataManager.maxSavefiles()` returns **20**. The scene renders 2, and leaving those two numbers
disagreeing causes two real problems:

- `DataManager.selectSavefileForNewGame` picks the first empty slot across `1..maxSavefiles()` and stamps
  `$gameSystem.setSavefileId` with it. It can land on slot 3 — a slot the scene never draws and Rewind
  can therefore never reach.
- The `DataManager.loadGlobalInfo` override J-Base-Save already owns loops the same range, reading 18
  absent manifests every time the list is built.

Override `maxSavefiles()` to the same constant the list window uses. One knob, both problems.

### 5.4 Three couplings to `Scene_Load` that will break silently

`Scene_Files` does **not** inherit from `Scene_Load`, so each of these needs handling:

1. **`Scene_Map.needsFadeIn`** checks `SceneManager.isPreviousScene(Scene_Load)`. That compares
   `_previousClass === sceneClass` — **exact constructor identity, not `instanceof`** — so inheritance
   would not have helped here anyway. Without an alias, the map stops fading in after a load and simply
   pops into existence. Cosmetic, silent, and the kind of thing blamed on something else three weeks
   later. Alias it to accept `Scene_Files` too.
2. **`Scene_Load.prototype.terminate`** calls `$gameSystem.onAfterLoad()` when the load succeeded. A great
   deal of plugin state re-applies there. `Scene_Files` must do the same.
3. **J-ABS aliases `Scene_Load.prototype.reloadMapIfUpdated`** (`src/plugins/abs/core/scenes/Scene_Load.js`)
   to force a map reload while JABS is enabled. J-ABS must keep that alias for projects without
   J-Base-Save, and add a `Scene_Files` one wrapped in `if (J.BASE.EXT.SAVE)` — the sanctioned
   cross-plugin optionality check. Both should delegate to a single J-ABS method so the behaviour is not
   written twice.

   **The guard alone is not sufficient.** `if (J.BASE.EXT.SAVE)` proves the *namespace* exists; aliasing
   `Scene_Files.prototype` needs the *class* to exist, which means J-Base-Save must have loaded first.
   Nothing declares that today — it works in CA only because the plugin list happens to order them that
   way. Add `@orderAfter J-Base-Save` to J-ABS's `_annotations.js`, or the guard passes and the alias
   throws the day somebody reorders their list.

   **`@orderAfter`, never `@base`.** J-ABS already declares `@base J-Base`, and the temptation to make
   this line match it is exactly wrong: `@base` is a hard dependency, and using it here would make the
   save plugin mandatory for J-ABS — destroying the optionality the guard exists to preserve.
   `@orderAfter` says "if it is present, load it first," which is the entire requirement.

Copy `Scene_Load`'s load sequence deliberately rather than by feel: `executeLoad`, `onLoadSuccess`
(sound, `fadeOutAll`, `reloadMapIfUpdated`, `goto(Scene_Map)`), `onLoadFailure`.

---

## Phase 6 — Rewind

Rewind is **loading an older generation. It is not a delete.** Non-destructive: the pointer stays where it
is, and the next save writes a new generation on top. The state that was rewound away from remains on disk
until retention retires it normally, so rewinding is itself undoable. Delete is the only destructive
command in this scene and it says so.

- Offered in-game — from a save platform and from the main menu — and never from the title screen, where
  there is no loaded game to rewind and no current slot to rewind within.

**There is no slot picker.** Rewind's rows *are* the generations of the slot the player is currently
playing, listed newest to oldest. Selecting one confirms, then loads it. This is the one command whose
`entries()` returns generations rather than slots, and it is why `SaveFileMode.entries()` exists as an
overridable member at all.

Which slot that is comes from `$gameSystem.savefileId()`, which is the only thing that knows. Two
qualifications, and they pull in opposite directions, so read both:

- **Use it to identify the slot.** With no picker there is no other source.
- **Do not use it alone to decide whether Rewind is offered.**
  `DataManager.selectSavefileForNewGame` stamps it at New Game with a *guessed* empty slot, before
  anything has been written, so it is non-zero for a playthrough that has never saved once.

The enable test is both halves together:

```javascript
const savefileId = $gameSystem.savefileId();

if (savefileId === 0) return false;

return SaveFileSystem.loadOrder(DataManager.makeSavename(savefileId)).length > 1;
```

### Loading one specific generation

`readSlot` deliberately always takes the newest generation that works, so Rewind cannot go through it.
Three pieces are needed, one per layer — miss the last and Rewind reads a file and does nothing with it:

1. **`SaveFileSystem.readGenerationAt(slotName, generationName, buildFromSections)`** — a public front
   door onto the existing private `readGeneration`. **No fallback.** The player picked this generation;
   silently handing them a different one is precisely the failure this scene exists to make visible.
2. **`StorageManager.loadGeneration(saveName, generationName)`** — mirrors `loadSlot`, routing the
   sections through `SaveSectionRouter.fromSections`.
3. **A `DataManager` entry point** mirroring `loadGame`, which is what actually performs
   `createGameObjects()` → `extractSaveContents(contents)` → `correctDataErrors()`. Without this the
   decoded contents are never applied to the running game.

Then the scene follows `Scene_Load`'s success path exactly as a normal load does — including
`$gameSystem.onAfterLoad()`, `reloadMapIfUpdated`, and `goto(Scene_Map)`.

---

## Testing

Everything in Phase 2 is a plain class with no PIXI in it, and that is deliberate — it is where all the
policy lives. Cover it properly:

- one `it` per branch, with inline `// Arrange` / `// Act` / `// Assert`
- every `isOfferedFrom` combination, all three entry modes
- `isEntrySelectable` for empty and populated slots in each mode
- `requiresConfirmation` — especially that title-screen load is the only false
- the Rewind enable rule against a slot with exactly one generation

For `SaveFileSystem`'s new thumbnail methods, extend the existing suite at
`test/plugins/_base/ext/save/save-storage-layer.test.js`, which already has an in-memory filesystem
fixture (`fixtures/install-fake-save-filesystem.js`).

**Build fixtures from the real caller, not from the implementation.** Four bugs in the save rewrite
survived files at 100% coverage because their mocks were shaped like the code under test rather than like
what the game actually passes. If you are writing a fixture, go read the call site first.

Wiring — `initMembers` chains reaching their base, `makeCommandList` building the rows it claims, handlers
leaving the cursor somewhere reachable — has a harness at `test/setup/rmmz-view-harness.js`. Read
`docs/testing-scenes-and-windows.md` before using it; the load order is unforgiving and two of the steps
fail somewhere that looks unrelated to the cause. Text-metric layout stays untested regardless, because
`measureTextWidth` is faked.

Do not write tests that assert window geometry.

---

## Deliberately out of scope

- **Autosave.** It saves at moments the player did not choose, which is precisely what dissolves a save
  point into decoration. CA has 34 save platforms and that is the design. Generations already provide the
  recovery value without the erosion, which is why Rewind is a bonus rather than a load-bearing system.
- **Overwrite confirmation across playthroughs.** `SaveFileSystem.currentPlaythroughId(slotName)` compared
  against `$gameSystem.playthroughId()` would tell the save menu it is about to write over a stranger's
  game. Worth having eventually; not needed to ship this.
- **Plugin parameters** for slot count and visible rows. Hard-code 2 and 2.
- Deleting a single generation. Delete takes the whole slot, pointer first.

---

## Definition of done

- `bun run hotfix` green.
- Saving from a platform writes a generation with a `snapshot.jpg` beside it, and the row redraws with the
  new picture and timestamp without leaving the scene.
- Loading from the title screen loads with no confirmation and the map fades in.
- Loading in-game confirms first.
- Deleting removes the whole slot and the row goes empty. Deleting the last remaining save from the title
  screen leaves Continue correctly disabled — `DataManager._globalInfo` is in-memory and goes stale after
  a delete, so call `loadGlobalInfo()` once the removal succeeds.
- Rewinding to an older generation loads that exact generation, and the generation rewound away from is
  still present afterwards.
- The title screen shows no Rewind command and no Save command — not greyed ones.
- Uninstalling J-Base-Save leaves a project that still boots and saves through vanilla.
