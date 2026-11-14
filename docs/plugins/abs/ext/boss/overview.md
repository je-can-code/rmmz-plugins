---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [abs-boss, overview]
version: "1.0.1"
---

# Overview

This plugin allows boss fights to be authored as data instead of as long chains of event commands.

A boss encounter describes who is fighting, who is allowed to drive them, and what recurs while the fight runs. That
description lives in an external configuration file, which means a fight can be revised, retimed, or rebuilt without
opening a single event page.

## Integrations

Integrates with others of mine plugins:

- `J-Base`; to be honest this is just required for all my plugins.
- `J-ABS`; the battle system the encounters take place in.
- `J-Log`; optional, the dialogue log a `log` step writes to.

## Details

Encounters are defined in the `bosses` block of `data/config.jabs.json`, alongside `teams` and `juice`. Each encounter
names its arena's map, one or more participants, any number of recurring routines, any number of reactions to the
moments of the fight, and the switch it turns on when won.

Participants are a list rather than a single boss on purpose. A lone boss, a boss with destructible parts, a pair of
twins, and a swarm sharing a single health pool are all the same structure with a different win condition, so none of
them require a new shape later.

Nothing in this plugin draws anything. What a boss is - a battler, a health pool, a set of behaviors - is combat
knowledge, and a frame drawn around a health bar is a view of that knowledge. Anything wanting to display a boss asks
this plugin for it.

## Authoring an encounter

A minimal encounter looks like this:

```json
{
  "teams": [ ... ],
  "juice": { ... },
  "bosses": [
    {
      "key": "gluttonwolf",
      "map": 75,
      "defeatSwitch": 24,
      "participants": [
        {
          "key": "mayor",
          "enemyId": 581,
          "expect": "Gluttonwolf Mayor",
          "x": 14,
          "y": 14
        }
      ],
      "aiControl": "shared",
      "routines": [
        {
          "key": "devour",
          "cadence": 20,
          "steps": [
            {
              "verb": "forceSkill",
              "skill": 2584,
              "expect": "Devour",
              "cast": true
            }
          ]
        }
      ]
    }
  ]
}
```

### Participants

A participant is an enemy and the tile it appears on, not an event on a map. When `start-encounter` runs, the encounter
spawns every participant from J-ABS's enemy clone map onto the current map, at its `x` and `y`. The enemy id does double
duty as the clone map event to spawn, because that map keeps each enemy's template in the slot matching its enemy id.

So the map staging the fight holds no event for the boss at all. Its story event plays the scene in front of the fight
and then starts the encounter, and the boss arrives with it. That is what lets one encounter run unchanged in its real
arena and in a test hall built in the same shape: every map that starts it gets the same fight.

A spawn that fails stops the fight from starting. A clone map slot holding no event, or holding an event that turns out
to be some other enemy, is an error rather than a fight against nobody.

Everything about how the boss looks and behaves on the map, from its sprite to its sight range, lives on its template in
the clone map, alongside whatever it does when it falls.

### Templates

A participant usually spawns from the clone map slot matching its enemy id. Name a `template` to spawn it from another
event on the clone map instead, for a body that is that same enemy dressed for this one fight: a prefix it always
wears, a role it plays, the level it fights at. The enemy's own template stays exactly as it is for everywhere else
that enemy turns up.

```json
{ "key": "golemWest", "enemyId": 501, "expect": "Golem", "x": 4, "y": 3, "template": 601 }
```

Put a fight's own templates past the last enemy id on the clone map, where no enemy added later can ever claim the
slot. A `template` of `0`, or none at all, means the enemy's own slot. Whichever template it comes from, the body still
has to turn out to be the enemy the participant names, or the fight does not start.

### Bystanders

A participant marked `"bystander": true` stands in the fight from its first frame without being part of winning it,
the way an elemental might watch from the edge of the room and cheer its champion on.

```json
{ "key": "skye", "enemyId": 554, "expect": "Skye", "x": 25, "y": 19, "template": 607, "bystander": true }
```

It spawns with the rest, and any step can name it, so it can say its lines from where it stands. The fight is won once
every other participant has fallen, and a bystander still standing then leaves the map with the fight, the same way
whatever the fight spawned for itself does. Ending the fight takes it away too.

The first participant is the boss, so it can never be a bystander, and an encounter with no participants at all is no
fight. Either one stops the fight from starting.

### Summoned participants

