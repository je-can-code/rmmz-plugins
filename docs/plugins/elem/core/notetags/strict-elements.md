---
type: notetag
title: Strict Elements
description: The tag restricting the elements a battler can be hurt by to a whitelist.
tags: [elem, tag, element, strict, immunity]
---

# Strict Elements

## Description

Have you ever wanted a battler to be completely immunte to all elemental damage with the exception of just one or more
elements? Well now you can! By applying the appropriate note tag to the various database locations applicable, you can
restrict incoming damage to be limited to only a subset of the available elements.

### Details

All sources are checked and a list of all "strict" elements are combined to define for a given battler. Effectively,
this is a whitelist of all elements a battler can be hurt by. If there are no tags found on any sources, then all
elements are added to the list as a default. Similar to [absorption](absorb-elements.md), only the elements that a
skill has that overlap with the "strict" elements of a battler are considered for calculation.

## NOTE ABOUT MULTIPLE SOURCES

Defining the same element on two different sources does nothing extra. Additionally, this effect could also be done
without this plugin by just adding a 0%-rate for all elements except the one you want, but if you have a ton of
elements, that might get unwieldly, which is the exact reason I created this functionality.

## TAG USAGE

- Actors
- Enemies
- Weapons
- Armor
- States
- Classes

## TAG FORMAT

`<strictElements:[NUM]>` (for one strict element)
`<strictElements:[NUM,NUM,...]>` (for many strict elements)

## TAG EXAMPLES

`<strictElements:[8]>`
This battler now can only receive damage from skills with element id of 8.

`<strictElements:[3,5,6]>`
This battler now can only receive damage from skills that include the element id of 3, 5, or 6.

`<strictElements:[1,2,3,4,5,6]>` on state applied to battler.
`<strictElements:[1,8]>` on battler (either actor or enemy).
This battler now can only receive damage from skills that include the element id of 1, 2, 3, 4, 5, 6, or 8.