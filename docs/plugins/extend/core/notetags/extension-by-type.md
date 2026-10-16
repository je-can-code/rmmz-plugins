---
type: notetag
title: Extension By Type
description: The tag making a skill or state extend every skill or state that carries a matching type classifier.
tags: [extend, tag, skill, state, extension, type]
---

# Extension By Type

## Description

As an alternative to [id-based extension](skill-extension.md), a skill or state can instead extend EVERY skill/state
carrying a matching `<type:CLASSIFIER>` tag (see [`J-Base`](../../../_base/core/notetags/state-type-classifier.md)),
without having to list each target id individually.

## NOTE ABOUT CANDIDATE POOLS

States draw type/id candidates from the battler's currently ACTIVE states (including passive-injected ones). Skills draw
candidates from the caster's KNOWN/learned skills — a skill overlay never applies unless the caster has actually learned
it, same as id-based skill extension already worked.

## NOTE ABOUT RESOLUTION ORDER

When a candidate pool has both type-based and id-based extension candidates for the same base skill/state, type-based
overlays are applied first (in ascending id order), then id-based overlays are applied second (also ascending id
order) — id-based extensions win on conflict since they apply last.

## TAG USAGE

- Skills
- States

## TAG FORMAT

`<extendType:CLASSIFIER>`
Where CLASSIFIER is the type classifier string to match against (see
[`J-Base`'s `<type:CLASSIFIER>` tag](../../../_base/core/notetags/state-type-classifier.md)).

## TAG EXAMPLES

`<extendType:poison>`
This state acts as an extension to every currently active state that carries `<type:poison>`, regardless of that
state's specific id.

`<extendType:low-effort>`
This skill acts as an extension to every skill the caster knows that carries `<type:low-effort>`, regardless of that
skill's specific id.