A participant marked `"summoned": true` is held back as the fight starts, and arrives only when a `summon` step brings
it in: on its own `x` and `y`, from its own template, exactly the way the participants there from the start arrived.
That is how a maker calls her masterworks down one at a time, each the moment the last one falls.

```json
{ "key": "brine", "enemyId": 531, "expect": "Puppet", "x": 23, "y": 13, "template": 608, "summoned": true }
```

It is a participant all the while. A `fallen` reaction can wait on it, and the fight is not won until it has arrived and
fallen too, so one still waiting to be summoned keeps the fight going however much else has fallen. Once it arrives,
nothing about it differs from a participant that was there from the first frame: any step can name it, and it stands
its ground like any other.

Exactly one step summons it, and that step sits in a reaction. A reaction fires once per fight, which makes it one
arrival. A routine runs over and over, so a `summon` in one stops the fight from starting, and so does a summoned
participant nothing summons, or one summoned twice. The boss is there from the start, so a summoned participant listed
first stops the fight from starting too.

A fight started again forgets everything the last attempt summoned, so every summoned participant starts the new
attempt held back, and nothing waiting on one fires before it has arrived and fallen in this attempt.

### Standing ground

Every participant is immune to knockback for as long as its fight runs, whatever it otherwise resists, and a summoned
one from the moment it arrives. A boss that can be shoved around its own arena can be wedged into a doorway or pinned
in a corner, and the fight turns into one against the walls of the room. Only being moved is refused: every state a hit
carries, a stun among them, still lands. What a fight spawns for itself with `spawn` is no participant, and moves like
anything else.

### Defeat

`defeatSwitch` names a switch the encounter turns on once it is won. Set it to `0`, or leave it out, to turn none on.

That switch is how the story learns the boss is dead, so the boss's template never has to know anything about the
story. Its death scene says its last words, and whatever the world does next waits on the switch.

A fight is won once every participant other than a bystander has fallen and finished dying, a summoned one included,
which has to have arrived first. J-ABS only erases a fallen body after its death scene has played out, so the switch
turns on after the last line of the last body's death scene, never in the middle of it.

The switch only turns on in the encounter's own arena, the map named by `map`. The same fight staged anywhere else, like
a test hall, can be won as often as you like without the story ever hearing about it. A script can still tell when a
fight is over there: `JabsBossManager.isBossDefeated()` turns true once it is won, wherever it was fought.

Winning does not end the encounter. Whatever waits on the switch still runs `end-encounter` once it is done with the
fight.

A switch the game does not have stops the fight from starting. RPG Maker quietly ignores a switch it does not have, so
without that check the boss would fall and the story would wait on it forever.

### AI control

`shared` means the encounter layers behavior on top of a boss that its normal AI continues to drive. This is the
default and it is what most fights want.

`scripted` means the encounter drives the boss outright for the duration of a routine, and the routine is expected to
suppress the normal AI itself.

### Cadence

A routine's cadence is measured in seconds, counted from the moment the encounter starts, so a routine's first
execution is a full interval away rather than landing on the first frame of the fight.

Only fight time counts. While an event is running or a message is on screen, the battle system holds every battler
still, and the encounter's routines wait right along with it. A boss can arrive at the start of its entrance scene and
still take its first scripted turn a full interval after the fighting begins.

When a routine comes due while the boss cannot act - stunned, or already casting - that execution is skipped rather
than queued. Queueing would mean a stun releases into every missed execution firing back to back. A routine's turn is
judged by the boss, the first participant, whichever participant its steps act on.

A `quickenRoutine` step makes a routine faster for the rest of the fight, and the wait already underway shortens along
with it, so the fight speeds up at that moment rather than one execution later. A routine quickened past zero runs as
often as its boss is able to act. The next attempt at the fight starts back at the authored cadence.

A routine marked `"dormant": true` does not run at all until a `startRoutine` step wakes it, usually from a reaction to
the moment the fight turns a corner: a summoner from two thirds of the boss's health on, a tour of the room from two
fifths. A woken routine plays at once, then keeps its cadence from there. Waking a routine that is already running
leaves it on the wait it was on, and quickening a dormant one shortens the cadence it will start on.

A routine whose last run is still playing - pausing, or blinking around the room - waits for it to finish before it
starts again, rather than starting a second run over the top of the first.

### Reactions

Routines are what a fight keeps doing. Reactions are what it does once, in answer to a moment in the fight.

