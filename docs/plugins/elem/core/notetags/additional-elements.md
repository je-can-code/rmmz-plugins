---
type: notetag
title: Additional Elements
description: The tag adding one or more extra attack elements to a skill.
tags: [elem, tag, element, skill]
---

# Additional Elements

## Description

Have you ever wanted a skill to be both fire and ice typed? Well now you can! By applying the appropriate tag to the
skill(s) in question, you can add one or more "attack elements" to a given skill.

## NOTE ABOUT NORMAL ATTACK

If you use "normal attack" as the base element on a skill, you will apply all elements that your normal attack should
include AND all elements you add with this tag.

## TAG USAGE

- Skills

## TAG FORMAT

`<attackElements:[NUM]>` (for one extra element)
`<attackElements:[NUM,NUM,...]>` (for many extra elements)

## TAG EXAMPLES

`<attackElements:[22]>`
Adds the element of 22 to the skill, in addition to any other attack elements the skill has.

`<attackElements:[1,2,5]>`
Adds elements 1, 2, and 5 to the skill, in addition to any other attack elements the skill has.