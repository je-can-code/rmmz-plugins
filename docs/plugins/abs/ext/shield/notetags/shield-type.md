---
type: notetag
title: Shield Type
description: The tag limiting a shield to soaking damage of specific elements.
tags: [abs-shield, tag, state, shield, element, type]
---

# Shield Type

## Description

Have you ever wanted to have a shield that was explicitly designed to protect the bearer from fire damage? Or even
fire, ice, and lightning, but nothing else? Well now you can! By applying the appropriate tag on your states, you too
can have elemental shields that are explicitly designed to protect certain types of damage.

## TAG USAGE

- States

## TAG FORMAT

`<shieldType:[TYPES...]>`
Where TYPES... is a comma-delimited array of numbers that represent the element ids from your database of the elements
that you want this shield to be typed with.

## TAG EXAMPLES

`<shieldType:[1,2,3]>`
A shield that will soak damage if damage is taken that is of elements 1, 2, or 3.

`<shieldType:[1]>`
A shield that will soak damage if damage is taken that is of element 1.