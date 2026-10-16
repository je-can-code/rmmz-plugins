---
type: notetag
title: Growth Curves
description: The tags giving a class an authored formula for a parameter beyond level 99, and for its base max TP.
tags: [level, tag, class, parameter, formula, growth]
---

# Growth Curves

## Description

Have you ever wanted precise, authored control over a stat's growth past level 99 instead of trusting a
slope-extrapolation guess? Well now you can! By tagging a class with a growth curve formula for a given parameter, that
formula becomes the source of truth for that stat beyond 99- replacing the fallback extrapolation entirely for that
class/param combination.

## NOTE ABOUT AUTHORING

These are primarily generated via the jmz-data-editor's Classes board (which previews the exact same formula evaluation
the runtime uses), but nothing stops you from hand-authoring them directly on a class note.

## NOTE ABOUT MTP

Every base parameter (mhp/mmp/atk/def/mat/mdf/agi/luk) only uses its growth curve tag beyond level 99- levels 1-99 stay
driven by the class's baked `params[]` array from the database. MTP is different: it has no `params[]` array at all
(it's a `J-Base`/`J-NaturalGrowth` note-tag-only stat), so its growth curve tag, when present, is evaluated LIVE for
every level, not just beyond 99.

Either way, a curve is only the base. An MTP curve stands in for `J-Base`'s configured base max TP, and every
[`<maxTp>`](../../../_base/core/notetags/custom-max-tp.md) tag and natural growth or buff still adds on top of it.

## NOTE ABOUT FORMULAS

Formula context:

- `a.level` = the level being evaluated (this is the ONLY binding available- no `b`, no `v`, unlike most other formula
  tags in this ecosystem)

## TAG USAGE

- Classes only.

## TAG FORMAT

`<mhpGrowthCurve:[FORMULA]>`
`<mmpGrowthCurve:[FORMULA]>`
`<atkGrowthCurve:[FORMULA]>`
`<defGrowthCurve:[FORMULA]>`
`<matGrowthCurve:[FORMULA]>`
`<mdfGrowthCurve:[FORMULA]>`
`<agiGrowthCurve:[FORMULA]>`
`<lukGrowthCurve:[FORMULA]>`
`<mtpGrowthCurve:[FORMULA]>`

## TAG EXAMPLES

`<atkGrowthCurve:[20 + (a.level * 3)]>`
Beyond level 99, this class's ATK follows 20 + (level * 3) instead of the slope-extrapolation fallback.

`<mtpGrowthCurve:[a.level * 2]>`
This class's base max TP is (level * 2), evaluated live at every level- not just beyond 99. Gear, states and natural
buffs add on top.