# J-Motion

## Severity

**Medium** — a new ship with no plugin dependencies, but the map data of 183 files depends on the
feature existing.

## Gain

**High.** Gives every character sprite on the map a declarative motion vocabulary, gives combat a
place to hang reactive effects, and gives `abs/ext/juice` a home to move into.

---

## 1. What this is

A character on the map is a static sprite that slides between tiles. J-Motion makes it move on its
own: breathing, floating, swaying, spinning, flickering, flashing, tinting, swelling when it gets
angry and shaking when it gets hit.

An author declares motion **on the thing that should have it** — an event page today, a state and
a skill tomorrow — and the plugin composes every live declaration into one set of sprite
transforms per frame.

It is presentation only. Nothing it does affects gameplay, collision, or the save file.

---

## 2. Requirements

**Authoring**

- Declare a motion with a comment tag on an event page. It runs while that page is active and
  stops when the page changes.
- Declare several on one page. They compose rather than replace.
- Every motion works with zero parameters and looks right at its default.
- Every parameter is expressed in **author units** — pixels, degrees, frames, a colour — never in
  per-frame deltas.
- A motion may be declared from a plugin command mid-cutscene and removed again.

**Behavior**

- Two characters with the same motion must not animate in lockstep. A room of thirty breathing
  enemies has to look alive, not choreographed.
- ...unless the author wants lockstep, which must also be expressible.
- A motion removed by one source must not disturb motions from another source.
- A reactive effect must be able to take over a channel for its duration and hand it back.

**Constraints**

- Nothing persists into a savefile.
- Cost must be acceptable with several hundred events on a map, so per-frame work is arithmetic on
  a handful of numbers and nothing else.
- The ship depends on J-Base and on nothing else. It must run with J-ABS absent.

---

## 3. Design

### 3.1 Sources and declarations

A **declaration** is `{ type, parameters, sourceKey }` — plain data, no behavior.

The source key says who asked for it, and is the unit of removal:

| Source key | Declared by | Lives until |
|---|---|---|
| `page` | an event page's comment tags | the page changes |
| `command` | a plugin command | a Remove command, or its optional duration elapses |
| `state:<id>` | a battler state *(ext)* | the state is removed |
| `combat:<n>` | a reactive combat effect *(ext)* | the extension removes it |

Removal is always **by source**. `removeDeclarations(character, 'state:42')` cannot touch the
page's declarations. This is the property that makes multiple independent systems able to animate
one sprite without knowing about each other.

### 3.2 Channels

A channel is one property of the sprite an effect can write. Every channel has a combine rule,
because several declarations can reach the same one:

| Channel | Unit | Combine | Identity |
|---|---|---|---|
| `offsetX` | pixels | sum | `0` |
| `offsetY` | pixels | sum | `0` |
| `rotation` | radians | sum | `0` |
| `scaleX` | multiplier | multiply | `1.0` |
| `scaleY` | multiplier | multiply | `1.0` |
| `opacity` | multiplier | multiply | `1.0` |
| `hue` | degrees | sum, wrapped to `0..360` | `0` |
| `tint` | `[r,g,b]` | per-component multiply | `[255,255,255]` |
| `tone` | `[r,g,b,gray]` | per-component sum, clamped `-255..255` | `[0,0,0,0]` |
| `flash` | `[r,g,b,a]` | highest alpha wins | `[0,0,0,0]` |

Multiply for scale and opacity is deliberate. A state that makes an enemy 1.5x and a breathe that
swells it 1.05x should produce 1.575x, not 2.55x. Two flashes should not stack to double white,
so `flash` takes the strongest rather than the sum.

`tint` is free — it is PIXI vertex colour. `hue`, `tone` and `flash` go through RMMZ's
`ColorFilter`, which is created lazily on first use and then **never removed for the life of the
sprite**, costing that sprite its own render pass from then on. Reach for `tint` when a flat
multiply will do.

### 3.3 A declaration is a statement of state

