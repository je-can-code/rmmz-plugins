---
type: notetag
title: By-Skill (Child Skill) Packets
description: The tag executing another authored skill as a child of the parent action when its packet triggers.
tags: [abs-formula, tag, skill, child, packet]
---

# By-Skill (Child Skill) Packets

## Description

Use this to execute another authored skill as a child of the parent action.

Child skill executions:

- Do not consume cost, do not apply cooldown, and do not run common events.
- Execute immediately as a JABS action (animations/effects/collisions/logs/threat apply).
- Do not cascade further FORMULA/skill packets (one level only).
- For on-hit packets, child damage can mirror the parent crit state when appropriate.

## NOTE ABOUT POSITION BIAS

For target/allies/enemies/all, position bias uses the recipient’s current location when available, which is useful for
ground-targeted child skills.

## NOTE ABOUT FORCED EXECUTION

Child skill execution is compute/force-only (no costs/cooldowns/casts).

## TAG USAGE

- Skills

## TAG FORMAT

`<onApplySkill:[HH, AA, SKILL_ID]>`
Where HH is the trigger: `hit` | `use`, as on [By-Formula Packets](by-formula-packets.md).
Where AA is the affect: `self` | `target` | `allies` | `enemies` | `all`, as on
[By-Formula Packets](by-formula-packets.md).
Where SKILL_ID is the database ID of the skill to execute.

## TAG EXAMPLES

`<onApplySkill:[hit, target, 123]>`
On hit, also fire skill 123 at the original target.

`<onApplySkill:[use, self, 77]>`
On use, cast an aura skill 77 centered on self.