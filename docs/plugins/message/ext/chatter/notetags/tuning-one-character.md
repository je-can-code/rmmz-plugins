---
type: notetag
title: Tuning One Character
description: The optional tags overriding the project's chatter defaults for one character only.
tags: [message-chatter, tag, chatter, event, tuning]
---

# Tuning One Character

## Description

Every tag below is optional, and each overrides the [project default](../overview.md#project-defaults) for this
character only. Most chattering events will want none of them; an excitable child or a bemoaning merchant might want one
or two.

## TAG USAGE

- Event comments, on the event page.

## TAG FORMAT

`<chatterRadius:TILES>`

`<chatterCooldown:FRAMES>`

`<chatterDelay:FRAMES>`

`<chatterDuration:FRAMES>`

`<chatterSpeed:FRAMES>`

`<chatterPosition:top|middle|bottom>`

`<chatterBackground:window|dim|transparent>`

## TAG EXAMPLES

`<chatterRadius:5>`
The player hears this character from up to five tiles away. Walls do not enter into it; this is simply the distance
between the two of them.

`<chatterCooldown:600>`
This character says nothing for ten seconds after finishing a line. The clock starts when the line ends, never when it
begins.

`<chatterDelay:300>`
This character waits somewhere between zero and five seconds before speaking. The wait is rolled fresh every time, which
is what keeps a row of shopkeepers from speaking in lockstep. It only counts down while the player is close enough to
hear how it ends.

`<chatterDuration:180>`
A finished line stays on screen for three seconds. Counted from the moment it finishes typing out, so a long line is
readable for as long as a short one.

`<chatterSpeed:2>`
A new character of the line appears every two frames. Zero shows the whole line at once.

`<chatterPosition:top>`
The bubble floats above this character's head. Use `bottom` to hang it under their feet instead, which is how two
characters near each other avoid stacking their bubbles in the same place. `middle` behaves as `top` does.

`<chatterBackground:dim>`
This character's chatter is greyed and half see-through, the way a thought is - so they read as muttering under their
breath rather than speaking up. The three words are the Show Text Background dropdown's own three; `window` is the
ordinary bubble and `transparent` leaves the words floating with no backdrop at all.