**Every motion runs for exactly as long as its declaration exists.** Nothing expires on its own,
nothing fires once. `<motion:[shake]>` on a state means *this thing shakes while afflicted*, and
it shakes until the state is gone. `<motion:[hop]>` means *this thing hops*, forever, not once.

This is what "ambient" means, and it is the whole model: a declaration describes a condition, and
the condition ends when whoever declared it says so. No effect ever writes back to a declaration
set, which means there is no path by which `Game_Map#refresh` — which fires on any self-switch
anywhere on the map — can replay something.

Timed motion is therefore a property of the **applier**, not of the effect. The Apply Motion
plugin command takes an optional duration and removes its own declaration when it elapses; the
combat extension does the same for a hit reaction. Neither needs core to know what a duration is.

Effects come in two shapes, which is all the composer needs to distinguish:

| Shape | Behavior | Types |
|---|---|---|
| **continuous** | cycles forever off a frame counter | breathe, stretch, pulse, float, sway, swing, spin, ghost, flicker, throb, flash, shake, hop |
| **transition** | eases to a target over a duration, then holds there | scale, angle, fade, hue, tint |

A transition's `duration` is how long it takes to *arrive*, not how long it lasts. Once arrived it
holds indefinitely, like everything else.

**Transitions ease out when removed.** A removed transition is kept alive by the composer, running
in reverse over its own duration, and discarded when it reaches identity. Continuous effects stop
immediately instead, because they oscillate around identity anyway and the worst case is a few
percent of scale. A `scale 150` snapping to `100` the frame a state drops is very visible; a
`breathe` caught at the top of its cycle is not.

### 3.4 Override claims

An effect may **claim** a channel instead of contributing to it. While claimed, other
contributions to that channel are discarded and the claimant's value is used directly.

When two effects claim the same channel, the higher-priority source wins:

```
combat  >  command  >  state  >  page
```

Ties inside one priority go to the most recently declared.

This is the seam the combat extension uses. A hit-squish claims `scaleX`/`scaleY` for twelve
frames while the enemy carries on swaying and ghosting on the channels it did not claim, then
releases them and the ambient breathe resumes from where it had got to.

### 3.5 Desync

Every continuous effect rolls a **random phase offset** in `0..period` when it activates. Two
enemies with identical declarations therefore sit at different points in the same cycle.

Phase is randomised; **amplitude is not**. A room where everything breathes by the same amount at
different times reads as alive. A room where each thing breathes by a different amount reads as a
mistake. Authors who want deliberate lockstep — a row of pistons, a chorus — pass `sync` as the
final parameter to pin the phase to zero.

Re-declaring an **identical** set of declarations for a source preserves the existing effect
instances and their phase. This matters because `setupPage` fires on every `Game_Map#refresh`, and
without it a self-switch anywhere on the map would make every enemy snap mid-breath.

### 3.6 Who owns what

The **composer** owns everything, in a `WeakMap` keyed by character:

```
character -> { declarationsBySource, liveEffects }
```

Characters hold no motion state at all. This is not the repo's usual `this._j.*` convention, and
the reason to break it is that motion is presentation with no persistence: keeping it off the
character means there is no field for the save encoder to find, no transient declaration to write,
and no way for a future field to be persisted by accident. The failure mode is unrepresentable
rather than guarded against.

**The sprite drives the frame.** `Sprite_Character#update` asks the composer for its character's
composition; the composer ticks that character's live effects and returns the composed channels.
Work therefore happens once per sprite per frame, only for characters that have a sprite, and
nothing needs a global registry or a scene-teardown flush.

---

## 4. The effect roster

Eighteen author-facing types over five implementations. The roster is **data** — a registry
mapping a type name to an implementation, a channel binding, and default parameters — so adding
`sway` after `float` exists is a table row, not a class.

All periods and durations are in frames. All angles are in degrees at the authoring surface and
converted to radians at the channel.

### 4.1 Oscillators

