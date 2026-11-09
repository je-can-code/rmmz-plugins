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

### Standing ground

Every participant is immune to knockback for as long as its fight runs, whatever it otherwise resists. A boss that can
be shoved around its own arena can be wedged into a doorway or pinned in a corner, and the fight turns into one against
the walls of the room. Only being moved is refused: every state a hit carries, a stun among them, still lands. What a
fight spawns for itself with `spawn` is no participant, and moves like anything else.

### Defeat

`defeatSwitch` names a switch the encounter turns on once it is won. Set it to `0`, or leave it out, to turn none on.

That switch is how the story learns the boss is dead, so the boss's template never has to know anything about the
story. Its death scene says its last words, and whatever the world does next waits on the switch.

A fight is won once every participant has fallen and finished dying. J-ABS only erases a fallen body after its death
scene has played out, so the switch turns on after the last line of the last body's death scene, never in the middle
of it.

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
  participant to answer that one falling, or several to answer the whole group falling.
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
| `spawn` | Puts an enemy on a tile as part of the fight, without being a body the fight needs felled | `enemyId`, `expect`, `x`, `y`, `template` |
| `tint` | Shifts the color of the whole screen over a number of seconds | `tone`, `seconds` |
| `animation` | Plays an animation over a participant | `animation`, `expect`, `participant` |
| `dialogue` | Has a participant say a line, holding the fight until it has been read | `speaker`, `lines`, `participant` |

`participant` names who a step acts on. Leave it out to act on the first participant, the boss. A step acting on a
participant with no body left on the map, such as one that has already fallen, is skipped.

Steps run in order, all in the same frame, except that a `dialogue` step holds every step behind it until the player
has read the line. A boss that says something and then lashes out does it in that order.

`spawn` copies its body from the enemy clone map exactly the way a participant does: from the slot matching `enemyId`,
or from `template` when it names one. What a fight spawns is part of the fight without being part of winning it - a
hazard waking as the boss is worn down, say. Whatever is still standing when the fight is won or ended is taken off the
map with it.

`tint` takes a screen tone of red, green and blue from -255 to 255 and gray from 0 to 255, and `seconds` for how long
it takes to settle. The first tint of a fight remembers the screen it found, and ending the fight puts that back.

`dialogue` takes the name shown with the line in `speaker` and the text in `lines`, shown together as one message. The
line is said the way an event says one, by the speaker's own event, so a text code that floats a message over whoever
is speaking - `\pop[self]` in J-Message-Bubbles - floats it over the speaker here too.

`addState` has the participant put the state on itself, which makes it a JABS state that keeps to its own timing. A
seal meant to last until a reaction lifts it wants `<indefiniteState>` on the state.

`changeImage` takes a character sheet's file name in `image` and the character on it in `index`. A spawned body has a
single page, so nothing that refreshes the map puts its old look back.

A step naming a participant, routine, skill or state the encounter cannot find stops the fight from starting, and so
does a `tint` that is not four numbers or a `dialogue` with no lines. A verb nothing implements fails the moment it is
performed.

### Cast time

A step's `cast` property decides whether the skill observes its own cast time. This is not cosmetic. A cast time is the
telegraph - the window in which a player reads an attack and moves out of it - so a skill executed without its cast
time is a skill that cannot be dodged.

It defaults to true. Set it to false only for scripted set-pieces that are not meant to be reacted to.

A boss that cannot move, such as one sealed in place by a rooting state, casts a forced skill from where it stands.
Any other battler walks into range before its decided skill fires, and a boss held in place would otherwise wind the
skill up and then wait for a step it can never take.

### The `expect` property

Every database reference carries the name that row had when the encounter was authored: each participant's enemy,
and the skill, state, spawned enemy or animation each step uses. Before a fight runs, those names are checked against the database as it stands
now. Leave `expect` empty to skip the check for that reference.

This exists because a stale id fails silently. When a database is rebalanced and ids move, a fight that references the
old numbers keeps running - it just summons the wrong enemy or casts the wrong skill, forever, without complaint.
Recording the name turns that silence into a crash at the one moment an author can act on it.