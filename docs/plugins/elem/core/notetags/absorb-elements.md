---
type: notetag
title: Absorb Elements
description: The tag making a battler absorb one or more elements from anything that performs elemental calculations.
tags: [elem, tag, element, absorb]
---

# Absorb Elements

## Description

Have you ever wanted a battler to completely absorb lightning type skills? Well now you can! By applying the appropriate
note tag to the various database locations applicable, you can absorb one or more "absorb elements" from anything that
performs elemental calculations (mostly skills/items).

### Details

When a skill lands on a battler, all relevant notes will be checked to see if the incoming skill elements have any
overlap with the elements that this battler absorbs. If there are ANY elements absorbed, then all non-absorbed elements
will be removed from consideration and all elements being absorbed will have their rates multiplied together.
Absorption is prioritized over handling elements with 0% rate (null elements).

### Example 1

If an enemy was weak to fire, but absorbed ice, and you hit them with a fire+ice element skill, the weakness would be
ignored and the skill would be absorbed at the rate provided for ice.

### Example 2

If an enemy was immune to fire, but absorbed ice, and you hit them with a fire+ice element skill, the immunity would be
ignored, and the skill would be absorbed at the rate provided.

### Example 3

If an enemy absorbed both fire at 200% (or no rate specified) and ice at the rate of 300%, and you hit them with a
fire+ice element skill, the rates would be multiplied together and the rate would be 600% damage absorbed.

## NOTE ABOUT MULTIPLE SOURCES

Defining the same element on two different sources does nothing extra.

## TAG USAGE

- Actors
- Classes
- Skills
- Weapons
- Armor
- Enemies
- States

## TAG FORMAT

`<absorbElements:[NUM]>` (for one absorbed element)
`<absorbElements:[NUM,NUM,...]>` (for many absorbed elements)
Where NUM is the element id from the "types" tab.

## TAG EXAMPLES

`<absorbElements:[4]>`
This battler now absorbs element id of 4.

`<absorbElements:[10,18]>`
This battler now absorbs elements 10 and 18.

`<absorbElements:[3,7]>` on battler (either actor or enemy)
`<absorbElements:[4,7,9,12]>` on armor (only applicable to actors)
`<absorbElements:[10]>` on state
This actor now absorbs elements 3, 4, 7, 9, 10, and 12.