One implementation, `OscillatorMotionEffect`, driven by:

```
phase = (frameCount + phaseOffset) / period
wave  = sin(2π × phase)            // -1..1, centred
rise  = 0.5 - 0.5 × cos(2π × phase) // 0..1, unipolar
```

| Type | Channels | Parameters (defaults) | Formula |
|---|---|---|---|
| `breathe` | `scaleY`, `scaleX` | `amount` 0.05, `period` 150 | `scaleY = 1 + amount×wave`, `scaleX = 1 − amount×wave` |
| `stretch` | `scaleY` | `amount` 0.05, `period` 150 | `scaleY = 1 + amount×wave` |
| `pulse` | `scaleX`, `scaleY` | `amount` 0.05, `period` 150 | both `= 1 + amount×wave` |
| `float` | `offsetY` | `distance` 12, `period` 180 | `offsetY = −distance × rise` |
| `sway` | `offsetX` | `distance` 6, `period` 200 | `offsetX = distance × wave` |
| `swing` | `rotation` | `angle` 8, `period` 170 | `rotation = angle × wave` |
| `ghost` | `opacity` | `min` 0.25, `max` 1.0, `period` 240 | `opacity = min + (max−min) × (0.5 + 0.5×wave)` |
| `throb` | `tone` | `red` 0, `green` 0, `blue` 80, `gray` 0, `period` 120 | `tone = [red, green, blue, gray] × rise` |
| `flash` | `flash` | `color` `#ffffff`, `period` 40 | `flash = [...color, 255 × rise]` |

`float` uses `rise` rather than `wave` on purpose: a floating thing hovers **above** its tile and
returns to it, rather than sinking through the floor for half of every cycle. Its rest position is
the ground, not the midpoint.

`breathe` counter-scales on X to suggest volume; `pulse` scales both the same way, which reads as
a heartbeat rather than a breath. `stretch` is the cheapest of the three and the least organic.

`throb` takes its tone as four positional components rather than a colour literal, because a tone
runs `-255..255` per channel and carries a fourth greyscale term. Neither is expressible as a
colour, so `<motion:[throb, 0, 0, 80, 0, 120]>` is the honest form.

### 4.2 Spin

`SpinMotionEffect`, continuous, its own implementation because it accumulates rather than
oscillates.

| Type | Channels | Parameters | Formula |
|---|---|---|---|
| `spin` | `rotation` | `period` 120, `direction` `cw` | `rotation = 2π × direction × (frameCount + phaseOffset) / period` |

`period` is frames per full revolution. It carries the same random `phaseOffset` as the
oscillators, so a row of spinning coins starts at different angles.

Rotating a character sprite about its default anchor `(0.5, 1)` orbits it around its own feet,
which is wrong for a spin. So spin sets a `centerRotation` flag on the composition, and **the
apply step honours it** by moving the anchor to `(0.5, 0.5)` and adding half the sprite height
back to `y`. The compensation has to live sprite-side because the composer works from the
character and cannot know the sprite's height; `abs/ext/juice` already carries the same
compensation for its flip effect, so there is precedent to match.

`swing` deliberately does not set the flag — swinging about the feet is what makes a hanging sign
or a standing reed read correctly.

### 4.3 Jitter

`JitterMotionEffect`, continuous. Holds a random value for `interval` frames, then rolls a new
one. Two bindings, which are the same behavior on different channels.

| Type | Channels | Parameters | Behavior |
|---|---|---|---|
| `shake` | `offsetX`, `offsetY` | `strength` 4, `axis` `x`, `interval` 1 | each roll: `strength × random(−1..1)` per enabled axis |
| `flicker` | `opacity` | `min` 0.6, `max` 1.0, `interval` 6 | each roll: uniform in `min..max` |

`interval` is what separates a vibration from a tremble: `1` re-rolls every frame and buzzes, `6`
holds each value long enough to read as a stutter.

### 4.4 Bounce

