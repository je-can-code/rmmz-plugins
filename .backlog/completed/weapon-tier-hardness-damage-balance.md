---
status: completed
area: feature
resolution: superseded
---

> **Resolved (2026-06-22):** The SDP redesign switched all panels from flat stat grants to %-based multipliers on base parameters. Weapon ATK/MAT is now the foundation the SDP scales off of, so a better weapon is always meaningfully better — the problem dissolved structurally. No separate tier/hardness/pierce system needed.

# Weapon relevance vs SDP: tier throttling, hardness, and armor piercing

## Source

- [`src/plugins/sdp/`](src/plugins/sdp/) (Stat Distribution Panel — large voluntary stat budgets on actors)
- Damage pipeline: [`src/plugins/sdp/objects/Game_Action.js`](src/plugins/sdp/objects/Game_Action.js) and related `Game_Action` stacks in ABS/JABS as applicable
- Equipment data: `RPG_Weapon`, `RPG_Armor`, notetag parsing via `RPGManager` / J-Base database hydration

## Context

Voluntary growth from **SDP** can dwarf the contribution of weapon (and armor) **base parameters**, so equips feel cosmetic numerically even when they carry identity and fantasy. The fix is not necessarily “nerf SDP” alone: we need a **damage or mitigation channel** where weapon tier / weapon class / ammunition meaningfully throttles or scales outgoing impact unless the build invests in the right counters.

Candidate mechanics (non-exclusive):

- **Weapon tier gates**: notetag-driven tiers that cap or scale effective damage contribution before SDP modifiers, or require minimum tier to fully utilize high actor stats.
- **Hardness vs armor piercing**: attacker-side pierce stat vs defender hardness reduces or amplifies physical (or typed) damage in a bounded curve so gear and enemy taxonomy matter even when raw atk/stat pools are huge.
- Parallel idea: **effective weapon contribution floor/ceiling** so SDP shifts secondary stats while the weapon sets the “carrier” for the hit scale.

## Severity

**High** for Chef Adventure–scale balance where SDP is central; **medium** for projects that already clamp stats.

## Gain

**High** player-facing clarity: weapons and enemy armor choices become readable levers again; tuning becomes two-knob (build growth vs equipment tier) instead of one gigantic stat stack.

## Work

- **Baseline audit**: in a representative mid/late build, measure typical SDP contribution vs naked weapon params + variance; document the ratio targets we want (spreadsheet or Vitest fixture numbers).
- **Pick a primary mechanism** (tier gate, hardness/pierce, or hybrid) and document formulas in plugin help—not buried only in code.
- Implement **notetag + parameter** surfaces on weapons, skills, enemies, and states; wire into the earliest consistent hook in the damage chain (respect multi-plugin `Game_Action` ordering).
- **Migration / content**: Chef Adventure (or consumer) pass to tag enemies and weapons so the system is visible in play—not math-only.
- Regression tests or harness cases for: low-tier weapon + huge SDP, high-tier weapon + modest stats, pierce vs hardness breakpoints.

## Notes

- Cross-reference completed modernization context in `completed/sdp-plugin-revisit.md`; this item is **gameplay balance and mechanics**, not another SDP code cleanup pass.
- If JAFTING socketing adds stat gems (`jafting-ext-socketing.md`), ensure pierce/hardness/tier math stays coherent with socket bonuses.
