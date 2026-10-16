---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [abs-formula, overview]
---

# Overview

This extension enables a single skill to apply additional effects using one or more "formula packets" or "child-skill
packets". Each packet can:

- Fire at a specific time (on use or on hit)
- Affect a particular set of recipients (self, allies, target, enemies, all)
- Either:
  1. Apply an inline formula to HP/MP/TP, or
  2. Execute another authored skill as a child

Packets are defined via note tags on skills. Multiple packets can be declared on the same skill by placing multiple tags
on the skill’s note box.

## Requirements

- `J-Base` (required by all of my plugins)
- [`J-ABS`](../../core/overview.md) (Action Battle System)

## Scope

- These tags are read from Skills only.
- Items are currently not parsed by this extension.

## Execution order and timing

- on-use packets are applied immediately when the parent skill is used.
- on-hit packets are applied after the parent skill resolves hit/miss and damage.
- Multiple packets of the same timing are applied in the order they appear in notes.

## Validation and safety

- Invalid tags (unknown trigger/affect/resource/mode) are ignored.
- Skills only: tags on other database objects are ignored by this extension.
- Recipients must be alive and animate (dead/inanimate are filtered out).
- If a child skill id does not exist, the packet is ignored.
- Inline formulas run under JS eval; keep them simple and deterministic.

## Compatibility

- `J-Base`: required; used for note parsing helpers.
- `J-ABS`: required; this is an ABS extension and depends on JABS context.
- `J-POPUPS` (optional): enables damage/heal popups for packets.
- `J-LOG` (optional): enables action-log entries for packets.

## Quick reference

[By-formula](notetags/by-formula-packets.md):

`<onApplyFormula:[hit|use, self|target|allies|enemies|all, hp|mp|tp, FORMULA]>`

[By-skill](notetags/by-skill-child-skill-packets.md):

`<onApplySkill:[hit|use, self|target|allies|enemies|all, SKILL_ID]>`

Formula variables: `a` = user/subject, `b` = recipient, `v` = `$gameVariables._data`, `i` = `RPG_Skill`.

Result sign: `+` => damage/loss, `-` => heal/gain.