`BounceMotionEffect`, continuous. An arc, then a rest, then another arc.

| Type | Channels | Parameters | Formula |
|---|---|---|---|
| `hop` | `offsetY` | `height` 24, `duration` 24, `rest` 30 | during the arc, `offsetY = −height × sin(π × t)`; during the rest, `0` |

`rest` is what makes it a hopping slime rather than a bouncing ball. Set it to `0` for a ball.

### 4.5 Transitions

One implementation, `TransitionMotionEffect`, parameterised by channel and target. It eases from
the channel's identity to the target over `duration`, then holds for as long as the declaration
lives.

```
value = start + (target − start) × easeOutQuad(t)
easeOutQuad(t) = 1 − (1 − t)²
```

| Type | Channel | Parameters |
|---|---|---|
| `scale` | `scaleX`, `scaleY` | `percent` 150, `duration` 30 |
| `angle` | `rotation` | `degrees` 90, `duration` 30 |
| `fade` | `opacity` | `percent` 50, `duration` 30 |
| `hue` | `hue` | `degrees` 180, `duration` 30 |
| `tint` | `tint` | `color` `#ffa0a0`, `duration` 30 |

`scale` and `fade` take **percentages** at the authoring surface — `150` and `50`, not `1.5` and
`0.5` — because that is how the engine's own zoom and opacity controls read and it is what an
author expects to type. The channel divides by 100 on the way in.

These are five names for one behavior: *put a channel somewhere and keep it there.* An author
writing `<motion:[scale, 150]>` on an event gets a permanently oversized character, easing in over
half a second; `<motion:[hue, 120, 1]>` gets an instantly green one.

They are also the shape that makes states expressive. `<motion:[scale, 150]>` on an `origin` state
means an enemy that swells when it becomes elite and settles back when the state drops — the
transition in both directions is free, because a removed declaration eases back to identity rather
than snapping.

### 4.6 What is not here

**No collapse or death effect.** A collapse is not a motion, it is an event that happens to a
thing that is dying — it has a terminal state, it suppresses everything else, and every character
that would use it is a combat entity. It belongs with the combat extension, which knows what a
death is. Core has no opinion about dying.

---

## 5. Tags

One tag family, one glossary entry with a variants table.

```
<motion:[TYPE]>
<motion:[TYPE, PARAM]>
<motion:[TYPE, PARAM, PARAM, …]>
```

Parameters are positional, optional, and filled from config defaults left to right. Every type is
valid with none. `sync` may be appended to any continuous type to pin its phase.

```
<motion:[breathe]>                  default breathe
<motion:[breathe, 0.08]>            deeper
<motion:[breathe, 0.08, 90]>        deeper and faster
<motion:[breathe, 0.08, 90, sync]>  deeper, faster, and in step with its neighbours
<motion:[float]>
<motion:[swing, 15]>
<motion:[spin, 60, ccw]>
<motion:[ghost, 0.1, 0.9, 300]>
<motion:[flicker]>
<motion:[shake, 6, both]>
<motion:[hop]>
<motion:[flash, #ff0000]>
<motion:[scale, 150]>
<motion:[angle, 90]>
<motion:[fade, 30]>
<motion:[hue, 120]>
<motion:[tint, #ffa0a0]>
<motion:[throb, 0, 0, 80, 0, 120]>
```

**This requires widening `J.BASE.RegExp.ParsableComment`.** It is
`/^<[[\]\w :"',.!+\-*/\\]+>$/i` today, and its character class has no `#`, so every colour tag
would be discarded by `filterInvalidEventCommand` before this plugin's parser ever ran. Adding `#`
to the class is part of this work item.

The change is purely additive — nothing that parses today stops parsing — but it lives in J-Base
and affects every parsable comment in the ecosystem, so it belongs in the PR description rather
than buried in a diff.

The table entry:

