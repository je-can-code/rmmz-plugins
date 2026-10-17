---
type: notetag
title: Skill Extension
description: The tag making a skill or state act as an extension to other skills or states, listed by id.
tags: [extend, tag, skill, state, extension]
---

# Skill Extension

## Description

Have you ever wanted to have a single skill gain additional effects by learning other skills? Well now you can! By
applying the appropriate tag to the skill(s) in question, you too can have skills that can progressively gain additional
upgrades/capabilities as a battler learns more skills!

## TAG USAGE

- Skills
- States

## TAG FORMAT

`<extend:[NUM]>`
`<extend:[NUM,NUM,...]>`
Where NUM is the skill or state id to extend.

## TAG EXAMPLES

`<extend:[40]>`
This skill/state will [act as an extension](../overview.md#what-does-act-as-an-extension-mean) to skill/state of id 40.

`<extend:[7,8,9,10,11]>`
This skill/state will act as an extension to all skills/states of id 7, 8, 9, 10, and 11.