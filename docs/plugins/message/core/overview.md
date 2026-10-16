---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [message, overview]
---

# Overview

This plugin grants additional message functionality.

- Adds new text codes for various database objects.
- Adds new conditionals for showing/hiding choices.
- Adds text codes that animate the text itself.
- Gives each speaker their own voice and reading pace.

## New text codes

Have you ever wanted to be able to reference a particular entry in the database without having to hardcode the name of
the entry and the icon into the message window? Well now you can! By adding the correct text codes into your message
windows (or in your plugins using `.drawTextEx()`), you too can leverage entries from the database without any
significant difficulty!

### Note about icons

All new text codes except `\Enemy[ID]` will also prepend their corresponding icon as well. This is because enemies don't
have icons assigned to them.

### New text codes available

From their own respectively named tabs:

- `\Weapon[ID]`
- `\Armor[ID]`
- `\Item[ID]`
- `\State[ID]`
- `\Skill[ID]`
- `\Enemy[ID]`

From the "Types" tab:

- `\element[ID]`
- `\equipType[ID]`
- `\weaponType[ID]`
- `\armorType[ID]`
- `\skillType[ID]`

From mine other plugins:

- `\sdp[SDP_KEY]`
- `\quest[QUEST_KEY]`
- `\param[PARAM_KEY]`

Where ID is the id of the entry in the database.

Where SDP_KEY is the key of the panel.

Where QUEST_KEY is the key of the quest.

Where PARAM_KEY is a registered `J-Base` `ParameterRegistry` key (e.g. "`atk`", "`mcr`", "`hcr`").

An unrecognized PARAM_KEY renders as an unmistakable "!!! UNKNOWN PARAM !!!" in red with a question-mark icon instead of
failing silently- this is always an authoring mistake, never a legitimate zero/empty result.

### New text codes examples

`\Weapon[4]`
The text of "`\Weapon[4]`" will be replaced with:

- the icon of the weapon matching id 4 in the database.
- the name of the weapon matching id 4 in the database.

`\Skill[101]`
The text of "`\Skill[101]`" will be replaced with:

- the icon of the skill matching id 101 in the database.
- the name of the skill matching id 101 in the database.

`\param[atk]`
The text of "`\param[atk]`" will be replaced with:

- the icon of the "`atk`" parameter from the `ParameterRegistry`.
- the label of the "`atk`" parameter from the `ParameterRegistry`.

`\param[typo]`
An unregistered key like "`typo`" will be replaced with a bright red "!!! UNKNOWN PARAM !!!" and a question-mark icon
instead of doing nothing.

## New text styles

Have you ever wanted to be able to style your already amazing comic sans ms font with italics or bold? Well now you can!
By adding the correct text codes into your message windows (or in your plugins using `.drawTextEx()`), you too can
flourish with italics and/or stand stoic with bold!

### Note about toggles

The following styles act as 'toggles', in the sense that all characters that are surrounded by the text codes of `\_` or
`\*` would be of their corresponding style- italics or bold respectively. See the examples for clarity.

### New text styles available

- `\_` (italics)
- `\*` (bold)

### New text styles examples

`"so it is \*gilbert\*. We finally meet \_at last\_."`
In the passage above, the word "gilbert" would be bolded.
In the passage above, the words "at last" would be italicized.

## Animated text

Bold and italics change how a letter is drawn. These change what it does afterward- the letters of a message are
individually animated objects, so they can be made to move and change colour while they sit there.

Like bold and italics, each of these is a toggle: the first one opens the effect and the next one closes it again. An
effect left open closes on its own at the end of the page.

### Animated text codes available

- `\~` the text rolls up and down like a wave
- `\%` the text trembles in place
- `\=` the text cycles through the colours of the rainbow
- `\+` the text swells and settles again, like breathing

The symbols are picked to look like what they do, so that a passage full of them still reads: a tilde is a wave, a
percent sign cannot make up its mind whether it is going up or down, and a plus is something getting bigger.

### Note on `\+` and event comments

Of the four, only `\+` may appear inside an event comment tag. The others are dropped by the comment parser before any
plugin sees them, because `~`, `%` and `=` are not in the character set it accepts. This only matters for tags, not for
Show Text, where all four work everywhere.

### Animated text examples

`"whoa, that is \~incredible\~."`
In the passage above, the word "incredible" would roll like a wave.

`"d-did you \%hear\% that?"`
In the passage above, the word "hear" would tremble.

`"the door is \+locked\+."`
In the passage above, the word "locked" would swell and settle.

These stack with everything else, so `\*\~shouting\~\*` is both bold and waving, and a colour code inside a wave keeps
its colour while it moves.

## Combining messages

A long speech is uncomfortable to author as a single Show Text command. The editor offers four lines, the box holds four
lines, and a paragraph broken across several commands reaches the player as several boxes with a button press between
each one.

The text code below welds a message onto the one written directly after it. The two are revealed as a single message, in
a single window that grows to hold all of it. The code itself is removed before anything is drawn.

### Text code format

`\more`

Put it anywhere in a Show Text command whose text should run on into the next one. The end of the last line is the
tidiest place; a line holding nothing but the code leaves an empty line behind in the message.

### Text code examples

`Show Text: "I have been thinking about this for a while.\more"`
`Show Text: "And I still do not know what to tell you."`
Both lines appear together in one window, and the player presses the confirm button once rather than twice.

`Show Text: "First.\more"`
`Show Text: "Second.\more"`
`Show Text: "Third."`
All three are welded into a single message. A chain runs for as long as each message in it carries the code; the message
that ends the chain does not.

### What the combined message looks like

The first message of a chain decides everything about presentation- the face image, the Name field, the Background and
Position dropdowns, and the `\pop` target if `J-Message-Bubbles` is installed. Every message welded onto it contributes
its text and nothing else.

The window grows downward to fit, up to the height of the screen. A chain that would outgrow the screen stops before the
message that would overflow it, and that message is shown as an ordinary separate message instead.

A chain only ever reaches the Show Text command written immediately after it. Anything sitting in between- a conditional
branch closing, a set of choices, the end of the page- ends the chain, whether or not more was asked for.

## Speaker voices

Every message already knows who is speaking- either from the Name field of the Show Text command, or from the face image
it carries. That is enough to give each character a voice of their own without editing a single line of dialogue that
has already been written.

A speaker profile controls:

- the sound that plays as their letters appear, and its pitch
- how many letters pass between one of those sounds and the next
- how long they linger on each letter
- how long they pause on particular punctuation
- effects that act on everything they say, with no text code needed

Profiles are authored in `data/config.message.json`. Unlike the other configs in this suite, this one is optional: a
project without it behaves exactly as it did before, with every speaker on the engine's own pace and no sound at all.

The profile key is whatever literally sits in the Name field, which means a message whose Name field reads "`\N[1]`" is
keyed as "`\N[1]`" and NOT as the actor's name. Messages with no Name field fall back to a key built from the face image
and its index, like "`People2:3`", so that eight characters sharing one face sheet can still sound like eight different
people.

## Tags

- [Choice Conditionals](notetags/choice-conditionals.md)