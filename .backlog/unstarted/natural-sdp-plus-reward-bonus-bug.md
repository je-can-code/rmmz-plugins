---
status: open
area: bug
---

# J-NaturalGrowths `sdpPlus` reward bonus not applying

## Symptom

Enemies with `<sdpPlus:[FORMULA]>` notetags yield only the base `<sdpPoints:N>` value — the formula bonus is silently lost. Example: Wolftrap (enemy 301, level 5) has `<sdpPoints:3>` and `<sdpPlus:[(a.level * 1)]>` but only grants **3** SDP points instead of the expected **8** (3 + 5).

This affects all enemies with `sdpPlus` formulas, making early-game SDP accumulation painfully slow (3 points per kill against a rank-up cost of 74 for a Common panel = 25 kills before one investment).

## Suspected cause (investigate in order)

### 1. Plugin alias ordering (most likely — post-ESM migration)

J-SDP defines `Game_Enemy.prototype.sdpPoints` (returns `this.enemy().sdpPoints`). J-NaturalGrowths aliases it and wraps with `+ this.sdpsPlus()`. If the ESM import chain resolves J-NaturalGrowths' `Game_Enemy.js` **before** J-SDP's `Game_Enemy.js`, the alias captures the pre-SDP version and J-SDP then overwrites the prototype method entirely, discarding the Natural wrapper.

**Check:** In the built output, verify which plugin's `Game_Enemy.prototype.sdpPoints` assignment runs last. The Natural alias `J.NATURAL.Aliased.Game_Enemy.set("sdpPoints", ...)` must capture J-SDP's version, not the base engine's.

**Files:**
- `src/plugins/sdp/core/objects/Game_Enemy.js` — defines `sdpPoints` (line 163)
- `src/plugins/natural/core/objects/Game_Enemy.js` — aliases `sdpPoints` (line 299), adds `sdpsPlus()` (line 307)

### 2. `refreshSdpRewardBonuses()` never called or called too early

`refreshRewardBonuses()` is called from `refreshAllParameterBuffs()`, which is called from `Game_Enemy.setup()`. If `setup()` runs before the enemy's `<level:N>` tag is parsed by J-LevelMaster, then `a.level` in the formula would be 1 (engine default) or undefined, and the buff gets set to the wrong value — or 0 if it errors out silently.

**Check:** Add a `console.log` in `refreshSdpRewardBonuses()` to print the computed `sdpsBonus` value and the enemy's level at call time.

### 3. Formula evaluation failure

The regex `/<sdpPlus:\[([+\-*/ ().\w]+)]>/gi` should match `<sdpPlus:[(a.level * 1)]>`. But `RPGManager.getResultsFromAllNotesByRegex` could silently return 0 if:
- The `a` binding doesn't resolve to the enemy battler in the formula context
- The `getAllNotes()` call for the enemy doesn't include the enemy's own database note (unlikely but check)
- The formula throws and is caught somewhere upstream

**Check:** Breakpoint or log inside `naturalParamBuff` when `structure` matches `RewardSdps` and inspect the `total` returned.

## Code path (for reference)

```
Enemy setup
  → Game_Enemy.setup()
    → refreshAllParameterBuffs()
      → refreshRewardBonuses()          [overridden by J-Natural on Game_Enemy]
        → refreshSdpRewardBonuses()
          → naturalParamBuff(RewardSdps regex, base sdpPoints)
            → RPGManager.getResultsFromAllNotesByRegex(...)
          → setSdpsPlus(result)

On kill (JABS path):
  → JABS_Engine.determineSdpGained(enemy, actor)
    → enemy.sdpPoints()                [J-Natural alias wraps J-SDP's version]
      → base (from J-SDP: this.enemy().sdpPoints = 3)
      → + this.sdpsPlus()              [should be 5, returning 0]
    → × levelMultiplier
    → return total
```

## Impact

**High** — SDP points are the currency for the build system (design pillar: "become the build you loot"). At 3 points per kill with rank-up costs of 74+, players cannot meaningfully engage with the Empower/node system during Ch1. The formulas were designed to scale SDP income with enemy level but the bonus is completely absent.

## Validation

After fix, verify:
- Wolftrap (lv5) with `<sdpPlus:[(a.level * 1)]>` yields **8** SDP points (3 + 5)
- Ghosty (lv1) yields **4** (3 + 1)
- Bearcat (lv6) check whatever formula it has
- Higher-level enemies scale proportionally