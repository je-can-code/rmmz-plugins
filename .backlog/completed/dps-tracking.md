# DPS tracking

## Context

There is currently no way to answer "is this weapon overtuned" with a number. J-ABS-Metrics keeps
lifetime combat tallies, but every metric in it is a running total, a personal best, or a count. DPS
is none of those — it is a rate, and a rate needs a clock and a window that the metrics ship has no
concept of.

The instrument has to work in live combat on real maps, not against a training dummy, because that is
how the game is actually played and tuned.

## Two numbers, not one

Plain damage-over-elapsed-time misleads in an ARPG, because it silently averages in the time spent
dodging, repositioning and waiting on cooldowns. A slow heavy weapon and a fast light one can tie on
one measure and be nowhere near each other on the other, and that gap is the finding.

- **Rolling ("Now")** — damage over the last N seconds of *combat time*. How hard the current
  loadout is hitting, right now.
- **Encounter** — damage over the whole fight, from first landed hit to last landed hit.

### Window length

**Five seconds**, not fifteen. Once the window outlasts a typical encounter it stops being a rate and
becomes a smoothing filter: three seconds of swinging over a fifteen-second denominator reads as a
fifth of the real output. Most encounters in CA are short, so the window must be shorter still or it
never converges inside a fight.

### The clock only runs in combat

The rolling denominator advances only while `$gameParty.anyMemberInCombat()` is true. Out of combat
the clock freezes, so the gauge holds its last reading instead of bleeding to zero on the walk to the
next fight.

An encounter **opens on the first landed hit** that passes the filters below, and the rolling
denominator is `min(windowFrames, combatFramesSinceEncounterOpened)` floored at 60 frames.

Both clamps are load-bearing and they fix opposite failures. Without the `min`, the first five seconds
of every fight divide by a window that has not filled yet, and the gauge underreports exactly when it
is being watched hardest. Without the floor, the very first hit of a fight divides by roughly one
frame — a 100-damage opener would read as 6000 DPS before settling. One second of deliberate
underreporting is the cheaper error: it decays into correctness within the first second rather than
opening every single fight with a garbage number.

### The combat flag is a lagging signal

`JABS_Battler.enterCombat()` refills `_inCombatCountdown` to 600 frames, and `_maybeShortenCombatTail`
compresses it to 120 only once `JABS_AiManager.anyLivingEnemiesAggroedToParty()` goes false. So the
flag drops somewhere between 2 and 10 seconds after the fight actually ended.

Consequence: the flag decides **when to close and report** an encounter. It does not supply the
encounter's end timestamp — that is the last landed hit. On a six-second fight, letting the tail into
the denominator would roughly halve the figure.

Known and accepted for v1: the rolling gauge keeps ticking through the tail, so "Now" partly decays
before it freezes. Gating the clock on `anyLivingEnemiesAggroedToParty()` instead is the alternative
if that proves annoying in practice. Not solving it up front.

## Two ships

This follows existing precedent rather than inventing a split: `abs/ext/food` owns the food chain
model and `hud/ext/food` draws it; `abs/ext/boss` and `hud/ext/boss` pair the same way.

| Ship | Path | Owns |
|---|---|---|
| `J-ABS-Dps` | `src/plugins/abs/ext/dps/` | The tracker. No UI. |
| `J-HUD-Dps` | `src/plugins/hud/ext/dps/` | The window. Reads the tracker, draws three lines. |

Combat telemetry is an ABS concern. Keeping the tracker out of the HUD ship means a later consumer —
a post-fight summary scene, an export, a metrics variable — does not have to depend on a HUD plugin
to read combat data.

## Data model: record hits, derive everything

The tracker holds a list of landed-hit events, not a set of running counters:

```
{ combatFrame, casterUuid, skillId, hpDamage, critical }
```

Every display figure is a derivation over that list — rolling DPS filters by frame, the encounter
totals everything since it opened, attribution groups by `skillId`, per-actor groups by `casterUuid`.
This is the whole answer to future state: nothing planned below requires reshaping what v1 records.

Hits from **every party caster** are recorded and displayed, allies included — `casterUuid` is what
the window's per-member rows group by.

The list is bounded by the encounter — it clears when a new encounter opens, so it never grows without
limit.

### Where the events come from

`JABS_Engine.prototype.postExecuteSkillEffects(action, target)` — the same seam J-ABS-Metrics uses,
after the result has landed on the target. Read `hpDamage`, `critical` and `evaded` off
`target.getBattler().result()`.

Four filters. Three are the ones metrics applies, for the same reasons:

- item slots excluded (`JABS_Button.Tool` / `JABS_Button.UsableItem`) — a thrown bomb is not a
  statement about the weapon being measured
- `evaded === true` excluded
- `hpDamage <= 0` excluded — heals arrive as negative damage and would walk the figure backwards

The fourth is specific to this ship: **the caster must be an actor.** Metrics never checks, because it
splits on the target and an enemy target means the party swung. That inference does not hold with
teams — an enemy striking another enemy arrives here with `target.isEnemy()` true, and without a
caster check its damage would land in the party's DPS.

`JABS_Button` needs no extra plugin dependency. It is defined in `abs/ext/input`, but `abs/core`
already compares against it in `JABS_SkillSlot.isItem()` and maps its key strings in
`initialization.js`, so anywhere J-ABS runs at all, the constants are there.

