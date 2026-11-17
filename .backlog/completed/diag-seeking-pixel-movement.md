---
completed: 2026-11-17
ship: J-ABS-Diagonals 1.1.4
---

# Seeking under pixel movement: turn at most once per tile travelled

## Severity

**Low to medium.** Seeking actions misbehave under J-Pixelistics today, and Chef Adventure runs pixel movement. Grudj's
seeking bolts (made dodgeable on purpose: "Make the homing bolts 'seek' though, not 'home' so they can be dodgable")
need it, as does every other seeker.

## Gain

A seeking action curves toward its target the way it does on a tile grid, at most 45 degrees per tile it travels,
instead of turning on every pixel. With tile movement nothing changes: a step there is already a tile.

## Decided with Jeremy (2026-11-16)

"seeking needed work with pixel movement so they don't move up to 45 degrees every pixel lmao". Grudj's bolts seek.

## Source

- `src/plugins/abs/ext/diag/objects/Game_Event.js` (J-ABS-Diagonals 1.1.3): `initDiagMembers` (the
  `this._j._abs._diag` namespace, re-created on every `initMembers`), `seekTarget` / `seekLastHit` (move-route
  commands), `seekTargetBattler`, `seekLastHitBattler`, `seekBattler` (reads `getCustomDirection()`, calls
  `gradualRotateToDirection(current, final)` and then `moveStraight(this.direction())` on EVERY call),
  `gradualRotateToDirection` (one `turnLeft45` / `turnRight45`).
- Why it breaks: the action event's move route repeats `seekTarget` every time the previous move completes. Under
  J-Pixelistics `Game_CharacterBase.moveStraight` moves a pixel distance (`moveStraightDistance`,
  `pixel/core/objects/Game_CharacterBase.js` ~line 740), so a "step" completes almost at once and the seeker turns
  45 degrees nearly every frame. `x` and `y` hold fractional tiles under pixel movement and whole tiles without it.
- Seeking actions in Chef Adventure: `Map002` ev37 "generic ranged (seeking)" (`seekTarget` in its route); the
  homing twin is ev36.
- Tests: `test/plugins/abs/ext/diag/objects/game-event.test.js` (`describe('initMembers / initDiagMembers')` at ~line
  113, `describe('seekBattler')` at ~line 840, `buildEvent`).
- Book: `docs/plugins/abs/ext/diag/overview.md`, "Seeking actions" ("turning 45 degrees once per step").

## Work

### 0. Reproduce it first, and stop if it doesn't

Jeremy said "I think", and nobody has watched it happen, so prove the bug before fixing it. The cause, as the probe
measured it (see Notes): J-Pixelistics' `updateRoutineMove` (`pixel/core/objects/Game_Character.js`) hands a JABS
action's route to the vanilla engine, skipping its own pixel repeat, and its `moveStraight` moves only one frame's worth
of distance, so every route command is one frame long. Action 37's route is `this.seekTarget()` then Move Forward, so
the seek, and its 45-degree turn, runs every other frame: every half tile at the bolt's speed 6. (This is not the
`moveRandom` cause; that one lives in the pixel repeat that actions skip.)

In CA, a one-off playtest probe (`dist/playtest/`, as the boss probes are written) fires a skill on action 37
(Map002 ev37 "generic ranged (seeking)") from Jerald at an enemy standing still five tiles off at an angle, and logs
the action event's `x`, `y` and `getCustomDirection()` every frame until it lands or expires. **Bug confirmed** if the
direction changes more than once inside one tile of travel. If it turns at most once per tile, stop: report the log to
Jeremy, and do not apply the rest of this plan. The log is also the "before" for the definition of done.

### 1. Remember where the seeker last turned

`initDiagMembers`, after `_initialDirection`:

```javascript
  /**
   * Where this event last turned while seeking, in tiles, or -1 on both axes before its first turn. A seeker turns
   * at most once per tile it travels, measured from here.
   */
  this._j._abs._diag._seekTurnX = -1;
  this._j._abs._diag._seekTurnY = -1;
```

New accessors, directly after `getCustomDirection`:

```javascript
/**
 * The x of where this event last turned while seeking, or -1 before its first turn.
 * @returns {number}
 */
Game_Event.prototype.getSeekTurnX = function()
{
  return this._j._abs._diag._seekTurnX;
};

/**
 * The y of where this event last turned while seeking, or -1 before its first turn.
 * @returns {number}
 */
Game_Event.prototype.getSeekTurnY = function()
{
  return this._j._abs._diag._seekTurnY;
};

/**
 * Records where this event just turned while seeking.
 * @param {number} x The x it turned at, in tiles.
 * @param {number} y The y it turned at, in tiles.
 */
Game_Event.prototype.setSeekTurnPosition = function(x, y)
{
  this._j._abs._diag._seekTurnX = x;
  this._j._abs._diag._seekTurnY = y;
};

/**
 * Whether this event has travelled at least a whole tile since it last turned while seeking, or has never turned.<br/>
 * Measured as a straight line, so a diagonal step (about 1.41 tiles) counts.
 * @returns {boolean}
 */
Game_Event.prototype.hasTravelledATileSinceSeekTurn = function()
{
  // an event that has never turned takes its first turn at once.
  if (this.getSeekTurnX() < 0) return true;

  const travelled = Math.hypot(this.x - this.getSeekTurnX(), this.y - this.getSeekTurnY());
  return travelled >= 1;
};
```

