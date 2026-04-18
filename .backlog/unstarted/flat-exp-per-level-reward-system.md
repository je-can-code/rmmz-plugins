---
status: open
area: feature
---

# Flat EXP-per-level + hand-tuned kill rewards (`.hack//`-style)

## Source

- `src/plugins/abs/core/managers/JABS_Engine.js` — `gainBasicRewards`, `getRewardScalingMultiplier`, `gainExperienceReward`.
- `src/plugins/level/managers/LevelScaling.js` — `LevelScaling.Scope.REWARD` (piecewise linear delta scaling; overlaps this design).
- Chef Adventure: leveling is **only** from enemy kills; high map density; optional `expPlus` on enemies today.

## Context

Progression economics are hard when both **class EXP curves** (`Classes.json` / engine “to next level”) and **per-enemy** `exp` + `<expPlus>` try to encode pacing. Discussion converged on:

1. **Flat requirement per level** — e.g. **1000 EXP to level** (configurable), replacing or overriding the default curve for relevant classes.
2. **Kill reward** computed in code, not baked into wild `<expPlus>` curves:
   - **Plugin baseline** at parity (e.g. 25 EXP) as a parameter.
   - **Database `enemy.exp`** as a **small additive bonus** on that baseline (e.g. baseline 25 + DB 5 ⇒ **30** before deltas).
   - **Level-difference multiplier** from a **hand-authored switch / lookup** (anchors like parity, ±5, ±10; no single closed-form required).
   - **Tier** as **+%** (e.g. +5% per tier, cap +50% at tier 10), or absorbed into “effective level” later.
   - **Player/party modifiers** (`exr`, global +% EXP buffs) applied in a defined order **after** policy steps.
3. **Ownership**: rules live in **J-LevelMaster** (or a namespace shipped with it); **JABS** keeps a thin choke point (`gainBasicRewards` asks LevelMaster for the final EXP amount). Avoid overriding `RPG_Enemy#exp` to mean “computed reward” — keep DB semantics clear.

Retire or narrow **`LevelScaling` reward scope** so it does not double-apply with the new delta table.

## Work

1. **Engine**: override or replace per-level EXP requirement so “to next” is flat (parameter), for the classes / modes that use this system.
2. **API**: `computeKillExp({ enemy, killerActor, ... })` → integer; document stacking order: `(baseline + dbExp) * deltaMult * tierMult * …` then `exr` / buffs.
3. **JABS**: route `gainBasicRewards` through the API; stop treating `enemy.exp()` as the whole story unless mid-migration.
4. **Data migration**: gradually strip `<expPlus>` (and simplify `exp`) where redundant; keep DB `exp` only as the “bonus lane” if desired.
5. **Tuning**: validate kills-per-level on representative maps (density, tier mix), not only theory.

## Notes

- Related: `enemy-elite-states-notetag-extension.md` — elite punch may also affect rewards if desired (separate knob).
- Saves: changing level-up requirements affects pacing for in-progress saves; plan a cutover or compatibility note.