### The tick

A per-frame `update` hooked onto `JABS_Engine.prototype.update` — not `Scene_Map` — so the tracker
runs whether or not the HUD ship is installed. It does two things: advance the combat-time clock when
the party is in combat, and edge-detect the flag falling to close the current encounter and promote it
to "last".

### Where the tracker lives

On `JABS_Engine`, not in a new global. No `abs/ext/*` or `hud/ext/*` ship mints a `$` global of its
own — `$jabsEngine` and `$hudManager` are both core-ship globals — and the ext precedent is what
`abs/ext/food` does: alias `JABS_Engine.prototype.initialize` to seed the state, then expose accessors
on the engine, which is exactly how `hud/ext/food` reaches `getFoodChainPlanByUuid`. It also keeps the
ship clear of the rule that `globalThis.J ||= {}` is the only permitted `globalThis` write.

### Not saved

The tracker is ephemeral. No `SerializableRegistry` registration, no field on `Game_System` or
`Game_Party`. It exists for the session and nothing about it survives a load.

## The window

`Window_DpsFrame extends Window_Base` — the same base the food, party, boss, target and quest frames
use. `Window_Frame` exists to manage a sprite cache, and rows of drawn text need no sprites; only
`Window_InputFrame` actually earns it.

**One row per battle member**, in party order, with three columns:

```
            Now   Fight    Last
Jerald      842    1204     980
Rupert       93     201     644
```

- **Now** — that member's rolling 5s DPS
- **Fight** — their DPS across the encounter in progress
- **Last** — their DPS across the previous encounter

Party-wide rather than leader-only, and the reason is that a low number is itself the reading. Every
member shares one encounter clock — the same open and close, the same duration — so an ally who spent
the fight dead, stuck on terrain, or idling in a bush divides their small damage by the whole fight
and reads low. Give each member their own active-time denominator and that signal disappears, because
everyone looks fine over whatever slice of the fight they showed up for.

It also makes party cycling a non-issue. The encounter does not care who is holding the controller;
the hits are already keyed by `casterUuid`, so cycling mid-fight moves the player between rows that
are both being tallied anyway.

**Fight** and **Last** behave as a shift register, which is what "holds its reading" has to mean in
practice. When an encounter closes, its numbers stay in the **Fight** column and are only pushed into
**Last** when the next encounter opens on its first landed hit. So in the gap between fights the table
shows the fight that just ended beside the one before it, rather than blanking the column you most
want to read the moment the fighting stops.

Rows are drawn for the members present now; the rect is sized for `$gameParty.maxBattleMembers()` so
the window never has to resize when the party changes.

Wired the way every other HUD extension is: alias `Scene_Map.initHudMembers` for the storage slot,
`createAllWindows` to build it, a rect from plugin parameters, and respect `HudManager.canShowHud()`.

The rolling window length is a plugin parameter on `J-ABS-Dps` rather than on the HUD ship, because
the tracker is what does the arithmetic and it has to work with the window uninstalled.

Deliberately not in v1: per-skill attribution, encounter history, damage taken, logging. They are all
real ideas, but they are answers to questions that cannot be asked until there is a number on screen
to argue with. The event log makes each of them additive.

## Decisions

1. **Always visible.** No hide/show logic at all. The window draws whenever its enable parameter is on
   and `HudManager.canShowHud()` is true. Hiding out of combat was the original instinct, but it
   conflicts with both the "Last fight" line and the frozen gauge — the summary of the fight that just
   ended would never be readable, which is when it is most wanted. Player-facing hiding is future
   state, if this ever stops being a dev instrument.

2. **Everything in plugin parameters.** Geometry, the enable toggle, and the rolling window length all
   live in the ship's plugin parameters, matching every other HUD extension. The standing preference
   for config JSON exists so tunables can be reached from the data editor, and a `dps` block holding
   two scalars did not earn the three-repo footprint that would have come with it.

3. **One repo.** No `config.jabs.json` change, no JMZ editor schema change. `rmmz-plugins` alone.

## Future state

Each of these reads the same event list and adds no new recording:

- **Per-skill attribution** — what share of a fight each skill contributed. "The axe is fine, but 70%
  of its damage is one proc" is a different balance decision from "the axe is hot."
- **Encounter history** — the last N fights, scrollable, for comparing loadouts across a session.
- **Damage taken / incoming DPS** — the defensive mirror, same seam, `target.isActor()` branch.
- **Hits per second and damage per hit** — the two levers DPS multiplies out of; cheap to derive and
  they say *which* number is wrong.
- **Export** — dumping an encounter's events for offline comparison.

## Testing

The tracker is a service, so it tests directly: window arithmetic at the boundaries, the clock
freezing out of combat, the `min` denominator during window fill, encounter open/close edges, and
each of the three hit filters. Fixtures need a near-miss sibling on every identity filter — an item
slot beside a weapon slot, an evaded hit beside a landed one — or "matches this one" and "matches
everything" are the same program.

The window stays dumb enough that the harness covers only its wiring.

## Acceptance

- A row per battle member appears on screen during live combat, and the numbers move while fighting.
- They hold rather than decaying to zero once the fight ends.
- An ally who contributed nothing reads near zero rather than being absent or looking healthy.
- The last encounter's DPS reflects first-hit-to-last-hit, not the combat flag's tail.
- `bun run hotfix` green, coverage still 100%.