### 2. Turn only once per tile

`seekBattler` becomes (JSDoc gains the per-tile sentence):

```javascript
/**
 * Pursues the provided battler.
 * The rotation for this pursuit is gradual rather than instant like `.homeIntoBattler`: at most 45 degrees per tile
 * travelled. Under pixel movement a step is a pixel, and turning on every one would spin the seeker in place instead
 * of curving it toward its prey.
 * @param {JABS_Battler} battler The battler being pursued.
 */
Game_Event.prototype.seekBattler = function(battler)
{
  // a seeker turns at most once per tile it travels.
  if (this.hasTravelledATileSinceSeekTurn())
  {
    const currDir = this.getCustomDirection();
    const [ x, y ] = [ battler.getX(), battler.getY() ];

    // get the next direction to the target, diagonal directions included.
    const finalDir = this.findDiagonalDirectionTo(x, y);
    this.gradualRotateToDirection(currDir, finalDir);

    // the next turn waits for another tile from here.
    this.setSeekTurnPosition(this.x, this.y);
  }

  this.moveStraight(this.direction());
};
```

A seeker that cannot move (no Through, against a wall) no longer spins where it stands; it keeps pushing the way it
faces. Action events are normally Through, as the book already advises.

### 3. Tests, `test/plugins/abs/ext/diag/objects/game-event.test.js`

- `initMembers / initDiagMembers`: also expects `_seekTurnX` and `_seekTurnY` to be `-1`.
- New `describe('seek turn position')`: `setSeekTurnPosition(4.5, 7)` then `getSeekTurnX()` 4.5 and
  `getSeekTurnY()` 7.
- New `describe('hasTravelledATileSinceSeekTurn')`, one `it` per edge, the event's `x`/`y` set directly:
  1. never turned (`-1`): `true`.
  2. turned at (5, 5), now at (5.5, 5): `false`.
  3. turned at (5, 5), now at (6, 5): `true` (exactly one tile).
  4. turned at (5, 5), now at (5.6, 5.6) (about 0.85): `false`.
  5. turned at (5, 5), now at (5.8, 5.8) (about 1.13): `true`.
- `seekBattler`: the existing test keeps passing as the first-ever call (it turns, `gradualRotateToDirection(6, 8)`,
  then `moveStraight(2)`), and also expects the turn position to be the event's `x`/`y`. New: a second call with the
  event moved 0.25 tiles moves straight without turning (`gradualRotateToDirection` and `findDiagonalDirectionTo`
  not called, `moveStraight` called); a call after a whole tile turns again.

### 4. Docs

`docs/plugins/abs/ext/diag/overview.md`, "What is Seeking?": "turning 45 degrees once per step" becomes "turning at
most 45 degrees per tile travelled while moving toward the target (so under pixel movement, where a step is a pixel,
it still curves rather than spinning)".

### 5. PR time (not now)

J-ABS-Diagonals patch (a behavior fix, no new tags); changelog; restamp its book.

## Definition of done

- `grep -n "hasTravelledATileSinceSeekTurn" src/plugins/abs/ext/diag/objects/Game_Event.js` shows the predicate and
  its use in `seekBattler`.
- `bun run hotfix` green; coverage 100% on `src/plugins/abs/ext/diag/objects/Game_Event.js`.
- `bun run mutate src/plugins/abs/ext/diag/objects/Game_Event.js`: every survivor on the new lines explained.
- The step 0 probe, rerun after the fix: the logged direction changes at most once per tile travelled, and the bolt
  curves toward its target in a few wide turns where the "before" log showed it turning nearly every frame.

## Notes

Step 0 and the after-run, 2026-11-16, probe `ca/dist/playtest/seek-spin-probe.js` (gitignored; Map221, Jerald at
(6,12), the passive dummy at (11,9), skill 2276's note rewritten in memory to fire action 37, the bolt forced to face
down after spawn so it must come round 135 degrees):

- **Before:** turns 2→3→6→9 at f225, f227, f229: the full 135 degrees inside four frames, 0.46 tiles apart.
  Action 37 flies at speed 6 (a quarter tile per frame), and J-Pixelistics runs a JABS action's route vanilla (its
  `updateRoutineMove` skips the pixel repeat for actions), so `seekTarget` ran every other frame: every half tile.
- **After:** turns at 0.000, 1.000 and 2.000 tiles travelled, then straight into the dummy.
- A diagonal run of whole tiles sums to 0.999999999999998, so the predicate allows a millionth of a tile of slack;
  without it a diagonal turn waited an extra half tile.
- A probe measuring this must compare the path travelled between turns: each turn is logged after its own frame's
  step, so the straight line between two logged turns reads 0.943 across a 45-degree change.
- At this bolt's speed the fix halves the turn rate (every half tile to every tile). Slower bolts gain more: by the
  same arithmetic (unmeasured), a speed-4 seeker re-aimed every eighth of a tile. Whether Grudj's bolts are dodgeable
  is still a hall call.

**Watch in Grudj's hall:**
- Which way his bolts leave. In the probe the bolt spawned facing 6 while Jerald faced 2, which nothing here explains.
- A Through bolt that overshoots to the map edge now stays pinned there (it cannot travel, so it never earns another
  turn) until its duration ends; before the fix it would have turned back in. CA's only seeker, Map002 ev37, is
  Through, and no other map event seeks.
