# Notetag Reference

One flat, scannable list of every notetag across every plugin in this repo — what it does, what it
applies to, how it works, and a real example. This is the authoring lookup; each plugin's own
`_annotations.js` (visible in-editor via the RPG Maker plugin manager's help panel) is the
authoritative source this list is generated from and kept in sync with.

Organized by plugin, in the order plugins were audited. Within a plugin, tags are grouped the same
way the plugin's own annotations group them.

**About formula tags (`[FORMULA]` in a tag's format line):** most formula tags across this repo run
through the same evaluator and share the same `a`/`b`/`v` convention — `a` is the battler/context the
formula is being evaluated for, `b` is the relevant base parameter, `v` is `$gameVariables._data`.
**This is not universal** — some plugins bind different letters to different things (`abs/ext/shield`
uses `s` for the shield value; `abs/core`'s slip-effect formulas bind `b` to the *target* battler
rather than the base parameter). Every entry below states its actual bindings explicitly — don't
assume the default without checking.

---

## J-CriticalFactors (`src/plugins/crit/core/`)

### `<thisCritChance:[FORMULA]>`

**Applies to:**
Skills, Items

**When:**
this specific skill/item is executed

**Formula context:**
`a` = this action's subject (the attacker),
`b` = 0 (unused; present for formula consistency),
`v` = `$gameVariables._data`.

**Effect:**
adds FORMULA (a percent) to the critical chance of this action only. Stacks additively with other
crit effects. Has no effect on skills whose damage formula doesn't have "Critical Hits" set to YES.

```
<thisCritChance:[25]>
```
Increases the critical chance of this particular skill by 25%.

**See also:** `<thisCritMultiplier>`, `<thisCritsAlways>`

---

### `<thisCritMultiplier:[FORMULA]>`

**Applies to:**
Skills, Items

**When:**
this specific skill/item lands a critical hit

**Formula context:**
same as `<thisCritChance>` above — `a` = attacker, `b` = 0, `v` = `$gameVariables._data`.

**Effect:**
adds FORMULA (a percent) to the critical damage multiplier for this action only.

```
<thisCritMultiplier:[10 + a.agi]>
```
Increases the critical damage multiplier by 10% plus the battler's agility.

**See also:** `<thisCritChance>`, `<critMultiplier>`/`<critMultiplierBase>`

---

### `<thisCritsAlways>`

**Applies to:**
Skills, Items

**When:**
this specific skill/item is executed

**Effect:**
this action always crits, bypassing the normal crit-chance roll entirely.

```
<thisCritsAlways>
```

**See also:** `<thisCritsAlwaysIfState>`, `<thisCritsAlwaysIfStateType>`

---

### `<critMultiplierBase:NUM>` / `<critMultiplier:NUM>`

**Applies to:**
Actors, Classes, Skills, Weapons, Armors, States

**When:**
always (contributes to the battler's standing critical damage multiplier)

**Effect:**
NUM is added to the battler's critical damage multiplier — a plain number, not a formula.
`critMultiplierBase` is intended for static sources (actors) since it's the more meaningful hook for
J-NaturalGrowths formulas; `critMultiplier` is intended for everything else. Both behave identically
otherwise and multiple tags across sources sum together.

```
<critMultiplier:50>
```
Increases the outgoing critical damage multiplier by 50% for this battler.

```
<critMultiplier:10>
<critMultiplier:40>
<critMultiplier:150>
```
Three stacked tags increase the outgoing critical damage multiplier by 200% total for this battler.

**See also:** `<cdmBuffPlus>` family (J-NaturalGrowths compat, below), `<critReduction>`

---

### `<critReductionBase:NUM>` / `<critReduction:NUM>`

**Applies to:**
Actors, Classes, Skills, Weapons, Armors, Enemies, States

**When:**
always (contributes to the battler's standing critical damage reduction — internal parameter name
`ctr`)

**Effect:**
NUM is added to how much a battler's critical damage is reduced when they're hit by one — a plain
number, not a formula. Reduces only the critical bonus portion of the damage, not the base damage the
crit is calculated from. Same base/non-base split rationale as `critMultiplierBase`/`critMultiplier`
above.

```
<critReduction:30>
```
Reduces critical damage against this battler by 30%.

```
<critReduction:10>
<critReduction:30>
<critReduction:80>
```
Three stacked tags total above 100 — this battler takes zero bonus damage from critical hits (they're
treated the same as non-crits for damage purposes, though the hit is still flagged as a "critical hit"
for other effects that key off that).

**See also:** `<ctrBuffPlus>` family (J-NaturalGrowths compat, below), `<critMultiplier>`

---

### J-NaturalGrowths compat: `<cdmBuffPlus>` / `<cdmBuffRate>` / `<cdmGrowthPlus>` / `<cdmGrowthRate>` / `<ctrBuffPlus>` / `<ctrBuffRate>` / `<ctrGrowthPlus>` / `<ctrGrowthRate>`

**Applies to:**
Actors, Classes, Skills, Weapons, Armors, Enemies, States

**When:**
J-NaturalGrowths is also loaded; these follow that plugin's buff/growth pattern

**Formula context:**
real formula support here (unlike the `thisCrit*` tags above) —
`a` = the battler these bonuses are being calculated for,
`b` = the battler's base value for this parameter (`baseCriticalMultiplier()` for `cdm` tags,
`baseCriticalReduction()` for `ctr` tags — 0.5 by default for both),
`v` = `$gameVariables._data`.

**Effect:**
`cdm` (crit damage multiplier) and `ctr` (crit taken rate — the same internal stat the
`critReduction` tags above feed into, just spelled to match J-NaturalGrowths' own naming convention)
each get Buff (temporary, lost when the source is removed) and Growth (permanent, accumulates per
level) variants, each with Plus (flat) and Rate (percent-of-base) forms.

**Watch out:** the natural-growth prefix is `ctr`, not `cdr` — there is no `cdr*` tag family. Using
`<cdrBuffPlus:...>` (a plausible-looking guess) silently does nothing, since it doesn't match any
registered regex.

```
<cdmGrowthRate:[5]>
```
Gain +5% crit damage multiplier (cdm) per level, compounding as an ever-increasing bonus.

```
<ctrBuffPlus:[25]>
```
Gain a flat 25 crit taken rate reduction (ctr) while this tag's source is applied; lost if the source
is removed.

```
<cdmGrowthPlus:[a.level * 3]>
```
Gain (level × 3) crit damage multiplier (cdm) per level.

**See also:** `<critMultiplier>`, `<critReduction>` (the non-Natural-Growths equivalents)

---

### `<thisCritApply:[STATE_ID, CHANCE]>` / `<thisCritSelf:[STATE_ID, CHANCE]>` / `<onCritApply:[STATE_ID, CHANCE]>` / `<onCritSelf:[STATE_ID, CHANCE]>`

**Applies to:**
`thisCrit*` — Skills, Items only.
`onCrit*` — Actors, Classes, Skills, Weapons, Armors, Enemies, States (any note source on the
attacker).

**When:**
`thisCrit*` fires only when the specific tagged skill/item lands a crit; `onCrit*` fires whenever ANY
of the attacker's actions lands a crit. Requires J-ABS; silently ignored outside JABS combat.

**Effect:**
rolls CHANCE% (0–100, independently per tag) to apply STATE_ID. `Apply` variants target the battler
that was crit; `Self` variants target the attacker who landed the crit.

```
<thisCritApply:[5, 30]>
```
This skill has a 30% chance to apply state 5 to the target when it crits.

```
<onCritSelf:[20, 50]>
```
Whenever this battler (carrier of the tag) lands any critical hit, 50% chance to apply state 20 to
themselves — good fit for a passive mastery state granting a character-wide on-crit self-buff.

**See also:** `<forceCritProcs>` (makes these rolls always succeed)

---

### `<forceCritProcs>`

**Applies to:**
Actors, Classes, Skills, Weapons, Armors, Enemies, States

**When:**
always, once present on any of the attacker's note sources

**Effect:**
forces every `thisCritApply`/`thisCritSelf`/`onCritApply`/`onCritSelf` roll above to succeed, as if
the attacker had rolled a guaranteed positive result — without touching the attacker's real
`isVeryLucky()`/`isVeryCursed()` flags anywhere else, and without inflating crit chance itself.
Accumulate Mode and Encore still read the attacker's real values and stack normally on top.

```
<forceCritProcs>
```
A mastery capstone state with this tag turns `<onCritApply:[5, 25]>` (25% chance) into a guaranteed
application on every crit.

**See also:** the `onCrit`/`thisCrit` state-application family above

---

### `<thisCritChanceIfState:[STATE_ID, BONUS_CHANCE]>` / `<critChanceIfState:[STATE_ID, BONUS_CHANCE]>`

**Applies to:**
`thisCritChanceIfState` — Skills, Items only.
`critChanceIfState` — Actors, Classes, Skills, Weapons, Armors, Enemies, States.

**When:**
`thisCrit*` only while that specific skill executes; `critChanceIfState` for any of the attacker's
actions

**Effect:**
adds BONUS_CHANCE (0–100+) to crit chance when the target already has STATE_ID. Multiple tags for
different states stack additively when the target has more than one match.

```
<thisCritChanceIfState:[14, 100]>
```
Guaranteed crit chance against targets afflicted with state 14, for this skill only.

```
<critChanceIfState:[14, 30]>
```
While this note source is active on the attacker, all of their actions gain +30% crit chance against
targets afflicted with state 14 — useful on a passive mastery state that rewards building into a
specific debuff.

**See also:** `<critChanceIfStateType>`, `<critAlwaysIfState>`

---

### `<thisCritChanceIfStateType:[TYPE, BONUS_CHANCE]>` / `<critChanceIfStateType:[TYPE, BONUS_CHANCE]>`

**Applies to:**
same source rules as the state-id variant above

**When:**
same as the state-id variant above

**Effect:**
identical to `critChanceIfState`, but matches by a state's `<type:TYPE>` classifier
(case-insensitive) instead of a specific state id — "any bleed" instead of "specifically state 15."

```
<critChanceIfStateType:[bleed, 50]>
```
While this note source is active, all actions gain +50% crit chance against targets with any state
typed "bleed".

**See also:** `<critChanceIfState>`

---

### `<thisCritsAlwaysIfState:[STATE_ID, ...]>` / `<critAlwaysIfState:[STATE_ID, ...]>`

**Applies to:**
`thisCrit*` — Skills, Items only.
`critAlwaysIfState` — Actors, Classes, Skills, Weapons, Armors, Enemies, States.

**When:**
same split as the chance-bonus variants above

**Effect:**
guarantees a crit (bypassing target crit evasion, same as `<thisCritsAlways>`) when the target has ANY
of the listed state ids. Accepts one or more comma-separated state ids; multiple tags stack via OR.

```
<thisCritsAlwaysIfState:[14, 7]>
```
This skill always crits against targets afflicted with state 14 OR state 7.

**See also:** `<critAlwaysIfStateType>`, `<critChanceIfState>`

---

### `<thisCritsAlwaysIfStateType:TYPE>` / `<critAlwaysIfStateType:TYPE>`

**Applies to:**
same source rules as the state-id guaranteed-crit variant above

**When:**
same as the state-id guaranteed-crit variant above

**Effect:**
identical to `critAlwaysIfState`, but matches by type classifier (case-insensitive) instead of a
specific state id.

```
<critAlwaysIfStateType:bleed>
```
While this note source is active, all actions always crit against targets with any state typed
"bleed".

**See also:** `<critAlwaysIfState>`