```json
"reactions": [
  {
    "key": "seal",
    "on": "start",
    "steps": [ { "verb": "addState", "participant": "earthie", "state": 2072, "expect": "Sealed" } ]
  },
  {
    "key": "west-golem-falls",
    "on": "fallen",
    "participants": [ "golemWest" ],
    "steps": [ { "verb": "quickenRoutine", "routine": "rockfall", "seconds": 1 } ]
  },
  {
    "key": "two-thirds",
    "on": "health",
    "below": 66,
    "steps": [ { "verb": "tint", "tone": [ 17, -68, -68, 0 ], "seconds": 2 } ]
  }
]
```

`on` names the moment:

- `start` answers the fight beginning: the moment its bodies arrive, before a single frame of it has been drawn.
- `fallen` answers every participant listed in `participants` having fallen and finished its death scene. List one
  participant to answer that one falling, or several to answer the whole group falling. A participant still waiting to
  be summoned has not fallen.
- `health` answers every participant listed in `participants` standing at or below `below` percent of its health. List
  nobody to watch the boss. A body that has fallen, or left the map, is past every turning point it had, so a boss
  felled from above the percent in one blow never answers it.

Each reaction fires once per fight, and a fight started again starts with every reaction unspent. Like routines,
reactions wait while an event is running or a message is on screen.

A reaction to a moment no fight has, a `fallen` reaction listing nobody, a `health` reaction waiting for 0% or 100% or
anything past them, or a reaction listing a participant the encounter does not have, stops the fight from starting. A
misspelled name would otherwise wait for a body that never falls.

### Steps

Routines and reactions are both made of steps, and each step names a `verb`:

| Verb | What it does | What it reads |
|---|---|---|
| `forceSkill` | Makes a participant perform a skill | `skill`, `expect`, `cast`, `participant` |
| `addState` | Puts a state on a participant | `state`, `expect`, `participant` |
| `removeState` | Takes a state off a participant | `state`, `expect`, `participant` |
| `changeImage` | Changes what a participant looks like | `image`, `index`, `participant` |
| `quickenRoutine` | Takes seconds off how long a routine waits between executions | `routine`, `seconds` |
| `spawn` | Puts an enemy on a tile as part of the fight, without being a body the fight needs felled | `enemyId`, `expect`, `x`, `y`, `template`, `animation` |
| `tint` | Shifts the color of the whole screen over a number of seconds | `tone`, `seconds` |
| `animation` | Plays an animation over a participant | `animation`, `expect`, `participant` |
| `dialogue` | Has a participant say a line, holding the fight until it has been read | `speaker`, `lines`, `face`, `faceIndex`, `participant` |
| `blink` | Has a participant vanish and reappear on a tile, facing a given way | `x`, `y`, `direction`, `animation`, `participant` |
| `wait` | Holds the steps behind it for a number of seconds | `seconds` |
| `learnSkill` | Teaches a participant a skill its own AI uses from then on | `skill`, `expect`, `participant` |
| `startRoutine` | Wakes a dormant routine | `routine` |
| `face` | Turns a participant to face a given way | `direction`, `participant` |
| `log` | Writes a line to the dialogue log on the map, without holding the fight | `lines`, `face`, `faceIndex` |
| `summon` | Brings a participant held back to be summoned onto its own tile | `participant`, `animation` |
| `jump` | Has a participant leap onto a tile | `x`, `y`, `participant` |

`participant` names who a step acts on. Leave it out to act on the first participant, the boss. A step acting on a
participant with no body on the map, such as one that has already fallen or has yet to be summoned, is skipped.

Steps run in order. Each firing of a reaction and each run of a routine plays in a lane of its own, and lanes play side
by side the way separate events would: a boss blinking around the room on one routine does not hold up the spawner on
another, or the turning point its health just passed. Within a lane, steps with nothing to wait on all play in the same
frame, and a `dialogue`, `blink`, `jump` or `wait` step holds every step behind it until it is over. A boss that says
something and then lashes out does it in that order. Once a fight is won, nothing still playing in it plays on.

`spawn` copies its body from the enemy clone map exactly the way a participant does: from the slot matching `enemyId`,
or from `template` when it names one, and plays `animation` over it as it arrives when it names one. What a fight
spawns is part of the fight without being part of winning it - a hazard waking as the boss is worn down, say. Whatever
is still standing when the fight is won or ended is taken off the map with it.

