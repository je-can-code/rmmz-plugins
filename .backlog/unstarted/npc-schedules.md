# Townsfolk schedules: NPCs who walk the clock

## Status

Unstarted, and parked until after Chef Adventure 1.0. Jeremy raised it on 2026-11-02, asking whether Majora's Mask
style schedules were viable, and parked it the same day: "that seems like a huge thing to add with just under two
months to finish the rest of 1.0.0 CA ... Lets park it for now". He expects it to cover the whole town once it
exists: "I feel like ALL of them will end up moving once I have something in-place."

## Severity

**Low.** Nothing is broken. The town works today with townsfolk who stand where their story switches put them.

## Gain

Raevula's townsfolk keep a daily routine and walk between its stops as J-Time ticks. Show up at 17:47 and Treis is
partway down the road to the Red Baron, because she is due at the bar at 18:00. That is the feel of Majora's Mask's
Clock Town and of Ephemeral Fantasia, and it replaces the only thing the engine offers today: an event page whose
time condition lapses, so the NPC vanishes where they stand and reappears somewhere else.

## Source

- J-Time: `src/plugins/time/core/` (`Game_Time`, the page and choice tags in `J.TIME.RegExp`,
  `Scene_Base._noTimeScenes` in `scenes/Scene_Base.js`, the `<timeBlock>` check in `scenes/Scene_Map.js`)
- `src/plugins/_base/core/core/TilePathSearch.js` (`firstStep`, the A* every path search in the game shares)
- `src/plugins/abs/core/managers/JABS_Engine.js` (how J-ABS deep-copies `$actionMap` events onto the live map) and
  `src/plugins/abs/core/objects/Game_Map.js` (`addEvent`, and the index-is-id invariant documented on it)
- `ca/chef-adventure/js/rmmz_objects.js`: `Game_Event.prototype.updateSelfMovement`
- `ca/chef-adventure/data/`: the town maps (Map020-023, Map335, Map336 and the interiors), `CommonEvents.json`
  CE 10 "Inn Sequence", and the J-Time parameters in `js/plugins.js`
- `ca/docs/quests/`: `NE-raevula/scientist.md`, `NE-raevula/archaeologist.md`, `SW-raevula/adventurous-duo.md`,
  `SE-raevula/city-guard.md`, `tbd-ledger.md`

## Context

Measured 2026-11-02. Treat it as a snapshot and re-measure before starting.

**Nothing in town reads the clock.** Across every map under Map119 (Raevula and its region), J-Time drives two things:
256 light pages (`time-lantern`, `time-walltorch`, `time-candle`, `time-fireplace`, all `<hourRangePage:18-5>`)
and monsters (wolftraps on `<timeRangePage:4:00-16:00>`; kappas, bats, brood and ghosties at night). No NPC reads
the time by any route checked: J-Time page and choice tags, `<weatherTypePage>`, page conditions and conditional
branches on variables 121-130 (where J-Time mirrors the clock), Control Variables copies of those variables, `\V[n]`
text codes naming them, and scripts, script calls and move routes naming them or `$gameTime`. That covers every
event in the region and all of `CommonEvents.json`.

**The quest docs already want it.** Treis at the Red Baron's bar during the night (`scientist.md`), Kayla grinding
bearcats at night (`adventurous-duo.md`, a pitch), Cecil's night patrol (`city-guard.md`, `tbd-ledger.md`), and
Cerak splitting his days between the Save Shrine and the Ravine camp (`archaeologist.md`).

**Townsfolk are one event per map.** A character who appears in two places is two events, each gated by story
switches. Beside most of them sits a `quests: <npc>` scaffolding event (19 events on 12 maps, written 2026-09-08)
whose pages Jeremy plans to fold into the real NPC events. Five townsfolk events use self-switches: both Viktors
(Map031 ev10, Map032 ev6), Viskra (Map032 ev1), Alice (Map033 ev2) and Amy (Map335 ev1).

**Treis is the worked example:** 11 events on 10 maps, every one gated by a story switch. Only the first and third
rows are in town.

