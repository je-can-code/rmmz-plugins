# Respawn timers for JABS battlers

## Source

- `src/plugins/abs/core/managers/JABS_AiManager.js` (`convertEventToBattler`, `convertEventsToBattlers`)
- `src/plugins/abs/core/managers/JABS_Engine.js` (`handleDefeatedEnemy`, `addEnemyToMap`)
- `src/plugins/abs/core/objects/Game_Map.js` (`parseBattlers`, `refreshOneBattler`, `update`)
- `src/plugins/abs/core/objects/Game_System.js` (new registry lives here)
- New ship: `src/plugins/abs/ext/time/**`

## Context

Today a defeated enemy calls `defeatedTarget.setDying(true)`, the battler self-destructs on its next
update, and **nothing persists**. `Game_Map.setup` re-reads the event list on every map entry, so
leaving a map and coming back restores the entire population.

Two consequences:

- **Clearing a map means nothing.** The player kills forty things, steps through a door, comes back and
  they are all standing there again. The effort leaves no mark on the world.
- **Resource farming is a lap.** Chef Adventure's harvest nodes are ordinary JABS enemies, so a circuit
  of the Raevulaen Heartbeat yields roughly 309 items and can be repeated immediately, forever. Measured
  2026-08-29: 332 hittable things across seven maps.

The fix people reach for first is a per-day harvest cap. That is the wrong shape — it forbids something
rather than making it unnecessary, and it taxes the cooking loop to protect a problem the tier system
already contains. **A respawn delay solves it by making the lap pointless: the carrots are simply not
back yet.** It also buys the thing a cap never could, which is a world that remembers being cleared.

**This is generic.** It is not a resource-node feature — any battler can declare a respawn delay.

## The split

**`abs/core` owns respawn itself**, not merely a hook for it. Respawning is ordinary ABS behaviour and
core can express the whole simple case: *come back in N seconds.* Core needs no extension to be useful
and no knowledge that one exists.

**`abs/ext/time` owns calendar semantics.** It widens what a delay may say, from a count of seconds to
an appointment: *next morning*, *next Tuesday*, *next winter*. The extension aliases delay resolution;
core keeps working unchanged if it is absent.

## Work — core

1. **A registry on `Game_System`**, keyed `mapId` → `eventId` → the moment it returns. World state, not
   party state. Register with `SerializableRegistry`; a `Map` is already a registered codec type, so it
   survives saves. Read `docs/save-system.md` before adding the field.

2. **Alias `handleDefeatedEnemy`** to write the record. **The timer starts on death, immediately.** A
   player who wants to stand there and wait is welcome to; that is their time to spend.

3. **Alias `convertEventToBattler`** to skip any event whose record has not elapsed. This is the single
   chokepoint every enemy passes through, on both `parseBattlers` and `refreshOneBattler`.

4. **Tick on the current map**, so things return while the player is standing there. Respawn must not be
   a map-transition effect. `Game_Map.prototype.refreshOneBattler(event)` already drops the stale
   battler and re-runs the conversion, so aliasing `Game_Map.update` to sweep expired records and
   refresh those events is enough. Do not scan every frame — throttle the sweep, or hold the next
   expiry and only look when it passes.

## Work — the tags

**Resolution order is `global default < enemy note < event comment`**, exactly as `<level:N>` already
behaves. A plugin parameter sets the world default, an enemy sets its species' habit, and a single
placement overrides both — so one particular vein can be rarer than its siblings without touching the
enemy.

| Tag | Meaning |
|---|---|
| `<respawn:N>` | return after N seconds |
| `<noRespawn>` | **never returns** |

`<noRespawn>` is not an edge case, it is the point of having tags at all. That rare Pink Mousse the
player just killed is gone. Permanently. The world is allowed to be poorer for what they did to it.

It also means the registry stores permanence, not just pending timers — a never-returning enemy is a
record that must survive every save from now on.

## Work — `abs/ext/time`

Aliases the delay resolution so a tag may name an appointment instead of a duration. Same tag, richer
grammar — `<respawn:morning>`, `<respawn:tuesday>`, `<respawn:winter>`.

Depends on `J-TIME` for the calendar. That is a cross-plugin dependency, permitted via the single
`if (J.TIME)` namespace check, which is the sanctioned exception.

## What the existing `Spawn Enemy` command already gives us

`JABS_Engine.addEnemyToMap` (behind the **Spawn Enemy** plugin command) deep-copies an event off the
enemy clone map, appends it to `$dataMap.events`, builds a `Game_Event`, then calls
`$gameMap.addEvent()`, `flagBattlerForAdding()` and sets `requestBattlerRendering = true`. The command
then fires `requestAnimation(spawnAnimationId)` on a 50ms delay.

**That solves two problems this feature would otherwise have to solve itself:**

- **Inserting a battler mid-map with no transition** is exactly `flagBattlerForAdding()` plus
  `requestBattlerRendering`. The tick does not need new machinery.
- **The arrival animation already has a path.** Reuse `requestAnimation` so a node shimmers back into
  existence rather than blinking, which is the difference between a respawn and a rendering glitch.

**But respawn must not clone.** A spawned enemy is a *new* event; a respawned one is an *existing* event
whose battler was destroyed. Its entry is still in `$dataMap.events`, so `refreshOneBattler(event)` is
sufficient and the clone map is irrelevant.

**And it warns about a real hazard.** Spawned clones take appended indices (`$dataMap.events.length`)
which evaporate on the next map setup, so an id recorded today can belong to something else tomorrow.
**The registry must ignore dynamically-spawned battlers** and track only originally-authored events.

## Open questions

- **Which clock does core count in.** Playtime frames is dependency-free and pauses with the game.
  Real seconds would keep running while the player is in a menu or away, which is probably wrong for a
  single-player game.
- **Visual arrival.** Which animation, not whether — `Spawn Enemy` already proves the path. A crop
  probably wants something different from a wolf.
**Bosses are already solved and need nothing.** Every boss carries a switch, and once it flips the
event's active page has no `<enemyId>` on it. `convertEventToBattler` reads the active page, finds no
enemy, and respawn is never consulted — the boss stopped being a battler rather than becoming one that
declines to return.

That draws the line between the two mechanisms cleanly:

- **A switch** is for the story-significant one-off, where the *event itself* becomes something else
  afterwards — a corpse, an empty throne, nothing at all.
- **`<noRespawn>`** is for the rare-but-numerous, where a dedicated switch per creature would be absurd
  and you simply want the species to be finite with the bookkeeping handled for you.

One hygiene note: an event killed *and* switched writes a respawn record that will never be read again,
since the event is no longer a battler. Harmless, but such records accumulate in the save forever.
Worth deciding whether the registry prunes entries whose event no longer resolves to a battler.

## Notes

- **Partial clears persist for free.** Kill three of ten and those three stay down while the other seven
  are still standing. That is the intended feel and falls straight out of per-event tracking.
- Deliberately **not** started as of 2026-08-30 — Jeremy wants the current Chef Adventure data work
  merged before this touches the plugin tree.
