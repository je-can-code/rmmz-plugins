---
type: notetag
title: By-Formula Packets
description: The tag applying an inline formula's result to a resource of each recipient when its packet triggers.
tags: [abs-formula, tag, skill, formula, packet]
---

# By-Formula Packets

## Description

Use this to apply an inline formula result to a resource for one or more recipients when the packet triggers.

### Semantics of the formula result

- Positive result => loss (damage to HP/MP/TP)
- Negative result => gain (healing HP, or granting MP/TP)
- Zero => no effect

### Battle pipeline adjustments

These are applied automatically.

Damage path (positive results):

- Element rate (from the parent skill)
- Critical (on-hit packets only, mirrors the parent action’s crit)
- Physical/Magical damage rate (based on parent skill’s phys/mag type)
- Native guard
- Variance
- JABS guard/parry reductions

Healing path (negative results turned positive internally):

- Element rate
- Physical/Magical damage rate (treats as the parent’s type)
- Variance
- REC (recovery) on the recipient, and HAR (healing rate) on the caster

### Visuals and logs

- Popups (`J-POPUPS`): shows resource-specific damage/heal popups
- Logs (`J-LOG`): writes action-log entries attributed to the parent skill

## NOTE ABOUT COMMAS

The formula segment may not contain a comma (the tuple is parsed by splitting on commas), so multi-argument function
calls like `Math.max(a, b)` cannot be used inline. Keep formulas to operators only (`+ - * / ( )` and whitespace); wrap
complex logic in a `Game_Action`-registered context helper instead (see `registerFormulaContext`).

## TAG USAGE

- Skills

## TAG FORMAT

`<onApplyFormula:[HH, AA, RR, FORMULA]>`
Where HH is the trigger: `hit` triggers after the parent skill successfully hits a target, and `use` triggers
immediately when the parent skill is used (even if it misses).
Where AA is the affect: `self` is the user of the skill, `target` is the primary target of the parent skill (falls back
to self if none), `allies` is all allies of the user on the map, `enemies` is all enemies of the user on the map, and
`all` is all battlers on the map (living and animate only).
Where RR is the resource: `hp`, `mp` or `tp`.
Where FORMULA is a JavaScript expression evaluated with these variables in scope: `a` = source (the user/subject),
`b` = recipient (the current entity being affected), `v` = `$gameVariables._data` (array-style access: `v[10]`, etc.),
`i` = the parent `RPG_Skill` (useful for metadata lookups). The formula may use standard JS math (e.g., `Math.max`,
`Math.floor`).

## TAG EXAMPLES

`<onApplyFormula:[hit, target, hp, a.atk * 2 - b.def]>`
On hit, damage the original target’s HP for the user’s ATK x2 minus target DEF.

`<onApplyFormula:[use, self, tp, 25]>`
On use, grant self 25 TP immediately.

`<onApplyFormula:[hit, allies, hp, -(a.mhp * 0.10)]>`
On hit, heal allies for 10% of the user’s max HP (negative = heal).

`<onApplyFormula:[use, enemies, mp, 5]>`
On use, drain 5 MP from all enemies (positive = loss).