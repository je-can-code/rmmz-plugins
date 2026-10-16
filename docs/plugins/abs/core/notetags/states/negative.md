---
type: notetag
title: Negative
description: The classifier informing the AI that a state is harmful.
tags: [abs, tag, state, ai]
---

# Negative

## Description

Functionally, a "negative" flag does not change how a state works, but it informs the AI that this state is harmful.
Healers and support ally AI will attempt to remove these states when choosing actions.

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