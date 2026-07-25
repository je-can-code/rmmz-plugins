---
status: open
area: documentation
---

# Comprehensive notetag reference

## Severity

**Low urgency, high authoring value** — the ecosystem has accumulated ~100+ notetags across a dozen
plugins through the SDP redesign and associated hook work. There is no single place to look up "what
tags exist, what plugin owns them, and what they do." Authors (including Jeremy) currently have to
know which doc to check per plugin.

## Gain

- One flat scannable reference for authoring enemies, states, gear, and skills without chasing plugin
  annotations or implementation-status docs.
- Onboarding surface for future collaborators.
- Reveals gaps: tags that exist in the plugin but have no authored example in CA, or tags that were
  planned but never shipped.
- Natural home for cross-plugin interactions (e.g. `<onCritApply>` + `<spread>` combo behavior).

## Format (proposed)

One entry per tag. Flat, no narrative. Example:

```markdown
## `<onCritApply:[STATE_ID, CHANCE]>`

**Plugin:** J-CriticalFactors  
**Valid sources:** Actor, Class, Weapon, Armor, State, Skill (via getAllNotes())  
**When:** this battler lands any critical hit  
**Effect:** applies STATE_ID to the target at CHANCE% probability  

\`\`\`
<onCritApply:[14, 50]>   // 50% to apply Poison on any crit
<onCritApply:[18, 100]>  // 100% to blind on any crit
\`\`\`

**See also:** `<thisCritApply>`, `<onCritSelf>`, `<thisCritSelf>`
```

Tags with multiple related variants (onCrit family, onAllyHeal family, etc.) can share one entry with
a variants table rather than one entry per variant.

## Scope

Plugins to cover (non-exhaustive — audit during authoring):

| Plugin | Known tag families |
|---|---|
| J-ABS core | skill history, range scaling, state damage multipliers, cast-time damage, state spread, `autoApplyState`, `autoExecuteSkill`, `removeOnSkillExecution`, `removeStateOnMove`, `stateDuration`, `shieldBreak`, `retaliate`, `perDebuffBuff`, `bonusDamageIfState/Type`, `pierceElement`, `noHpPopup` family |
| J-CriticalFactors | `onCrit*`, `thisCrit*` families |
| J-Resources-ABS | `onSelf*Heal*`, `onAlly*Heal*` families; `lst`/`mst`/`tst` steal tags |
| J-Passive | `passive`, `hideFromPassiveList`, `hideFromJabsMenu` |
| J-Passive-Conditional | `passiveSourceRule`, `passiveStateRule`, `passiveStateCount`, `autoApplyState` (conditional), `autoExecuteSkill` (conditional) |
| J-SDP | `sdpMultiplier`, `sdpBonusFormula`, `sdpPoints`, `sdpDropData`, `sdpUnlock` |
| J-Elementalistics | `pierceElement`, `thisPierceElement` |
| J-ABS-Shield | `shield`, `shieldCap`, `shieldProtect`, `shieldBreak` |
| J-ABS-Food | `food`, `overstuffedImpervious`, `foodChain`, `foodGroupColor` |
| J-Base | `type` (state classifier), `goldMultiplier`, `dropMultiplier`, `evaBuffPlus`, `lukBuffPlus`, `speedBoost`, `grdBuffRate/Plus`, `criBuffRate`, `mdfBuffPlus`, `castTimeDamageBonus`, `castTimePercent`, `stateDurationFlat/Perc`, `extendStateType`, `stackMax`, `loseAllStacksAtOnce`, `spread` family, `viral`, `hpPercent/Formula/Flat` slip family |
| J-Natural | natural param buff tags |

## Sources

All existing cookbook content lives in:

- `src/plugins/sdp/core/_metadata/_annotations.js` — SDP tag cookbook (most complete)
- `ca/docs/sdp/implementation-status.md` — Tag authoring reference section (authoritative for P3/P4 hooks)
- `ca/docs/sdp/mastery-cheatsheet.md` — Quick reference cookbook table
- Per-plugin `_annotations.js` files — primary source of truth per plugin

A semi-automated scrape of `J.*.RegExp` objects across all plugins would produce a tag inventory to
cross-reference against the cookbook docs.

## Work

1. **Inventory** — scrape all `J.*.RegExp` keys across plugins to get a full tag list; diff against
   existing cookbook docs to find undocumented tags.
2. **Author entries** — one pass per plugin family; pull prose from existing annotations + implementation-status cookbook; add examples from CA authored content where possible.
3. **Place** — probably `ca/docs/notetag-reference.md` (CA-scoped) or `rmmz-plugins/docs/notetag-reference.md` (ecosystem-scoped). Decide at authoring time.
4. **Keep current** — add a one-liner to the new-tag checklist: "add entry to notetag reference before closing the PR."

## Notes

- This is documentation work, not code. No plugin changes required.
- The SDP redesign (2026) was the forcing function that created most of the ~100 tags. A post-redesign
  audit is the natural moment to do this.
- Do not duplicate implementation-status.md — link to it for runtime behavior details; the reference
  is for authoring lookup, not design rationale.