```javascript
/**
 * A sprite motion declared on an event page.
 *
 * <pre>
 * Structure:
 *  <motion:[TYPE, PARAM, ...]>
 *
 * Example:
 *  <motion:[breathe]>
 *  <motion:[swing, 15, 200]>
 *
 * Translation:
 *  This character breathes at the default depth and rate.
 *  This character swings 15 degrees each way over a 200 frame cycle.
 * </pre>
 * @type {RegExp}
 */
J.MOTION.RegExp.Motion = /<motion:[ ]?(\[\w+(?:,[ ]?[#\w.\-]+)*])>/i;
```

Not `g`-flagged. Duplicate tags on one page are read by iterating the page's comments and testing
each, and a `g` flag carries `lastIndex` between those calls and silently skips every other match.

Arity is validated **after** matching, per type, because one pattern cannot express eighteen
different parameter counts. A well-formed tag with too many parameters matches, fails validation,
and reports through `Diagnostics.warn` — it is not silently ignored, because a typo that costs an
author an hour is worse than a line in the console.

Comments are read through `Game_Event#getValidCommentCommands`, which accepts control codes 108
**and** 408 — so a motion tag on the second line of a multi-line comment block works, which is how
comment blocks are actually authored.

---

## 6. Plugin commands

Two, not one per effect. The grammar already expresses every motion, so a command only needs to
say *who* and *what*.

**Apply Motion**

| Arg | Type | Notes |
|---|---|---|
| `target` | select | `Player`, `Follower`, `Event`, `This Event` |
| `targetId` | number | follower slot or event id; ignored for player/this |
| `motion` | string | a tag body, e.g. `breathe, 0.08, 90` |
| `sourceKey` | string | defaults to `command` |
| `duration` | number | optional; frames after which the command removes its own declaration. `0` means forever |

`duration` lives here rather than in the tag grammar because a timed motion is a thing an
*applier* wants, not a property of the motion. A cutscene shaking a character for a second and a
state shaking it while afflicted are the same effect with different owners.

**Remove Motion**

| Arg | Type | Notes |
|---|---|---|
| `target` | select | as above |
| `targetId` | number | as above |
| `sourceKey` | string | defaults to `command`; blank removes every command-sourced motion |

Every plugin command argument arrives as a **string** regardless of its declared `@type`, so each
shell parses with `Number.parseFloat` / `Number.isFinite` and reports a bad argument through
`Diagnostics` rather than proceeding with `NaN`.

Registration uses `J.MOTION.Metadata.name` — lowercase, never `.Name`.

---

## 7. Config

`data/config.motion.json`, loaded through `ExternalJsonConfigLoader.load()` following
`J_QUEST_PluginMetadata`'s pattern. The loader throws on a missing file, so this ships as part of
the work, not as documentation.

It holds the default parameter values for every type — the defaults in section 4 — so retuning how
the whole game breathes is a data edit, not a rebuild:

```json
{
  "breathe": { "amount": 0.05, "period": 150 },
  "float":   { "distance": 12, "period": 180 },
  "swing":   { "angle": 8, "period": 170 }
}
```

---

## 8. Files and shipping

Scaffold with `bun run plugin:init src/plugins/motion/core`, then follow
[`SCAFFOLD.md`](../src/plugin-template/SCAFFOLD.md) — it already covers `pluginCommands.js`,
`entry.js` ordering, the vite config rename, and the Chef Adventure registration step.

`src/plugins/motion/core/`:

| Path | Holds |
|---|---|
| `_metadata/initialization.js` | `J.MOTION`, `J.MOTION.EXT`, the `Metadata` instance, `Aliased` maps for `Game_Event` and `Sprite_Character`, and `J.MOTION.RegExp.Motion` |
| `_metadata/meta.js` | `PLUGIN_NAME`, `PLUGIN_VERSION`, `PLUGIN_DESC_TAG` |
| `_metadata/_annotations.js` | help, `CHANGELOG:`, and `@base J-Base` for `verify:declared-dependencies` |
| `_metadata/pluginCommands.js` | the two commands |
| `core/MotionTypeRegistry.js` | type name → implementation, channel binding, defaults |
| `core/MotionChannels.js` | channel identities and combine rules |
| `core/MotionEasing.js` | `easeOutQuad` and friends, normalised on `t` |
| `core/PartySlotResolver.js` | party slot → character; slot 1 is the player, slot 2+ is follower `slot − 2` |
| `models/MotionDeclaration.js` | type, parameters, source key |
| `models/MotionComposition.js` | the composed channel values for one frame |
| `models/MotionEffect.js` | base: `tick()`, `contributions()`, `claims()`, `isDiscardable()` — true only once a removed transition has finished easing back to identity, false forever otherwise |
| `models/OscillatorMotionEffect.js` | breathe, stretch, pulse, float, sway, swing, ghost, throb, flash |
| `models/SpinMotionEffect.js` | spin |
| `models/JitterMotionEffect.js` | shake, flicker |
| `models/BounceMotionEffect.js` | hop |
| `models/TransitionMotionEffect.js` | scale, angle, fade, hue, tint |
| `managers/CharacterMotionComposer.js` | the `WeakMap`, declaration lifecycle, tick, combine, claim arbitration |
| `objects/Game_Event.js` | parse page comments on `setupPage`, declare under `page` |
| `sprites/Sprite_Character.js` | ask the composer, apply the composition |

**The apply step aliases `Sprite_Character#update` and runs after the original**, because the
engine assigns `x`, `y` and `opacity` during `updatePosition` and `updateOther`; anything written
before those is overwritten the same frame. Offsets are **added** to the engine's `x`/`y`; opacity
is **multiplied** into the value `updateOther` just assigned; scale, rotation and the colour
channels are **assigned**, since nothing else in the engine writes them. The composition's
`centerRotation` flag is honoured here (§4.2).

**With no live declarations the apply step still writes the identity values**, rather than
returning early. A character that had a `scale` and then lost it must go back to normal size, and
nothing else in the engine will ever reset it.

No `Scene_Map` file: the sprite drives the frame, so there is nothing for the scene to do.

**No save codec file, and no transient declarations**, because no motion state is ever stored on a
character. This is the whole reason for the `WeakMap` in §3.6.

---

## 9. Tests

`test/plugins/motion/core/**`, one `it` per branch, assertions that fail when the code is wrong:

- `MotionEasing` — endpoints, midpoint, clamping past `t = 1`
- `MotionChannels` — every combine rule, including that `flash` takes the strongest rather than the
  sum and that `hue` wraps
- `OscillatorMotionEffect` — each of the nine bindings at phase 0, quarter, half; `float` proven
  never positive on `offsetY`; `breathe` proven to move X and Y in opposite directions
- `SpinMotionEffect` — accumulation, direction, and the `centerRotation` flag
- `JitterMotionEffect` — holds across `interval`, re-rolls after it, stays inside bounds, and
  `shake` respects its `axis`
- `BounceMotionEffect` — arc peak at the midpoint, flat during `rest`, and that it repeats
- `TransitionMotionEffect` — eases, arrives, holds without further change, then reverses to
  identity when its declaration is removed
- `CharacterMotionComposer` — claim arbitration across all four priorities; identical re-declaration
  preserving phase; removal by source leaving other sources intact
- Tag parsing — every type with and without parameters, `sync`, a `#rrggbb` colour surviving both
  gates, a malformed tag warning rather than silently vanishing, and a 408-line tag being found
- View harness for the `Sprite_Character` apply step, including the identity-write-on-empty case

Fixtures carry near-miss siblings wherever the code selects by identity: two sources sharing a
prefix (`state:4` and `state:41`) so `removeDeclarations` cannot be replaced with `true`, and a
comment list holding a non-motion tag that must survive parsing.

`vitest.config.js` currently excludes `sprites/**` wholesale, so the harness test would be
unmeasured. Lift the exclusion for this family using the extglob peel the config's own comment
describes, or the ship's "100%" is not comparable to anything else's.