| Event | Where | Shown while |
|---|---|---|
| Map031 ev2 | Red Baron, Main Bar Area | from the start until sw17 "escaped mines" |
| Map176 ev1 | Erocia Isthmus, Southern Exit (flooded) | until sw75 "enable bombs" |
| Map029 ev1 | Comfy Bear, Comfy Embrace | sw75 "enable bombs" until sw86 "chapter 3 begins" |
| Map212 ev1, Map217 ev1 | Erocia Isthmus, both exits | until sw88 "erocia isthmus done" |
| Map249 ev1 | The Bellows, Backroom | until sw123 "cynder joined" |
| Map240 ev17 | Highwater Way, Southern Way | sw123 "cynder joined" until sw131 "north to the kingdom" |
| Map246 ev40, Map258 ev6, Map284 ev29 | The Bellows, Onto the Kingdom, the Throne Room | sw122 "treis-visible", which scenes switch on and off around themselves (Map240 ev22, Map246 ev41, Map258 ev4, Map284 ev35) |
| Map258 ev7 | Onto the Kingdom | sw132 "enter the castle" |

She is never a party member: no actor in `Actors.json` is Treis, so her whole road trip is map events.

**The clock in walking terms.** J-Time advances 30 game seconds every 60 frames, so a game minute is 2 real seconds
and a day is 48 real minutes. A character moves `2^speed / 256` of a tile per frame (J-Pixelistics reads the same
`distancePerFrame`), and most townsfolk are authored at speed 3: 32 frames a tile, or 3.75 tiles per game minute.
Crossing a 40-tile section takes about 11 game minutes (21 real seconds), and a walk from 17:40 to 18:00 covers
about 75 tiles, roughly two sections. The town is six outdoor sections from 40x25 to 40x60 (Map020-023, Map335,
Map336) plus about a dozen interiors.

**What stops the clock, and what does not.** `Scene_Base._noTimeScenes` holds Boot, Splash, File, Save, Load, Title
and Gameover; `<timeBlock>` maps and the `stopTime` command also stop it. Everything else ticks: every menu, and
every message box, since dialogue runs inside `Scene_Map`. Inn naps (CE 10) jump the clock forward to morning or
evening with the `jumpToTimeOfDay` command.

**Vanilla stops walking off-screen.** `Game_Event.prototype.updateSelfMovement` only moves an event while
`isNearTheScreen()` is true, so an NPC sent down a long route by its own move type stops the moment the player
looks away.

## Design (proposed 2026-11-02)

Jeremy, on the two halves and the overrides below, the same day: "That seems about accurate, yeah." Anything else
here is a proposal.

### Derive positions from the clock; never simulate walkers

Each townsperson's whereabouts is a pure function of the time and their schedule. Entering a map places everyone due
there at the tile the function gives, mid-walk if they are mid-walk, before the first frame draws, so nobody pops in
on arrival. While they are near the screen they step toward the next derived tile so it reads as walking; away from
the screen they are simply placed.

Simulated walkers would fall behind their schedule every time the map stops updating while the clock keeps going
(any menu, any conversation) and every time the clock jumps (inn naps). Derivation makes all of those free: closing
a menu, waking from a nap or loading a save re-places everyone from the current time, and nothing about a walk
needs saving.

### Two halves: where and when in config, what they say in events

- **Where and when is external config:** each NPC's stops, when they leave for or reach each one, their walking
  speed, and what they do once there (stand facing something, putter within a small radius, perhaps a pose). The
  `bosses` block in `config.jabs.json` is the precedent, and an editor board can follow later.
- **Stops are named marker events** placed in MZ, such as `stop: treis-barstool`, and config refers to them by
  name. Proposal: it keeps placement visual and keeps coordinates out of the config entirely.
- **What they say stays in events.** Each scheduled NPC is one template event on a dedicated template map, the way
  J-ABS keeps skill visuals on `$actionMap`, and the plugin clones the template onto whichever map the schedule puts
  them on. Its pages carry dialogue, choices and quest commands, authored in MZ exactly as today. A new page tag
  lets a page ask "is she at this stop right now?" the way `<timeOfDayPage:night>` already asks about the hour.

### Schedule pages and overrides: when people should not be moving

- **A schedule has pages, like an event,** gated by switches, variables or quest state, and the highest page whose
  conditions hold wins. Story progress picks the routine.