`summon` brings in the participant it names, which has to be one marked `"summoned"`, and plays `animation` over it as
it arrives when it names one. Unlike every other step, naming nobody does not mean the boss: the boss is there from the
start, so a `summon` naming nobody, or naming a participant that was never held back, stops the fight from starting.

`blink` fades its participant out where it stands and back in on the tile at `x` and `y` a moment later, with the
`animation` it names flaring at both ends, and leaves it facing `direction`: `2`, `4`, `6` or `8` for down, left,
right or up, or `0` to keep the way it faced. It plays as the participant's own event, so the fight carries on around
it. A facing that is none of those stops the fight from starting.

`jump` has its participant leap from wherever it stands onto the tile at `x` and `y`, landing facing the way it leapt:
a boss hopping down from a ledge nobody else can reach, say. It plays as the participant's own event, and a
participant held in place, such as one sealed by a rooting state, leaps all the same. Take a seal off after the
`jump` rather than before it, and the boss stays untouchable until it lands.

`learnSkill` teaches its participant a skill for the rest of the fight, and its own AI picks it up from there - a
summon learned partway through, say. The next attempt at the fight starts without it.

`face` turns its participant to face `direction`: `2`, `4`, `6` or `8` for down, left, right or up. Unlike a blink's,
there is no `0`, since a turn that keeps the facing it had is no turn at all. A skill forced straight after fires the
way the participant now faces, so a boss spinning in place to fire every way in turn is a `face` and a `forceSkill`,
over and over.

`log` writes `lines` to the dialogue log on the map as one entry, wearing the face image named by `face` and the face
on it at `faceIndex`. A line in the log is chatter - a shriek mid-barrage, a word called from the sidelines - and the
fight plays on while it is read, which is the whole difference between it and `dialogue`. The log belongs to J-Log;
without it, a `log` step writes nowhere.

`tint` takes a screen tone of red, green and blue from -255 to 255 and gray from 0 to 255, and `seconds` for how long
it takes to settle. The first tint of a fight remembers the tint the screen was headed for, and ending the fight puts
that back. It is the destination it remembers, not the colour on screen: partway through a fade that colour is one
nobody asked for, and a fight started in the same frame another one ends would otherwise mistake the old fight's tint
for the room's own.

`dialogue` takes the name shown with the line in `speaker`, the face image and the face on it in `face` and
`faceIndex`, and the text in `lines`, shown together as one message. The line is said the way an event says one, by
the speaker's own event, so a text code that floats a message over whoever is speaking - `\pop[self]` in
J-Message-Bubbles - floats it over the speaker here too.

`addState` has the participant put the state on itself, which makes it a JABS state that keeps to its own timing. A
seal meant to last until a reaction lifts it wants `<indefiniteState>` on the state.

`changeImage` takes a character sheet's file name in `image` and the character on it in `index`. A spawned body has a
single page, so nothing that refreshes the map puts its old look back.

A step naming a participant, routine, skill or state the encounter cannot find stops the fight from starting, and so
does a `tint` that is not four numbers, a `dialogue` or `log` with no lines, or a `face` that is not one of the four
facings. A verb nothing implements fails the moment it is performed.

### Cast time

A step's `cast` property decides whether the skill observes its own cast time. This is not cosmetic. A cast time is the
telegraph - the window in which a player reads an attack and moves out of it - so a skill executed without its cast
time is a skill that cannot be dodged.

It defaults to true. Set it to false only for scripted set-pieces that are not meant to be reacted to.

A boss that cannot move, such as one sealed in place by a rooting state, casts a forced skill from where it stands.
Any other battler walks into range before its decided skill fires, and a boss held in place would otherwise wind the
skill up and then wait for a step it can never take.

A forced skill lands the moment its cast time ends, however far the player stands. J-ABS only runs the AI of battlers
near the player (the `maxAiUpdateRange` parameter), and in an arena wider than that a boss's AI can stop while its cast
is winding up. The fight watches every cast it forces and, when the AI is not there to fire a finished one, fires it
itself, through the same checks and the same firing the AI uses.

### The `expect` property

Every database reference carries the name that row had when the encounter was authored: each participant's enemy,
and the skill, state, spawned enemy or animation each step uses. Before a fight runs, those names are checked against the database as it stands
now. Leave `expect` empty to skip the check for that reference.

This exists because a stale id fails silently. When a database is rebalanced and ids move, a fight that references the
old numbers keeps running - it just summons the wrong enemy or casts the wrong skill, forever, without complaint.
Recording the name turns that silence into a crash at the one moment an author can act on it.