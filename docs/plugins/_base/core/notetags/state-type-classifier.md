---
type: notetag
title: State Type Classifier
description: The tag grouping a state into one or more named categories that other plugins and tags can react to.
tags: [base, tag, state, type, classifier]
---

# State Type Classifier

## Description

Have you ever wanted to group states into named categories, like "poison" or "bleed", so other plugins/tags can react to
"any state of this category" instead of a single hardcoded state id? Well now you can! By applying this tag to a state's
notebox, that state is classified under one or more named types.

## NOTE ABOUT MULTIPLE TAGS

A single state may carry more than one `<type:CLASSIFIER>` tag, and will belong to every classifier listed across all of
its tags.

## NOTE ABOUT CASING

Classifier strings are intended to be compared case-insensitively by consumers of this tag (such as `J-ABS`'s type-based
damage bonus tags).

## TAG USAGE

- States

## TAG FORMAT

`<type:CLASSIFIER>`
Where CLASSIFIER is the name of the category this state belongs to.

## TAG EXAMPLES

`<type:poison>`
`<type:bleed>`
This state is classified as both "poison" and "bleed".