- **An "away" page takes someone out of town while the story has them.** Treis's road-trip copies stay exactly as
  they are. Her town copies already bracket her absences (gone from the pub at sw17, at the inn from sw75, gone
  again at sw86 "chapter 3 begins"), and those same switches gate her schedule pages. sw122 is not that bracket:
  scenes flip it on and off around themselves. When the story brings her home, she is back on her routine,
  standing wherever the clock says.
- **Standing still is a one-stop schedule:** Viktor drunk at the Red Baron all day until his quest, or Silia in
  front of her house until chapter 4.
- **Anything that takes hold of an NPC beats the clock:** a Set Movement Route on them, or a `hold` command a scene
  issues. The scheduler leaves them alone until it ends or `release` is issued, then they walk back onto their
  schedule.
- **Story placement outside town does not change.** The switch-gated events Jeremy already writes keep doing that
  job; schedules only run everyday life.

### Doors and map edges are the seams

The plugin only ever paths on the map the player is standing on. A leg that changes maps goes through a door or an
edge at its scheduled time: on the map being left, the NPC walks into the door and is gone; on the map being
entered, they walk out of it. A schedule can also send someone through a door the player can never open, such as a
house or a back room, which reads as going home and costs nothing.

### Interruptions (proposals)

- **Talking.** A conversation locks the NPC while the clock keeps running: 30 real seconds of chat is 15 game
  minutes. Slack in the schedule absorbs most of it; past that, they walk faster until they are back on time.
- **Blocking.** If the player stands in the way, they wait a moment, then re-path around the player. Scheduled
  townsfolk pass through each other, so doorways never jam.
- **Menus.** The map freezes while the clock runs, so on return everyone snaps to their derived tile. The player
  was not watching.
- **Naps, loads and transfers** re-place everyone from the current time.

### Density is the lever for feel

