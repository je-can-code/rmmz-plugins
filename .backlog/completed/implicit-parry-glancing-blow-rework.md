---
status: done
area: feature
---

# Implicit parry → glancing blow rework

## Source

- Implicit parry formula: [`src/plugins/abs/core/managers/JABS_Engine.js`](src/plugins/abs/core/managers/JABS_Engine.js) — `implicitParryChancePercent`, `checkParry`, `isParryPossible`
- Damage reduction hook: [`src/plugins/abs/core/objects/Game_Action.js`](src/plugins/abs/core/objects/Game_Action.js) — `calculateParryDamageReduction` (currently returns 0)
- Plugin params: [`src/plugins/abs/core/_metadata/_pluginMetadata.js`](src/plugins/abs/core/_metadata/_pluginMetadata.js) — `ImplicitParryBaselineFloor`, `ImplicitParryBaselinePerLevel`, `ImplicitParryDominanceMultiplier`

## Context

Implicit (passive) parry currently **fully negates** an incoming hit — the attack connects visually but deals zero damage. In a 3D ARPG this is balanced by counterplay (dodge roll behind, flank, attack blind spots). In CA's 2D tile/pixel environment there is **no practical way to avoid facing** — enemies aggro toward you, and 4-directional movement offers no flanking. The result is a random "your hit did nothing" with no player agency, which violates the **readable combat** pillar and makes early encounters feel unresponsive.

During Ch1 playtesting (May 2026), even with a −15 GRD penalty on Ghosties, the *perceived* parry rate felt oppressive. The rebased HIT stat (Jerald starts at 0.37, not vanilla 0.95) compresses the attacker-side pressure `A`, which inflates implicit parry chance against anything that isn't drastically weaker.

### Proposed change: glancing blow (inverted crit)

Replace the binary "full hit / full negate" with a **damage spectrum**:

| Outcome | Trigger | Damage |
|---|---|---|
| **Critical hit** | Crit roll succeeds | Bonus multiplier (existing) |
| **Clean hit** | Normal | 100% |
| **Glancing blow** | Current implicit parry roll succeeds | **X% of normal** (e.g. 30–50%) — reduced, not zero |
| **Miss** | EVA-based dodge | 0% (rare, earned by defender stats) |

- The glancing blow chance is driven by the **same attacker-vs-defender pressure ratio** (`A / D`) that implicit parry uses today.
- Full 0-damage negation is removed from the implicit path entirely; only **active player parry/guard** (timed, skill-driven) retains full negate + counter potential.
- The glancing blow percentage could scale with the ratio (closer to `invM` = more reduction, closer to `M` = barely reduced) or be a flat fraction — TBD during implementation.

### Benefits

1. **No dead swings.** Every attack deals *something*; combo rhythm is never broken by RNG.
2. **Stat progression is visible.** As HIT / level / gear improve, glancing blows become less frequent *and* less severe — the player sees their build improving through the ratio of clean hits to glances.
3. **Weapon identity preserved.** Ties into the weapon-tier-hardness pipeline: a high-tier weapon should glance less often than a starter weapon against the same enemy.
4. **Enemy defense stays meaningful.** High-GRD / high-AGI enemies still *feel* tankier (more glances, longer TTK) without the "your hit vanished" frustration.

## Related

- **[`weapon-tier-hardness-damage-balance.md`](weapon-tier-hardness-damage-balance.md)** — hardness/pierce is the *damage scaling* side; glancing blow is the *hit resolution* side. Both share the "weapon tier matters" philosophy and should coexist in the damage chain. Consider implementing together or sequentially.
- **Player active parry** (`Game_Action.handleGuardEffects`, timed guard) — stays as-is (full negate + counter). The distinction is: implicit = enemy passive friction → glancing; active = player skill expression → full parry.

## Severity

**High** for CA — the intro cave already feels off. Affects every encounter from minute one.

## Gain

**High** player-facing feel: combat becomes "I always hit, but sometimes weakly" instead of "my sword passed through a ghost and nothing happened."

## Formula tuning data (May 2026 playtest)

Current defaults: `baselineFloor=50`, `baselinePerLevel=0.25`, `M=2`.

Jerald's HIT is rebased to ~0.10 at level 1 and ~0.37 at level 3 (not vanilla 0.95). The floor of 50 drowns out actual stats — `hundredX(0.37) = 37`, which is *less* than the baseline alone.

### Simulated parry% under candidate tunings

| Matchup | Current (50/M=2) | 25/M=2 | 25/M=3 | 30/M=2.5 |
|---|---|---|---|---|
| Lv1 Jerald vs Lv1 Ghosty (grd=1.0) | 56% | 46% | 64% | 59% |
| Lv3 Jerald vs Lv1 Ghosty (grd=1.0) | 21% | 0% | 28% | 20% |
| Lv3 Jerald vs Lv1 Ghosty (grd=0.85) | 0% | 0% | 0% | 0% |
| Lv3 Jerald vs Lv3 Needler | 24% | 0% | 31% | 23% |
| Lv5 Jerald vs Lv5 Wolftrap | 18% | 0% | 23% | 15% |
| Lv5 Jerald vs Lv6 Bearcat | 21% | 0% | 27% | 20% |
| Lv5 Jerald vs Lv8 Kappa | 23% | 0% | 30% | 22% |

**25/M=2** effectively kills implicit parry once you have any stat advantage — fine as a quick-fix during playtest but too aggressive long-term. **30/M=2.5** is closest to current feel at mid-levels while lowering the early-game pain. Either way, the glancing blow conversion (partial damage instead of zero) is the real fix.

## Work

- **Formula adjustment**: retune `implicitParryChancePercent` — lower `baselineFloor` from 50 (see table above) and consider adjusting `M`. See simulation data for candidate values.
- **Glancing blow integration**: when the implicit parry roll succeeds, route to `calculateParryDamageReduction` (already stubbed, returns 0) with a configurable reduction factor instead of zeroing damage.
- **Visual/audio feedback**: glancing blows should have a distinct popup color or text (e.g. smaller/grey number, "GLANCE" tag) so the player can read what happened. Potentially a different hit sound.
- **Plugin parameters**: expose glancing blow damage floor (e.g. 0.3–0.5), whether to scale reduction with ratio, and a hard cap on implicit parry chance if desired.
- **Playtest pass**: verify early-game feel (intro cave, road to Raevula, mines entry) with new formula.

## Notes

- The glancing blow concept existed in a previous RM era (pre-MZ) as a working mechanic. This is a resurrection, not a new invention.
- Do not touch player-side active parry/guard — that system is the mastery layer (Tier C) and works as intended.