---
type: notetag
title: Light Source
description: The tag declaring a source of light, with a reach in tiles and an optional colour, edge and effect.
tags: [lighting, tag, event, light, effect, player]
---

# Light Source

## Description

Add a comment to an EVENT PAGE.

The same `<light:...>` tag works on anything the party leader has: a weapon, an armor, a state, a skill, a class, or the
actor themselves.

## NOTE ABOUT PARAMETER ORDER

ONLY THE RADIUS HAS A FIXED PLACE. Colour, intensity and effect are told apart by what they look like- a `#` leads a
colour, a bare number is an intensity, a word is an effect- so they may be written in any order, and any of them may be
left out.

## NOTE ABOUT INTENSITY

This is the SHAPE of the light, not its brightness. At 0 the light is brightest at its heart and fades away to nothing,
the way a flame in the open does. At 100 the whole circle burns evenly and stops dead at the rim, the way a spotlight
does. Everything between is how hard the edge is.

A light with no intensity given is a soft pool, which is what a light has always looked like here.

## NOTE ABOUT EFFECTS

A light with no effect named simply burns steadily.

- `flicker`: Erratic and organic, like a torch or a bonfire. Two waves at odds with each other, so it never repeats and
  two torches in a room never gutter in time.
- `pulse`: Steady and rhythmic, like something breathing or a crystal humming. One clean wave, the same every cycle.
- `glitch`: Mostly perfectly steady, then a short burst of stuttering, then steady again. A dying fluorescent tube or
  failing machinery. The waiting is what sells it.

An effect costs nothing extra to draw. Two torches of the same size and colour share one picture between them whether
they flicker or not- the effect changes how brightly that picture is shown, never the picture.

## NOTE ABOUT WHY A COMMENT AND NOT A NOTE

A light on a page can stop. An unlit torch is page one with no tag; page two, behind a self switch, has the lit graphic
AND the light tag. Setting the torch alight is a self switch, and the light arrives with the page that describes a
burning torch.

Nothing has to register the event as ignitable, and nothing has to remember to put it out.

## NOTE ABOUT THE PLAYER'S OWN LIGHT

THE PLAYER HAS NO LIGHT OF THEIR OWN. This is deliberate. A globe that follows the party everywhere makes darkness
unreachable, because the one place the player can always see is exactly where they are standing.

## TAG USAGE

- Event comments, on an event page.
- Actors, when leading the party.
- Classes, of the actor leading the party.
- Weapons, equipped by the actor leading the party.
- Armor, equipped by the actor leading the party.
- States, applied to the actor leading the party.
- Skills, known by the actor leading the party.

## TAG FORMAT

`<light:[RADIUS]>`
`<light:[RADIUS, COLOR]>`
`<light:[RADIUS, COLOR, INTENSITY]>`
`<light:[RADIUS, COLOR, INTENSITY, EFFECT]>`
Where RADIUS is how far the light reaches, in TILES. Fractions are fine- 2.5 is two and a half tiles.
Where COLOR is a hex colour for the light (OPTIONAL).
Where INTENSITY is how evenly the circle is filled, 0 to 100 (OPTIONAL).
Where EFFECT is `flicker`, `pulse` or `glitch` (OPTIONAL).

## TAG EXAMPLES

`<light:[5]>`
A plain white light reaching five tiles.

`<light:[4, #ffbb73]>`
A warm light, the colour of an incandescent bulb, reaching four tiles.

`<light:[6, #ffbb73, flicker]>`
The same warm light, reaching six tiles, guttering like a torch.

`<light:[5, #ffffff, 90, flicker]>`
A sharp-edged beam that is not quite holding steady- an unsteady spotlight.

`<light:[4, #ffeebb, 10]>`
A soft, even, unwavering pool- a street lamp.

`<light:[3, #88ffcc, 70, pulse]>`
A crisp teal circle breathing in and out- a crystal.

`<light:[2, #aaddff, 100, glitch]>`
A hard little disc that holds, stutters, and holds again- failing machinery.

`<light:[4.5, #ffdca8, flicker]>` (on a Lantern armor)
The party gives off light while that lantern is equipped, and stops the moment it comes off.

`<light:[3, #88ffcc]>` (on a "Glowing" state)
The party gives off light for as long as the state lasts.