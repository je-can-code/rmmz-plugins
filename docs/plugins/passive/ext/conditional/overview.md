---
type: overview
title: The Plugin Overview
description: The general overview for what this plugin is about along with the when and how you might use it.
tags: [passive-conditional, overview]
---

# Overview

Extends [`J-Passive`](../../core/index.md) so passive grants from a source can be gated and scaled. Unconditional
passives are simply grants with no rules.

## Tag families

Tag families on database rows (skills, states, equip, class, actor, enemy, etc.):

- [`passiveSourceRule`](notetags/gate-tags.md) — gates every passive from this source
- [`passiveStateRule`](notetags/gate-tags.md) — gates one state id from this source
- [`passiveStateCount`](notetags/stack-count.md) — stack contribution for one state id from this source
- [`autoApplyState`](notetags/auto-apply-state.md) — applies a real combat state on a timer or combat event
- [`autoApplyStateOnNearby`](notetags/auto-apply-state-on-nearby.md) — same as `autoApplyState`, but aura-style onto
  nearby battlers instead of the bearer
- [`autoExecuteSkill`](notetags/auto-execute-skill.md) — executes a map skill on a timer or combat event
- [`autoModifyCooldowns`](notetags/auto-modify-cooldowns.md) — modifies one or more of the bearer's own active
  skill-slot cooldowns on a timer or combat event
- [`autoInflictState`](notetags/auto-inflict-state.md) — applies a real combat state onto whoever this battler just
  inflicted a state upon
- [`removeOnSkillExecution`](notetags/remove-on-skill-execution.md) — chance to strip a stack from this state when the
  bearer executes a map skill
- [`removeOnSkillResolution`](notetags/remove-on-skill-resolution.md) — chance to strip a stack from this state when
  the bearer's fired action expires
- [`removeStateOnMove`](notetags/remove-state-on-move.md) — strips this state the instant the bearer moves (pairs with
  `autoApplyState`'s "stand")

## How does it work?

Map battlers re-check on a [throttled timer](parameters/reconcile-delay-frames.md); any passive refresh re-evaluates.