At 3.75 tiles per game minute a walk lasts between a few seconds and a minute of real time, so one commute per NPC
per day means the player almost never sees anyone moving. Clock Town feels alive because many people move at once
and some are nearly always moving. Every townsperson scheduled (Jeremy's expectation), several legs a day each,
plus a few who barely stop (Cecil's patrol, say, or Mittens, or the kids) keeps someone in motion in every section.
The town already lights its lanterns at 18:00, so people heading home as they come on is atmosphere for free.

## Work

Plugin side, in this repo:

1. **Home and name.** An extension, most likely of J-Time. Jeremy's call; see Open questions.
2. **Schedule data.** Parse the config: per NPC, a template reference, a walking speed, and schedule pages, each
   with its conditions and an ordered list of timed stops and what to do at each.
3. **The resolver.** A pure service: given the time, the active schedule page and route lengths on the current map,
   answer which map the NPC is on, which tile, and whether they are walking or dwelling. Nearly all the logic lives
   here, and it is unit-tested directly.
4. **Whole routes.** Add a sibling to `TilePathSearch.firstStep` that returns the full path; the parent chain is
   already built. Size its search limit to the map, since J-Pixelistics' forty does not reach corner to corner on
   Map020 (40x60).
5. **Spawning.** Clone each due template onto the live map during map setup, honouring the index-is-id invariant on
   `Game_Map.addEvent`. `addEvent` is J-ABS's, so either event spawning moves into J-Base or the extension declares
   J-ABS as a dependency; see Open questions.
6. **The driver.** Per frame: near the screen, step toward the derived tile, hurrying when behind; away from the
   screen, place directly. Leave locked NPCs, forced move routes and held NPCs alone.
7. **Identity.** Key a clone's self-switches to its template, so they survive the NPC changing maps and spawning
   under a new event id.
8. **The stop page tag** for templates.
9. **Plugin commands:** `hold` and `release` per NPC, and whatever a scene needs to send someone somewhere off
   schedule.
10. **Tests** at 100%: the resolver and routes as pure code; spawning and the driver against real `Game_Map` and
    `Game_Event` instances.

Chef Adventure side:

11. **The template map.** A dev map holding one template event per scheduled townsperson. Move each town NPC there
    by copy and paste once its `quests: <npc>` pages are folded in. Merge town NPCs who are split across maps
    (Treis's pub and inn copies; Viktor at the Red Baron and the Metal Petal) into one template with schedule pages,
    then delete the per-map town copies.
12. **Stops.** Place `stop:` markers on the town maps.
13. **Schedules.** Author every townsperson's day, and the dialogue at each stop.
14. **Validator.** A check in CA's validator: every stop name resolves to a marker, every map-changing leg names a
    real door, and every walk fits its time window at the NPC's speed. `tools/map-atlas.js` already walks the door
    links. A picture of each NPC's day drawn over the map renders would make review easy.

Editor, later, as its own `editor-` item if wanted:

15. A schedules board in jmz-data-editor once the config shape settles.

## Until then: 1.0 loses nothing

- The night scenes the quest docs want work today with J-Time page tags, one event per place: Treis at the pub at
  night, Kayla's grind, Cecil's patrol. They pop instead of walking, and become schedule stops later.
- Folding the `quests: <npc>` pages into the real NPC events, as planned, is not wasted: a finished town event moves
  to the template map by copy and paste.
- Story placement outside town is untouched by any of this.

## Open questions

1. Where the extension lives and what it is called.
2. The config file: its own `config.*.json`, or a block in an existing one.
3. Stops as marker events placed in MZ, or placed on an editor board.
4. What "hang out" covers: standing and facing, a small wander, sitting, poses.
5. Whether the clock should stop during dialogue at all, a call wider than this item, or townsfolk catch up after.
6. Map-changing legs: the schedule names every map it passes through, or a door graph baked from the map data
   works out the hops.
7. One routine every day, or variants by day of the week or season. J-Time tracks both.
8. Who goes first. The quest docs already want Treis, Cecil, Kayla and Cerak on the clock.
9. Event spawning: moved into J-Base, or a declared dependency on J-ABS.

## Risks and unknowns

- **Saving spawned events.** Check how J-Base-Save treats events added at runtime; J-ABS's loot and action events
  are the precedent to read. Nothing about a walk needs saving, but a clone must not come back from a load as an
  event with no data behind it.
- **Pixel movement.** J-Pixelistics characters sit between tiles, so the driver has to land walkers on their derived
  tiles without fighting its collision. #126 already rounds path searches onto the grid.
- **The hurry speed** has to look natural. How much faster, and whether to cap it, is an in-engine feel call.
- **Scenes in town that move a scheduled NPC by hand** should `hold` them before the first move route, or the
  scheduler and the scene can fight over the first frame.

## Sizing

Estimated 2026-11-02 at about the size of #126 (the shared A* and off-screen sprite sleep, +2.7k net source and test
lines): a few active hours of building at this repo's measured throughput, padded because NPCs that walk on their
own are a new code shape here. That is the cheap half. The expensive half is Chef Adventure's: every townsperson's
day, the dialogue at each stop, and moving each town NPC onto a template, across the whole town.

## Definition of done

- [ ] `bun run hotfix` green and coverage still 100%
- [ ] in game: at 17:47 in the Northeast Section, a scheduled NPC is partway along a route and walks it to the stop
      they are due at
- [ ] in game: entering a map mid-schedule finds everyone already in place, and nobody appears or vanishes in view
      except through a door or a map edge
- [ ] in game: open the menu for half a minute mid-walk and close it; the walker is further along, never behind
- [ ] in game: talk to a walker for a while; afterwards they catch up and reach their stop on time
- [ ] in game: nap at the Comfy Bear; everyone is where the new time says
- [ ] in game: save mid-walk and load; everyone is placed from the clock, with no duplicates
- [ ] in game: pass a story switch that takes an NPC out of town (sw86 "chapter 3 begins" for Treis); they are
      gone from town, and back on their routine when the story brings them home
- [ ] in game: a scene that moves a scheduled NPC plays untouched, and they rejoin their schedule afterwards
- [ ] CA's validator passes, and fails on a stop name with no marker

## Notes

- 2026-11-02: item created at Jeremy's request, parking the idea with its design captured.
- 2026-11-02, a related finding not yet discussed: Chef Adventure's `docs/story-canon.md` says the game spans "~10
  in-game days / ~20 hours of playtime". That roughly matched the 10x clock CA ran until 2026-09-23 (about 8 days).
  At 30x, 20 hours is about 25 in-game days before any naps, which is also how many times a player would see each
  routine.
- Related: `time-save-data-vs-runtime-manager.md` covers J-Time's save shape and tracks retiring the `$gameTime`
  global, so read the clock through whatever accessor survives that.
