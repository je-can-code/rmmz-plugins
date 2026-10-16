---
type: notetag
title: HP Cost Reduction
description: The tag reducing how much HP skills cost, as percentage points subtracted from 100 (hcr).
tags: [resources, tag, hcr, cost, hp]
---

# HP Cost Reduction

## Description

Have you ever wanted to mitigate how much HP your skills cost, the same way MCR and TCR work for MP and TP? Well now
you can! By applying the appropriate tag(s) to your database objects, you can reduce HP skill costs across the board-
because lets face it, raw HP costs can add up fast.

## NOTE ABOUT ADDITIVE REDUCTION

Unlike MCR/TCR which are multipliers, HCR is additive subtraction from 100. A tag of `<hcr:[5]>` means "reduce HP
costs by 5 percentage points", making it easy to read at-a-glance what each piece of equipment contributes.

## NOTE ABOUT THE FORMULA CONTEXT

Unlike most formula tags in these plugins, this one is evaluated per note source directly (not per-battler), so there
is no `a` battler reference available- only literal numeric expressions are safe here (e.g. `[5]`, `[10 - 2]`).
Referencing a battler property will throw.

## TAG USAGE

- Actors
- Enemies
- Classes
- Weapons
- Armor
- States

## TAG FORMAT

`<hcr:[VALUE]>`
Where VALUE is the integer percentage to reduce HP costs by.

## TAG EXAMPLES

`<hcr:[5]>`
Reduces all HP skill costs by 5%.