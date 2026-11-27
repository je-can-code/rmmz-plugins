---
type: notetag
title: Negative
description: The classifier marking a state as harmful, for the AI, for immunity, and for rolls no action aims.
tags: [abs, tag, state, ai]
---

# Negative

## Description

A "negative" flag marks a state as harmful. It does not change what the state does once it lands, but three things
read it:

- the AI: healers and support ally AI will attempt to remove these states when choosing actions;
- immunity: [`<immuneToNegatives>`](state-application-immunity-resistance.md) blocks them;
- fate: when no action aims the roll that applies a state, as with an aura, a state spreading or a state applied as
  another expires, a negative state is harm, so each curse its target carries is one more chance for it to land. Any
  other state is help there, and each of those curses is one more hurdle it has to clear. See
  [On-Chance Roll Manipulation](../skills/on-chance-roll-manipulation-lucky-cursed-rolls.md).

## NOTE ABOUT THE CLASSIFIER

The flag is J-Base's shared `<type:CLASSIFIER>` tag with the classifier `negative`, rather than a tag of its own, so it
composes with the classifier-based tags like `<stateTypeResist>` and `<stateTypeImmune>`.

## TAG USAGE

- States

## TAG FORMAT

`<type:negative>`

## TAG EXAMPLES

`<type:negative>`
This state is flagged as harmful, so healers and support ally AI will attempt to remove it.