`bun run mutate motion` before the PR, survivors triaged.

---

## 10. Migrating the existing map data

183 map files carry 4,105 effective declarations in five distinct strings (seven, counting two
title-cased variants). None carry parameters, so it is a case-insensitive whole-string swap:

| From | To |
|---|---|
| `breath motion 1` | `<motion:[stretch]>` |
| `breath motion 2` | `<motion:[breathe]>` |
| `float motion` | `<motion:[float]>` |
| `swing motion` | `<motion:[swing]>` |
| `ghost motion` | `<motion:[ghost]>` |

A bun script, **dry run reviewed before it writes anything.**

Two things this changes on purpose:

- **75 ghost declarations come alive.** They sit on continuation lines of multi-line comments,
  which the outgoing plugin never read. J-Motion reads them, as it should. All 75 are on enemies
  that already carry another motion, so the change is additive.
- **Defaults are chosen to land close to what is on screen today**, because 4,105 declarations
  were placed by eye against the outgoing plugin's output. Section 4's numbers are ours, but they
  start from that visual so the migration does not turn into re-eyeballing 183 maps. Anything that
  looks wrong afterwards is retuned in `config.motion.json`, once, for the whole game.

Then: register `j/motion/core/J-Motion` in Chef Adventure's `js/plugins.js` at the slot the old
plugin occupied — after `J-Base` and `J-Base-Save`, before `J-ABS` — and delete
`others/MOG_CharacterMotion` from the manifest and from `_others/`.

Glossary entry lands in `docs/notetag-reference.md` in the same PR as the tag.

---

## 11. Extension points

**States are supported, in `motion/ext/abs`.** A `<motion:...>` tag on an `RPG_State` is read the
same way as one on an event page; the part that needs an extension is knowing which sprite belongs
to a battler, and `JABS_Battler` is what holds a battler and its character in one hand. Core has
no way to reach an enemy's sprite because outside JABS an enemy has no map presence at all.

The design already accounts for it: `state:<id>` is a source key in §3.1, it outranks `page` in
§3.4, and §4.5's transitions are the shape a state wants — swell on apply, settle on remove, both
directions free.

Built into core, exercised by nothing in core, so the fast-follow needs no rework:

- **Source priority** already ranks `combat` and `state` above `page`, so an extension declaring
  under those keys wins claims without core changing.
- **Channel claims** are how a reactive effect takes a channel for a moment and gives it back.
- **`MotionTypeRegistry`** is additive: an extension registers `collapse` or `recoil` without
  touching core's table.

The fast-follow moves `abs/ext/juice` in as `motion/ext/abs`, adds `<motion:...>` on states, and
brings the death collapse with it. `JuiceWeaponSwingOverlay` animates a weapon sprite rather than a
character, so it needs a home that is not a character declaration — that is the extension's problem
to solve.

---

## Appendix: the plugin being removed

`project/js/plugins/_others/MOG_CharacterMotion.js` — 1348 lines, by Moghunter, documented in
Portuguese. It does roughly what section 1 describes, through five comment strings and twelve
plugin commands, and Chef Adventure has used it for years.

It is being removed because it cannot be extended: its state is nine index-addressed arrays parked
on `Game_CharacterBase`, its sprite code writes to game objects, a single global clear wipes every
effect regardless of who asked for it, and it has no notion of one effect composing with another.
It also rides into every savefile, having never declared otherwise.

What was taken from it: the knowledge that these particular motions look good on this particular
game's sprites, and the rough magnitudes that make them look that way. Section 4's defaults were
chosen to sit near its output so the migration is invisible to the player. Nothing else survives —
not its structure, its names, its parameters, its per-frame arithmetic, or its effect list.

It also fought `abs/ext/juice` for the same sprite properties every frame and only appeared not to
because of the order the two happened to run in. Ending that is a large part of why this exists.
