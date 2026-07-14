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

---

## J-DropsControl (`src/plugins/drops/core/`)

### `<drops:[TYPE,ID,CHANCE]>`

**Applies to:**
Enemies only

**When:**
enemy is defeated

**Effect:**
adds an additional drop beyond the editor's native 3-drop limit. TYPE is `i`/`item`, `w`/`weapon`, or
`a`/`armor` (short and long forms both work); ID is the database id; CHANCE is a percent (this plugin
also reinterprets the editor's native "Probability" field as a #/100 percent instead of vanilla's
denominator system — that's a required, always-on side effect of installing this plugin, not
optional). Additive with native editor-configured drops. Multiple `<drops>` tags — even duplicates
for the same item — are each rolled independently.

```
<drops:[i,3,10]>
```
10% chance to drop item id 3.

```
<drops:[w,12,65]>
<drops:[w,12,15]>
<drops:[a,5,100]>
```
Three independent rolls: 65% chance at weapon 12, a separate 15% chance at another weapon 12, and a
guaranteed (100%) armor 5.

**See also:** `<dropMultiplier>`

---

### `<dropMultiplier:NUM>`

**Applies to:**
Actors, Classes, Skills, Weapons, Armors, States

**When:**
always (contributes to the party's standing drop-rate multiplier)

**Effect:**
NUM is a flat percent added to drop chance, multiplicatively applied to each drop's own percentage
(not a flat percentage-point add). Every party member's tags sum together into one party-wide rate.
Party Ability "Drop Item Double" doubles the *entire* multiplier once, regardless of how many copies
of that ability are present.

```
<dropMultiplier:50>
```
+50% drop chance. A 40% drop becomes 60% (50% of 40 is 20, added on). A 4% drop becomes 6% (50% of 4
is 2, added on).

```
<dropMultiplier:10>
<dropMultiplier:40>
<dropMultiplier:200>
```
Three stacked tags sum to +250% drop chance. A 40% drop becomes 140%; a 4% drop becomes 14%.

**See also:** `<drops>`, `<dorBuffPlus>` family (below)

---

### J-NaturalGrowths + SDP compat: `<dorBuffPlus>` / `<dorBuffRate>` / `<dorGrowthPlus>` / `<dorGrowthRate>`

**Applies to:**
Actors, Classes, Skills, Weapons, Armors, States

**When:**
J-NaturalGrowth is also loaded; silently ignored without it

**Formula context:**
`a` = the battler these bonuses are being calculated for,
`b` = 0 (dor's base is always 0 — avoids re-entering the note lookup these formulas already live
inside),
`v` = `$gameVariables._data`.

**Effect:**
a second, independent drop-rate bonus from `<dropMultiplier>` above — this one lives on its own
registered parameter (key `dor`), is SDP-panel-earnable, and follows J-NaturalGrowths' Buff (temporary,
lost when the source is removed) / Growth (permanent, accumulates per level) × Plus (flat) / Rate
(percent-of-base) pattern instead of a flat additive number.

```
<dorGrowthPlus:[a.level * 0.5]>
```
Permanently gain (level × 0.5)% drop rate per level.

```
<dorBuffPlus:[15]>
```
Gain a flat 15% drop rate while this tag's source is applied; lost if the source is removed.

**See also:** `<dropMultiplier>`

---

### `<goldMultiplier:NUM>`

**Applies to:**
Actors, Classes, Skills, Weapons, Armors, States

**When:**
always (contributes to the party's standing gold-rate multiplier)

**Effect:**
NUM is a flat percent added to gold earned from defeating enemies. Does not apply to gold from other
sources (events, scripts, plugin commands). Every party member's tags sum together into one party-wide
rate.

```
<goldMultiplier:50>
```
+50% gold from defeated enemies.

```
<goldMultiplier:65>
<goldMultiplier:10>
<goldMultiplier:100>
```
Three stacked tags sum to +175% gold from defeated enemies.

---

## J-Elementalistics (`src/plugins/elem/core/`)

### `<attackElements:[NUM]>` / `<attackElements:[NUM,NUM,...]>`

**Applies to:**
Skills only

**When:**
skill's elemental calculation is performed

**Effect:**
adds one or more extra attack elements to a skill, on top of whatever element the skill's damage
formula already specifies. If the skill's base element is "Normal Attack," all of the attacker's
weapon elements apply too, in addition to the tag's elements.

```
<attackElements:[1,2,5]>
```
Adds elements 1, 2, and 5 to the skill, in addition to any other attack elements the skill has.

**See also:** `<absorbElements>`, `<strictElements>`

---

### `<absorbElements:[NUM]>` / `<absorbElements:[NUM,NUM,...]>`

**Applies to:**
Actors, Classes, Skills, Weapons, Armors, Enemies, States

**When:**
target's elemental calculation is performed

**Effect:**
lists elements this battler absorbs (heals from instead of taking damage). If a skill's elements
overlap with any absorbed element, ALL non-absorbed elements on that skill are dropped from
consideration and the rates of only the absorbed elements are multiplied together — absorption takes
priority over both weakness and 0%-rate immunity. Same element defined on multiple sources doesn't
stack extra.

```
<absorbElements:[10,18]>
```
This battler now absorbs elements 10 and 18.

**Worked example:** enemy is weak to fire but absorbs ice; hit with a fire+ice skill — the fire
weakness is ignored entirely and the whole hit is absorbed at ice's rate.

**See also:** `<attackElements>`, `<strictElements>`, `<pierceElement>` (pierce explicitly never
touches absorbed elements)

---

### `<boostElement:ELEMENT_ID:PERCENT_BOOST>`

**Applies to:**
Actors, Enemies, Weapons, Armors, Skills, States, Classes

**When:**
caster's elemental calculation is performed, for skills bearing ELEMENT_ID

**Effect:**
multiplies damage of skills bearing ELEMENT_ID by (1 + PERCENT_BOOST/100), on top of absorb/null/
strict rules. PERCENT_BOOST accepts negative numbers for a penalty instead of a boost (e.g. a
curse/debuff state). Multiple elements on one skill multiply their individual boosts together.

```
<boostElement:1:50>
```
+50% damage on skills bearing element id 1.

```
<boostElement:1:-30>
```
-30% damage on skills bearing element id 1 — useful for a curse/debuff state rather than a buff.

**See also:** `<pierceElement>` (a different mechanic — pierce nudges a *resistance* toward neutral;
boost multiplies the *final* rate regardless of resistance/weakness)

---

### `<strictElements:[NUM]>` / `<strictElements:[NUM,NUM,...]>`

**Applies to:**
Actors, Enemies, Weapons, Armors, States, Classes

**When:**
target's elemental calculation is performed

**Effect:**
whitelists the only elements this battler can take damage from. If no `strictElements` tag exists
anywhere on the battler, every element is allowed by default (i.e. this is opt-in). Same element
defined on multiple sources doesn't stack extra. Equivalent in effect to a 0%-rate on every element
except the whitelisted ones, without needing to configure every single element by hand.

```
<strictElements:[3,5,6]>
```
This battler now can only receive damage from skills that include element id 3, 5, or 6.

**See also:** `<absorbElements>`, `<attackElements>`

---

### `<pierceElement:[ELEMENT_ID, PIERCE_PERCENT]>` / `<thisPierceElement:[ELEMENT_ID, PIERCE_PERCENT]>`

**Applies to:**
`pierceElement` — Actors, Enemies, Classes, Skills (passively grants pierce on all casts while known),
Weapons, Armors, States (any note source on the attacker, read via `getAllNotes()`).
`thisPierceElement` — Skills only, and only for that specific skill being cast right now.

**When:**
attacker's elemental calculation is performed against a resisted (not weak, not absorbed) element

**Effect:**
sums all pierce contributions for the element being used and raises the target's effective element
rate toward 1.0 (neutral), hard-capped there — never past it into bonus-damage territory. Applied
*before* the attacker's `<boostElement>` multiplier. Never affects weaknesses (rate ≥ 1.0) or
absorbed elements — pierce has nothing to "pierce through" on either of those. Multiple tags on the
same element sum together across both scopes.

```
<pierceElement:[4, 30]>
```
The attacker pierces 30% of the target's fire (element 4) resistance on all skills. On a passive
mastery state, this is always active while the state is applied.

```
<thisPierceElement:[4, 40]>
```
Combined with `<pierceElement:[4, 30]>` from a state elsewhere on the attacker: 70 total fire pierce
on this skill specifically (40 skill-specific + 30 passive global).

**Worked example:** target has 0% fire rate (immune), attacker has 50 total fire pierce → effective
rate = min(1.0, 0.0 + 0.50) = 0.50, target takes 50% fire damage.

**See also:** `<boostElement>`, `<absorbElements>`

---

## J-Proficiency (`src/plugins/prof/core/`)

### `<proficiencyBonus:NUM>`

**Applies to:**
Actors, Classes, Skills, Weapons, Armors, States

**Watch out:** Enemies track their own skill proficiencies same as actors do, but the bonus-gain
wiring this tag feeds into (`Game_Actor.prototype.prof`) was only ever built for actors — the base
`Game_BattlerBase.prototype.prof` getter enemies inherit always returns `0`. A `<proficiencyBonus>`
tag on an enemy or an enemy-applicable source is inert. This is a known, current-behavior gap, not a
documentation choice — it's staying this way for now.

**When:**
battler gains skill proficiency from using a skill

**Effect:**
NUM is a flat bonus (not a percentage) added on top of the base proficiency gain, for every skill use.

```
<proficiencyBonus:3>
```
The attacker now gains +3 bonus proficiency for any skill used.

**See also:** `<proficiencyGivingBlock>`, `<proficiencyGainingBlock>`

---

### `<proficiencyGivingBlock>` / `<proficiencyGainingBlock>`

**Applies to:**
Actors, Classes, Skills, Weapons, Armors, Enemies, States

**When:**
always, for whichever battler carries the tag

**Effect:**
`proficiencyGivingBlock` prevents this battler from GIVING proficiency to whoever hits it with skills
(commonly placed on enemies or enemy-only states). `proficiencyGainingBlock` prevents this battler
from GAINING proficiency when it uses skills against others (commonly placed on actors or actor-only
states). Either tag works on anything — the source split above is just the common case, not an
enforced rule.

```
<proficiencyGivingBlock>
```
The battler that has this tag will not GIVE proficiency to any opposing battlers that hit this battler
with skills.

```
<proficiencyGainingBlock>
```
The battler that has this tag will not GAIN proficiency from any battlers that this battler uses
skills against.

**See also:** `<proficiencyBonus>`

---

## J-Passive (`src/plugins/passive/core/`)

### `<passive:[STATE_IDS]>` / `<uniquePassive:[STATE_IDS]>`

**Applies to:**
Actors, Classes, Enemies, Skills, Items, Weapons, Armors, States — plus map event comment commands
(for injecting passives onto a specific spawned battler without a duplicate database enemy).

**When:**
depends on the source: skills apply as long as the battler *knows* the skill (not just has it
equipped/slotted); items/weapons/armors apply to the whole party just by being in the party's
possession; actors/classes/enemies/states apply to just that battler while the source is
active/equipped/afflicted/leveled-into.

**Effect:**
applies STATE_IDS (comma-delimited) as passive states — always active regardless of the state's
database duration, cannot be removed by normal means while the source persists. `passive` stacks:
the same state id from two different sources is applied twice (real double-application, distinct
"instances" tracked). `uniquePassive` collapses to one application no matter how many sources tag the
same state id — and a `uniquePassive` tag anywhere always wins over a `passive` tag for the same
state id (unique is resolved and committed first every refresh pass).

```
<passive:[10]>
<passive:[10,11,12]>
```
Two separate sources each carrying one of these tags: state 10 applies twice (once per source), 11
and 12 apply once each.

```
<uniquePassive:[10]>
<passive:[10,11,12]>
```
Same state ids, but the first source uses `uniquePassive`: state 10 now applies only once (unique
wins), 11 and 12 still apply once each.

**See also:** `<equippedPassive>`/`<uniqueEquippedPassive>`, `<hideFromPassiveList>`

---

### `<equippedPassive:[STATE_IDS]>` / `<uniqueEquippedPassive:[STATE_IDS]>`

**Applies to:**
equippable items (weapons, armors) only

**When:**
only while the item is actually equipped — removing the equipment removes the passive immediately,
unlike the always-on `passive`/`uniquePassive` family for non-equip sources

**Effect:**
identical stacking/uniqueness rules to `<passive>`/`<uniquePassive>` above, scoped to equip-while-worn
instead of possess-while-in-inventory.

```
<equippedPassive:[10,11]>
```
While this equipment is equipped, state ids 10 and 11 are applied. Unequipping it removes them.

**See also:** `<passive>`/`<uniquePassive>`

---

### `<hideFromPassiveList>`

**Applies to:**
States only

**When:**
always, for the state carrying the tag

**Effect:**
excludes the state from the player-facing Passives menu list while it still fully contributes its
traits in combat. Intended for implementation-only passive duplicates (e.g. stack amplifiers) that
shouldn't clutter the player's view.

```
<hideFromPassiveList>
```

**See also:** `<passive>`

---

## J-Passive-OTIB (`src/plugins/passive/ext/otib/`)

### `<otib:[STATE_ID]>` / `<otib:[STATE_ID, STATE_ID, ...]>`

**Applies to:**
Items (consumable — needs some occasion other than "Never" to actually be usable)

**When:**
the item is consumed (fires off the vanilla `consumeItem` hook)

**Effect:**
permanently grants the actor who consumed the item all listed STATE_IDs as passive states (fed
through J-Passive's own pipeline, so they're visible in Scene_Passive alongside every other passive
source). One-time only per item id, per actor — consuming a second copy of the same item does
nothing further (`isOtibUnlocked` guards re-granting). Enemies and other non-actor battlers never
participate; consuming an OTIB item on their behalf is a no-op by design. Stat effects live entirely
on the granted State's own Traits — this plugin does not patch param/xparam/sparam directly.

```
<otib:[42, 55]>
```
Consuming this item permanently grants both State 42 and State 55 to the actor who consumed it.

**See also:** `<passive>` (J-Passive core)

---

## J-Passive-Conditional (`src/plugins/passive/ext/conditional/`)

Requires J-ABS. Map battlers re-check gate/count rules on a throttled timer (configurable, default
15 frames); any passive refresh also re-evaluates immediately.

### `<passiveSourceRule:[KIND, PARAM?]>`

**Applies to:**
any database row that can carry a `<passive>` grant (skills, states, equip, class, actor, enemy)

**When:**
every passive-rule reconcile pass for the bearer

**Effect:**
gates EVERY passive this source grants behind KIND's condition — if the condition fails, none of this
source's passives apply. Threshold kinds use `*Above` (>=) / `*Below` (<=): `hp`/`mp`/`tp` are current
resource percent, `mhp`/`mmp`/`mtp` are flat max values, `{registryKey}Above/Below` are flat or
hundred-scale per the parameter registry, `allAllies{key}Above/Below` requires every allied JABS
battler (including self) to pass. Discrete kinds: `alliesNearby`, `enemiesNearby`, `hasState`,
`negativeStateCount`, `slotOnCooldown`/`slotOffCooldown`/`allOnCooldown`/`allOffCooldown`,
`sinceLastMoved`/`Hit`/`Attacked`, `movedWithin`/`hitWithin`/`attackedWithin` (frames).

```
<passiveSourceRule:[allOffCooldown]>
```

**See also:** `<passiveStateRule>`, `<passiveStateCount>`

---

### `<passiveStateRule:[STATE_ID, KIND, PARAM?]>`

**Applies to:**
same as `<passiveSourceRule>`

**When:**
same as `<passiveSourceRule>`

**Effect:**
same KIND vocabulary as `<passiveSourceRule>`, but scoped to gating just ONE state id from this
source instead of every passive the source grants.

```
<passiveStateRule:[12, hpBelow, 25]>
```
State 12 only applies from this source while the bearer's HP is at or below 25%.

**See also:** `<passiveSourceRule>`, `<passiveStateCount>`

---

### `<passiveStateCount:[STATE_ID, KIND, PARAM]>`

**Applies to:**
same as `<passiveSourceRule>`

**When:**
same as `<passiveSourceRule>`

**Effect:**
instead of gating on/off, contributes a variable STACK COUNT to STATE_ID based on KIND: `negativeStateCount`,
`alliesNearby` (excludes self), `lessIsMoreHp`/`Mp`/`Tp` (more stacks the lower the resource),
`moreIsMoreHp`/`Mp`/`Tp` (more stacks the higher the resource), or `per-{registryKey}` (integer points
per stack from a parameter registry value).

```
<passiveStateCount:[12, lessIsMoreHp, 25]>
```

**See also:** `<passiveSourceRule>`, `<passiveStateRule>`

---

### `<autoApplyState:[STATE_ID, CONDITION, PARAM]>`

**Applies to:**
any database row that can carry a `<passive>` grant

**When:**
depends on CONDITION — see list below. PARAM is always the minimum frames between applies for that
source+state+condition combination, tracked per-bearer.

**Effect:**
applies a REAL JABS combat state (not a passive grant — do not also list the same state id in
`<passive:[...]>` on the same row, they're independent mechanisms) to the rule bearer whenever
CONDITION fires and the cooldown has elapsed. Conditions:
`time` (periodic while on the ABS map, interval = PARAM),
`hpDmg`/`mpDmg`/`tpDmg` (combat loss via `gain*` going negative — not skill MP/TP cost payment),
`anyDmg` (any of HP/MP/TP takes combat damage),
`whenCrit` (this battler is critically hit as the victim — not `onCritApply`),
`negaStateAdded`/`posiStateAdded`/`anyStateAdded` (a `<negative>`-tagged / non-negative / any combat
state is added to this battler),
`onHealHp`/`Mp`/`Tp` (this battler's own resource is restored),
`onAllyHeal` (a battler within proximity of this one is healed, any resource),
`onKill` (this battler defeats an enemy),
`onDamageDealt` (this battler lands damage on an opposing battler),
`move` (PARAM = whole tiles moved per apply; requires J-Pixelistics),
`stand` (PARAM = frames standing still on the map before applying).

```
<autoApplyState:[50, time, 900]>
<autoApplyState:[57, onKill, 0]>
<autoApplyState:[BUFF_ID, stand, 120]>
```

**See also:** `<autoApplyStateOnNearby>`, `<removeStateOnMove>` (the "stand" condition's natural pair)

---

### `<autoApplyStateOnNearby:[STATE_ID, KIND, MIN_COUNT, COOLDOWN_FRAMES, TRIGGER_TILES?]>`

**Applies to:**
same as `<autoApplyState>`

**When:**
pulse timer gated by COOLDOWN_FRAMES (tracked on the bearer) and a minimum nearby-battler count

**Effect:**
aura-style sibling of `<autoApplyState>` — instead of applying STATE_ID to the rule bearer, redirects
onto every battler currently in proximity. Only two KIND values do anything (every other
`<autoApplyState>` CONDITION has no proximity set to iterate and simply won't fire): `enemiesNearby`
targets nearby enemy JABS battlers, `alliesNearby` targets nearby allies excluding the bearer itself.
MIN_COUNT is the minimum number of battlers in range required for the pulse to fire at all — the
pulse then hits everyone currently in range, not just MIN_COUNT of them. Optional fifth TRIGGER_TILES
overrides the plugin's default proximity radius for this rule's gate only.

```
<autoApplyStateOnNearby:[60, enemiesNearby, 1, 120]>
```
Every 120 frames, if at least 1 enemy is within the default proximity radius, apply state 60 to every
nearby enemy.

**See also:** `<autoApplyState>`

---

### `<autoExecuteSkill:[SKILL_ID, CONDITION, PARAM]>`

**Applies to:**
same as `<autoApplyState>`

**When:**
same CONDITION vocabulary as `<autoApplyState>`, plus `enemiesNearby` as a 4- or 5-value tuple:
`<autoExecuteSkill:[SKILL_ID, enemiesNearby, MIN_COUNT, FRAMES]>` with an optional fifth
TRIGGER_TILES overriding the default proximity radius for this rule's gate only.

**Effect:**
fires SKILL_ID as a real map skill through JABS `forceMapAction` — no MP/TP cost, no skill cooldown.
Victims may parry and retaliate normally. The payload skill owns its own radius, hitbox, and damage
formula. Do not tag the payload skill itself with `<autoExecuteSkill>` (depth-guarded, but still —
don't).

```
<autoExecuteSkill:[1022, enemiesNearby, 1, 60]>
```

**See also:** `<autoApplyState>`, `<autoInflictState>`

---

### `<autoInflictState:[STATE_ID, CONDITION, COOLDOWN_FRAMES]>`

**Applies to:**
same as `<autoApplyState>`

**When:**
`negaStateInflicted`/`posiStateInflicted`/`anyStateInflicted` (this battler inflicts a
negative-tagged / non-negative / any state onto someone else), `onKnockback` (this battler knocks an
enemy back). COOLDOWN_FRAMES is the minimum frames between dispatches for this rule; 0 means every
time.

**Effect:**
unlike `<autoApplyState>` (targets the rule bearer) and `<autoApplyStateOnNearby>` (targets
proximity), this fires from an event involving an EXTERNAL battler — the rule bearer doing something
to someone else — and applies STATE_ID onto that same someone else. The bearer's own state-tracking
still credits the bearer as the inflictor of STATE_ID, matching who actually did it. Depth-guarded in
case STATE_ID is itself negative-tagged and would otherwise re-trigger this same rule on its own
application.

```
<autoInflictState:[70, negaStateInflicted, 0]>
```

**See also:** `<autoApplyState>`, `<autoExecuteSkill>`

---

### `<removeOnSkillExecution:[STYPE_ID, CHANCE]>`

**Applies to:**
States only — tag lives on the state that may be removed, not on skills/equip

**When:**
this battler executes a map skill

**Effect:**
rolls CHANCE (1–100). STYPE_ID 0 matches any skill type. On success, peels a stack via
`decrementStateStacks` (respects `loseAllStacksAtOnce` on this state row). Fires at the moment of
execution — before damage resolves.

```
<removeOnSkillExecution:[7, 100]>
```
Guaranteed stack peel whenever this battler executes any skill of type 7.

**See also:** `<removeOnSkillResolution>` (fires later, at action expiry, not execution)

---

### `<removeOnSkillResolution:[STYPE_ID, CHANCE]>`

**Applies to:**
States only — tag lives on the state that may be removed, not on skills/equip

**When:**
the action fired by this battler fully expires — after its last hit lands, or after it travels its
full duration without contacting any target

**Effect:**
same roll/peel mechanics as `<removeOnSkillExecution>`, but the timing difference matters: because
removal happens at expiry (after damage is already resolved), state traits such as ATK bonuses are
still present during the damage calculation for that cast — `<removeOnSkillExecution>` would have
already stripped them before damage.

```
<removeOnSkillResolution:[0, 25]>
```
25% chance to peel a stack when any fired action from this battler fully expires.

**See also:** `<removeOnSkillExecution>`

---

### `<removeStateOnMove:[STATE_ID]>`

**Applies to:**
States only — tag lives on the state doing the peeling

**When:**
the instant the bearer moves on the map

**Effect:**
unconditionally peels one stack from STATE_ID (or all stacks at once, if that state row has
`loseAllStacksAtOnce` set) — no chance roll, no stype filter, fires every single time the bearer
moves. Typically pairs with an `<autoApplyState>` `stand` rule for the same state id on the same
row: standing still builds the stack, moving strips it instantly, and the stand cooldown resets to a
full interval the moment you move again so the buildup can't restart immediately either.

```
<autoApplyState:[80, stand, 60]>
<removeStateOnMove:[80]>
```
On this same state row: standing still for 60 frames applies a stack of state 80. Taking even a
single step immediately strips it and resets the stand timer.

**See also:** `<autoApplyState>` (the `stand` condition)

---

## J-Passive-Affix (`src/plugins/passive/ext/affix/`)

Requires J-ABS. Policy layer: if a spawn event explicitly lists affix state ids via `<passive:[...]>`,
those win outright and no random rolling occurs for that spawn. Otherwise prefix/suffix are rolled
independently by chance + weighted pool.

### `<enemy-prefix>` / `<enemy-suffix>`

**Applies to:**
States only

**When:**
affix pool construction, at random-roll time for a spawned enemy

**Effect:**
marks this state as eligible to be selected as a random prefix (`enemy-prefix`) or suffix
(`enemy-suffix`) affix. A state needs one of these tags to be in the roll pool at all.

```
<enemy-prefix>
```

**See also:** `<affix-weight>`, `<tier-color-hex>`

---

### `<affix-weight:N>`

**Applies to:**
States (the prefix/suffix pool states)

**When:**
weighted random selection among pool members

**Effect:**
N is a positive integer weight — higher means more likely to be picked relative to other pool
members. Unweighted/untagged pool members presumably default to a weight of 1.

```
<affix-weight:10>
```
Ten times as likely as an affix with weight 1.

**See also:** `<enemy-prefix>`/`<enemy-suffix>`

---

### `<tier-color-hex:#RRGGBB>`

**Applies to:**
States (typically prefix-pool states)

**When:**
presentation only — map nameplate stripe, optionally HUD name row

**Effect:**
tints the map nameplate stripe (and optionally the HUD) when this prefix state is the selected tier
prefix on a spawned enemy. No tag means no stripe tint at all — this is opt-in presentation, not a
mechanical effect.

```
<tier-color-hex:#FF0000>
```

**See also:** `<enemy-prefix>`

---

### `<no-rng-passives>` / `<no-rng-passive-prefixes>` / `<no-rng-passive-suffixes>`

**Applies to:**
Enemies

**When:**
affix roll gate, before either slot rolls

**Effect:**
`no-rng-passives` blocks both prefix and suffix rolling entirely for this enemy. The two split
variants block just their one slot, leaving the other free to roll normally.

```
<no-rng-passive-prefixes>
```
Prevents rolling prefixes for this enemy, but suffixes may still roll.

**See also:** `<passive-affix-prefix-chance>`/`<passive-affix-suffix-chance>`

---

### `<passive-affix-prefix-chance:PERCENT>` / `<passive-affix-suffix-chance:PERCENT>`

**Applies to:**
Enemies, Events (comment commands)

**When:**
affix roll, for the slot the tag names

**Formula context:**
not a formula — PERCENT is 0–100, decimals allowed.

**Effect:**
overrides the percent chance for that slot's roll. Resolution order (traced through
`getResolvedPassiveAffixPrefixChance`): event comment override wins if present, otherwise the enemy
note override, otherwise the plugin's default parameter. Within a single event page, if multiple
chance tags for the same slot are present, the LAST one (by comment iteration order) wins — verified
against the actual resolution code, not just asserted.

```
<passive-affix-prefix-chance:100>
```
Always rolls a prefix (unless blocked by `<no-rng-passive-prefixes>`/`<no-rng-passives>`, or
preempted by an explicit `<passive:[...]>` list).

**See also:** `<no-rng-passives>` family

---

### `<rewardMultiplier:[TYPE, VALUE]>`

**Applies to:**
States (affix states or any other state on the enemy), Enemies

**When:**
enemy is defeated, reward calculation

**Effect:**
TYPE is one of `exp`, `gold`, `sdp`, `ap`, `drops`; VALUE is a decimal multiplier (2.0 = double).
Multiple tags per note are supported, one per reward type. When an enemy has multipliers from both
its own note AND its states, they stack MULTIPLICATIVELY (verified in `getRewardMultiplierByType`:
starts at 1.0, multiplies in the enemy note's value if present, then multiplies in each state's value
in turn) — e.g. 1.5x from note × 2.0x from a prefix state = 3.0x total, not 3.5x. The `drops` type
specifically multiplies the drop CHANCE percentage (verified: folds into `getDropMultiplierBonus`,
which is applied against `drop.denominator` used as a percent), not the number of items rolled.

```
<rewardMultiplier:[gold, 1.5]>
<rewardMultiplier:[drops, 1.25]>
```
These two tags on the same state grant 1.5x gold and 1.25x drop chance when the enemy is defeated.

**See also:** `<dropMultiplier>` (J-DropsControl core — composes additively with itself and the
party's bonuses into one base multiplier; this plugin's `<rewardMultiplier:[drops, ...]>` then
multiplies on top of that whole base, verified in the aliased `getDropMultiplierBonus` override)

---

## J-Aptitude (`src/plugins/apt/core/`)

### `<aptitude:[SKILL_ID, REQUIRED_AP]>`

**Applies to:**
Actors, Classes, Weapons, Armor, States

**When:**
this source is currently active on the actor (equipped/afflicted/currently-applied class) — swapping
gear/class/states changes which sources are actively receiving AP

**Effect:**
this source becomes a "teacher" for SKILL_ID: as AP flows into it, once REQUIRED_AP is reached the
skill is learned. Multiple sources can teach the same skill independently — progress is tracked
per-source, and learning happens the moment ANY one source's requirement is crossed.

```
<aptitude:[12,150]>
```
This source enables learning skill id 12 once the owner accumulates 150 AP through it.

**See also:** `<ap>`, `<aptMultiplier>`

---

### `<ap:AMOUNT>`

**Applies to:**
Enemies only

**When:**
enemy is defeated

**Effect:**
grants AMOUNT raw AP to the party (before `<aptMultiplier>` rate scaling), distributed into whichever
sources are currently active per actor. Gated by a level-difference threshold (plugin parameter,
`-1` disables the gate entirely) — if the killing actor is too many levels above the enemy, this is an
all-or-nothing block on the whole gain, not a partial scaling reduction. Also requires J-LevelMaster
loaded with level scaling enabled for the gate to apply at all.

```
<ap:6>
```
This enemy yields 6 AP upon defeat.

**See also:** `<aptitude>`, `<aptMultiplier>`

---

### `<aptMultiplier:AMOUNT>` / `<aptMultiplier:-AMOUNT>`

**Applies to:**
Actors, Classes, Skills, Weapons, Armors, States

**When:**
every AP gain, as a rate applied to the raw amount

**Effect:**
same pattern as J-SDP's `sdpMultiplier` — AMOUNT is a whole-number percent (not a literal multiplier
like 1.3), all matching tags across the actor's active note sources sum together into one rate, then
apply once against the raw AP amount. Also stacks with any SDP panel bonus for the `apr` parameter
key, if J-SDP is loaded. Values can be negative to reduce gain.

```
<aptMultiplier:80>
<aptMultiplier:-30>
```
Combined: +50% AP gain (80 - 30 = 50).

**See also:** `<ap>`, `<sdpMultiplier>` (J-SDP — same pattern, different resource)

---

## J-Aptitude-Typed (`src/plugins/apt/ext/typed/`)

### `<aptitudeTyped:[SKILL_ID, REQUIRED_AP, DOMAIN, ID_OR_NAME]>`

**Applies to:**
Actors, Classes, Weapons, Armor, States

**When:**
same activation rules as core `<aptitude>` — only currently-active sources receive typed AP

**Effect:**
same as `<aptitude>`, but REQUIRED_AP must be earned specifically as DOMAIN/ID_OR_NAME-typed AP, not
plain AP. DOMAIN is one of `element`, `weapontype`, `skilltype`; ID_OR_NAME is that domain's id or
name. Doesn't matter whether the typed AP came from explicit `<apTyped>` tags or implicit inference —
both count identically toward the requirement.

```
<aptitudeTyped:[12, 150, element, fire]>
```
Enables learning skill 12 once the owner gains 150 points of "fire" element AP specifically.

**See also:** `<apTyped>`, `<aptitude>` (J-Aptitude core)

---

### `<apTyped:[AMOUNT, DOMAIN, ID_OR_NAME]>`

**Applies to:**
Enemies only

**When:**
enemy is defeated

**Effect:**
explicit typed AP grant — AMOUNT of DOMAIN/ID_OR_NAME-typed AP, independent of (and in addition to)
any implicit typed AP inferred from how the enemy was fought. Repeatable — multiple tags on one
enemy each grant independently.

**Bug history:** this tag's regex required 4 comma-separated values through a copy-paste from
`<aptitudeTyped>`'s regex, while the code and every documented example used only 3 — meaning the
documented form never matched at all, and the 4-value form that *did* match got destructured
incorrectly (values shifted by one slot, domain/id resolution garbled). Fixed the regex to the
correct 3-value shape; the documented examples below were always accurate, only the regex was wrong.

```
<apTyped:[6, element, fire]>
```
This enemy yields 6 fire-element AP upon defeat.

**See also:** `<aptitudeTyped>`, `<ap>` (J-Aptitude core — untyped equivalent)

---

## J-LevelMaster (`src/plugins/level/core/`)

Config (scaling multipliers, invariance ranges, level balancers, max level settings) lives in
`data/config.level.json`, not plugin parameters — required, boots crash without it. Author via
jmz-data-editor's Level board.

### `<lv:NUM>` / `<lvl:NUM>` / `<level:NUM>`

**Applies to:**
Enemies, States, Events (w/ JABS) — Actors, Classes, Skills, Weapons, Armors, States

**When:**
level computation for the bearer

**Effect:**
NUM can be negative. On an enemy directly: sets base level. On a state/class/skill/weapon/armor:
grants a +/- modifier stacked against the base level. On a JABS map event: overrides whatever level
the spawned enemy's database note would otherwise provide — the event is authoritative, the database
note is just the default. Level `0` is special: a battler at level 0 is treated as a "non-level," and
every scaling multiplier to/from it is forced to 1.0x regardless of the other party's level.

```
<level:4>
```
On an enemy directly, sets base level to 4. On a state applied to an enemy, grants +4 to base level.
On a JABS spawn event, overrides the enemy's level entirely.

**See also:** `<hideLevel>`, `<maxLevelBoost>`

---

### `<hideLevel>`

**Applies to:**
Enemies, Events (w/ JABS) — no effect on States

**When:**
level display, not level calculation

**Effect:**
displays `???` instead of the numeric level in the battler name. Purely cosmetic — doesn't affect any
scaling math.

```
<hideLevel>
```

**See also:** `<level>`

---

### `<learning:[SKILL_ID, LEVEL_LEARNED]>`

**Applies to:**
Enemies only

**When:**
the enemy's skill list is built

**Effect:**
gates SKILL_ID out of the enemy's available actions until the enemy reaches LEVEL_LEARNED. The skill
must still be present in the enemy's actions list in the database — this tag is a level-check guard
on top of that, not a way to grant skills the enemy doesn't otherwise have. Reliant on JABS-specific
skill-list resolution; won't work as-intended outside JABS without a compatible extension.

```
<learning:[210, 10]>
```
Skill 210 becomes available once this enemy is level 10 or higher.

**See also:** `<level>`

---

### `<maxLevelBoost:AMOUNT>`

**Applies to:**
Actors, Classes, Skills, Weapons, Armors, States

**When:**
computing the actor's max level ceiling (beyond the database's 99 cap)

**Effect:**
AMOUNT (signed) modifies the actor's base "beyond max level" value, clamped at the configured
absolute cap (`trueMaxLevel`). Multiple tags across sources sum together.

```
<maxLevelBoost:+100> (on the actor)
<maxLevelBoost:-25> (on an equipped weapon)
```
Combined: +75 to base max level (100 - 25 = 75), still capped at the config's absolute max.

**See also:** `<mhpGrowthCurve>` family (below — the formulas that actually drive stat values once
you're past 99, this tag only controls how far past 99 you can go)

---

### `<mhpGrowthCurve:[FORMULA]>` … `<lukGrowthCurve:[FORMULA]>` (8 base params) / `<mtpGrowthCurve:[FORMULA]>`

**Applies to:**
Classes only

**When:**
the 8 base-param tags: only evaluated beyond level 99 (levels 1–99 stay driven by the class's baked
`params[]` array from the database). `mtpGrowthCurve`: evaluated LIVE at every level, since MTP has no
`params[]` array at all — it's a J-Base/J-NaturalGrowth note-tag-only stat.

**Formula context:**
`a.level` only — no `b`, no `v`, unlike most other formula tags in this ecosystem.

**Effect:**
when present, the formula becomes the source of truth for that class/param's value at the given
level, replacing `Game_Temp.buildBeyondMaxDataForClass`'s slope-extrapolation fallback entirely for
that combination. Untagged class/param pairs still fall through to the extrapolation guess. Primarily
authored via jmz-data-editor's Classes board (whose preview evaluates the identical formula/level
pairing the runtime does), but hand-authoring directly on a class note works too.

```
<atkGrowthCurve:[20 + (a.level * 3)]>
```
Beyond level 99, this class's ATK follows `20 + (level * 3)` instead of the extrapolation fallback.

```
<mtpGrowthCurve:[a.level * 2]>
```
This class's max TP is always `level * 2`, evaluated live at every level, not just beyond 99.

**See also:** `<maxLevelBoost>` (controls how far past 99 an actor can go; this controls what stats
look like once they're there)

---

## J-Level-Sync (`src/plugins/level/ext/sync/`)

Requires J-LevelMaster (hooks `getLevel()`). Real `_level`/EXP/save data are never mutated — sync is
purely an overlay on the computed level. A plugin-command session (if active) always wins over a map
note, and only persists/clears explicitly — it survives map transfers.

### `<levelSync:N>`

**Applies to:**
Map notes

**When:**
map setup, if no sync session is currently active (a session ignores map notes entirely)

**Effect:**
activates content sync at level N (N must be > 0) for the duration of the map. Default mode is
cap-only: actors above N get clamped down to N for `getLevel()` purposes; actors already below N are
unaffected. Clears automatically on leaving a map that doesn't have this tag, provided no session is
running.

```
<levelSync:50>
```
Real level 90 fights as 50; real level 30 fights as 30 (unchanged) — cap-only.

**See also:** `<levelSyncUp>`

---

### `<levelSyncUp>`

**Applies to:**
Map notes — paired with `<levelSync:N>` on the same note, has no effect alone

**When:**
same activation window as `<levelSync:N>`

**Effect:**
switches from cap-only to uplevel (exact sync) mode: ALL actors fight at exactly N, including
underleveled ones that cap-only mode would otherwise leave alone.

```
<levelSync:50>
<levelSyncUp>
```
Real level 90 fights as 50; real level 30 also fights as 50 (boosted) — exact sync.

**See also:** `<levelSync>`

---

## J-ABS (`src/plugins/abs/core/`)

JABS: J's Action Battle System — real-time combat on the map. This is the largest plugin in the
repo; tags are grouped the same way `_annotations.js` groups them (enemy setup, skill setup,
combat resolution, states, AI, etc.) rather than alphabetically.

### `<enemyId:ENEMY_ID>`

**Applies to:**
Map events (comment command)

**When:**
the event is set up as a JABS enemy

**Effect:**
associates this event with the database enemy ENEMY_ID. Required for any event that should act as
an enemy — this is one of only two tags (with move speed) that isn't optional.

```
<enemyId:12>
```
This event acts as enemy id 12 from the database.

**See also:** `<sight>`, `<pursuit>`, `<moveSpeed>`

---

### `<sight:RADIUS>`

**Applies to:**
Enemy events, Enemies (database default)

**When:**
always (passive perception check)

**Effect:**
RADIUS is the tile distance at which this enemy notices and engages the player. Ignores walls and
obstacles (x-ray vision). Event tag overrides database default.

```
<sight:4>
```
This enemy notices the player within 4 tiles, regardless of walls.

**See also:** `<pursuit>`, `<alertedSightBoost>`, `<visionMultiplier>`

---

### `<pursuit:RADIUS>`

**Applies to:**
Enemy events, Enemies (database default)

**When:**
while actively engaged in combat

**Effect:**
RADIUS is the tile distance this enemy will chase an engaged target — effectively "sight after
aggro." Typically larger than sight so enemies don't trivially disengage from one backward step.

```
<pursuit:8>
```
Once engaged, this enemy chases within 8 tiles before giving up.

**See also:** `<sight>`, `<alertedPursuitBoost>`, `<aiRole:sentinel>` (uses pursuit as home range)

---

### `<prepare:FRAMES>`

**Applies to:**
Enemy events, Enemies (database default)

**When:**
before the enemy's first action

**Effect:**
overrides the "Attack Speed" trait's implied wait timer with an explicit frame count before this
enemy takes its first action.

```
<prepare:60>
```
This enemy waits 60 frames (~1 second) before acting for the first time.

---

### `<alertDuration:DURATION>` / `<alertedSightBoost:RADIUS_BOOST>` / `<alertedPursuitBoost:RADIUS_BOOST>`

**Applies to:**
Enemy events, Enemies (database default)

**When:**
the enemy is struck from outside its sight/pursuit range

**Effect:**
triggers an "alerted" state for DURATION frames, during which sight and pursuit are boosted by the
given amounts so the enemy can navigate toward the attacker's believed location. Without this,
enemies can be cheaply picked off from outside their normal range.

```
<alertDuration:180>
<alertedSightBoost:6>
<alertedPursuitBoost:6>
```
Being struck from outside normal range alerts this enemy for 3 seconds, temporarily adding 6 tiles
to both sight and pursuit.

---

### `<visionMultiplier:VAL>`

**Applies to:**
Actors, Classes, Enemies, Weapons, Armors, States

**When:**
always (sums across all active note sources)

**Effect:**
scales this battler's sight and pursuit radii by a percent offset from 100. VAL 50 = +50%, VAL -50
= half. Clamped so the result never drops below zero.

```
<visionMultiplier:50>
```
An enemy with base sight 4 wearing/afflicted-by this sees as if sight were 6.

---

### `<moveSpeed:SPEED>`

**Applies to:**
Enemy events, Enemies (database default)

**When:**
always

**Effect:**
overrides the native RMMZ event page move speed with a decimal value (e.g. 3.7), letting you tune
speed between the integer steps the editor allows. This is the second tag (with enemyId) that
isn't optional for enemy events.

```
<moveSpeed:3.7>
```
This enemy moves at speed 3.7, between the "3" and "4" native options.

---

### `<aiTrait:TRAIT>`

**Applies to:**
Enemy events, Enemies (database default)

**When:**
always (shapes skill selection every decision)

**Effect:**
tunes how this enemy chooses and uses skills. TRAIT is one of: `careful` (avoids elementally
ineffective skills, generally smarter), `executor` (maximizes damage, targets weak spots),
`reckless` (never basic-attacks, spams learned skills), `healer` (prioritizes healing nearby
allies), `cleanser` (removes negative states from allies), `buffer` (applies positive states to
allies before attacking), `tactical` (repositions to optimal range before using a skill), or
`berserker` (goes all-out below an HP threshold, ignoring range/cooldown/efficiency). Multiple
traits can stack on one enemy; careful/reckless amplify the judgment of other traits when
combined. `follower`/`leader` are also accepted as backward-compatible aliases for the AI ROLE
tags below.

```
<aiTrait:careful>
<aiTrait:healer>
```
A careful healer: avoids bad elemental matchups and picks the best-fit heal for the situation
rather than just the strongest one.

**See also:** `<aiRole:...>`

---

### `<aiRole:leader|follower|guardian|ward|solo|sentinel>`

**Applies to:**
Enemy events, Enemies (database default)

**When:**
always (governs coordination with teammates, not skill choice)

**Effect:**
defines how a battler coordinates with its team, distinct from AI traits (which govern skill
choice). A battler should only hold one role.
- `leader` — makes skill decisions on behalf of nearby followers using its own AI traits.
- `follower` — restricted to basic attack only until a leader is nearby, at which point the
  leader decides its skills for it.
- `guardian` — passive until a ward-role ally is struck, then engages the attacker. Engagement
  range defaults to the largest nearby ward's pursuit radius, or override with `<guardRange:N>`.
- `ward` — a passive trigger; no behavior of its own, just makes guardians react when it's hit.
- `solo` — ignores all coordination logic entirely.
- `sentinel` — engages within sight, but disengages and returns to its spawn point once the
  target leaves pursuit range of "home."

```
<aiRole: guardian>
<guardRange:6>
```
This guardian ignores fights until a ward is struck, then engages from up to 6 tiles away.

**See also:** `<aiTrait>`

---

### `<teamId:TEAM>`

**Applies to:**
Enemy events, Enemies (database default)

**When:**
always

**Effect:**
assigns this battler to team TEAM, whose friendly/opposing relationships are defined in the
required `data/config.jabs.json` file (not the plugin params). Default assignment without this
tag: actors/party = team 0, enemies = team 1, inanimate battlers = team 2.

```
<teamId:2>
```
This battler is assigned to team 2 (inanimate by default convention).

---

### `<jabsConfig:noIdle|canIdle|noHpBar|showHpBar|hideStates|showStates|noName|showName|invincible|notInvincible|inanimate|notInanimate>`

**Applies to:**
Enemy events, Enemies (database default)

**When:**
always

**Effect:**
a family of boolean config-override tags for cosmetic/behavioral defaults: idle wandering
(default: 2-tile radius idle), HP bar visibility, active-state icon strip visibility, name label
visibility, invincibility (skills never connect), and `inanimate` (disables AI, movement,
knockback, and HP bar all at once — for pots, crates, environmental objects that shouldn't
think or move).

```
<jabsConfig:inanimate>
```
This event behaves as a non-thinking, non-moving prop rather than a combatant.

---

### `<actionId:EVENT_ID>`

**Applies to:**
Skills, Items

**When:**
the skill is executed on the map

**Effect:**
associates the skill with EVENT_ID on the configured "action map" — the visual/collision
representation of the skill on the field.

```
<actionId:14>
```
Executing this skill spawns event 14 from the action map.

---

### `<duration:FRAMES>` / `<linger:FRAMES>`

**Applies to:**
Skills, Items

**When:**
while the skill's action event is alive on the map

**Effect:**
`duration` is how many frames the action event persists before expiring (minimum 8 frames,
regardless of the tag value). `linger` is how many frames the event spends fading out after
expiry instead of vanishing instantly (collision disabled during linger); default linger is 10
frames if omitted, 0 for instant disappearance.

```
<duration:30>
<linger:15>
```
This action's hitbox is live for 30 frames, then fades out over 15 more.

---

### `<cooldown:VAL>` / `<uniqueCooldown>`

**Applies to:**
Skills, Items

**When:**
after the skill is used

**Effect:**
`cooldown` is the frame count before the skill can be used again. By default, every equipped slot
carrying the same skill id shares that cooldown; `<uniqueCooldown>` makes each slot track its own
cooldown independently even if the skill id matches another slot.

```
<cooldown:120>
<uniqueCooldown>
```
This skill has a 2-second cooldown tracked per-slot, not shared across slots.

---

### `<noGlobalCooldown>` / `<ogcd>` / `<gcd:FRAMES>`

**Applies to:**
Skills, Items

**When:**
the skill triggers or is exempt from the optional battler-wide Global Cooldown (GCD)

**Effect:**
GCD is an optional lockout after using any skill whose skill type is in the plugin's whitelist
(dodge/tool always exempt). `<noGlobalCooldown>`/`<ogcd>` (same meaning) mark a skill as exempt
from stamping or being blocked by GCD. `<gcd:FRAMES>` overrides the default GCD length for this
specific skill when it does trigger GCD.

```
<gcd:90>
```
Using this skill locks out other GCD-participating skills for 90 frames instead of the default.

**See also:** `<cdr>`

---

### `<cdr:[FORMULA]>`

**Applies to:**
Actors, Classes, Enemies, Weapons, Armors, States

**When:**
always (battler-wide, summed across all active note sources)

**Formula context:**
`a` = the battler being evaluated, `b` = 0, `v` = `$gameVariables._data`.

**Effect:**
sums to a single percent-point Cooldown Reduction stat that shrinks Global Cooldown length:
`Math.max(0, gcdFrames * (1 - cdr / 100))`. 100+ combined percent-points reduces GCD to 0 frames.

```
<cdr:[a.luk * 0.1]>
```
Grants CDR scaled off the battler's own LUK.

**See also:** `<gcd>`, `<per>`

---

### `<radius:VAL>`

**Applies to:**
Skills, Items

**When:**
always

**Effect:**
sets the tile-measured size of the skill's hitbox. Must be positive. Interpreted differently
depending on the `<hitbox:...>` shape (side length for square, line length for line, etc.).

```
<radius:2>
```
A radius-2 hitbox — exact meaning depends on the hitbox shape in use.

**See also:** `<hitbox>`

---

### `<proximity:VAL>`

**Applies to:**
Skills, Items

**When:**
AI decision-making, and target resolution for `<direct>` skills

**Effect:**
the maximum tile distance a battler-to-target gap can be for this skill to be attempted (AI gate),
and — for `<direct>` skills — the search radius used to lock onto a target. Mandatory on every
`<direct>` skill. `<proximity:0>` matches nothing, it is not "uncapped."

```
<proximity:3>
<direct>
```
This direct skill only locks onto targets within 3 tiles.

**See also:** `<direct>`

---

### `<direct>` / `<directLock>`

**Applies to:**
Skills, Items

**When:**
execution — replaces the flying-projectile spawn behavior

**Effect:**
locks onto the nearest valid target within `<proximity:N>` and spawns the hitbox at the target's
tile instead of firing a projectile. `<direct>` snapshots the target's position at decision time
(gives a dodge window if the target moves during cast); `<directLock>` instead resolves position
at the moment of firing, removing that window. The two are mutually exclusive — `<directLock>`
wins if both are present. Target priority: `<directStateTarget>` match > explicit/last-hit target
> closest opponent > inanimate fallback. Direct skills can still be parried.

```
<proximity:4>
<directLock>
```
This skill always lands exactly where the target currently stands, with no dodge window.

**See also:** `<proximity>`, `<directStateTarget>`

---

### `<directStateTarget:STATE_ID>`

**Applies to:**
Skills, Items (requires `<direct>` and `<proximity:N>` on the same skill)

**When:**
target resolution for a `<direct>` skill

**Effect:**
prioritizes any in-proximity opponent afflicted with STATE_ID above all other targeting
candidates — the mechanism for "mark and follow-up" combo chains. Falls through to normal
priority once the state expires, is cleansed, or the target leaves proximity.

```
<direct>
<proximity:5>
<directStateTarget:12>
```
This skill snaps to whoever is marked with state 12, as long as they're within 5 tiles.

**See also:** `<direct>`

---

### `<projectile:VAL>` / `<formation:line|spray|cross|xburst|nova>`

**Applies to:**
Skills, Items

**When:**
execution (non-direct skills)

**Effect:**
`projectile` sets how many projectiles fire in parallel toward the caster's facing. `formation`
sets the direction pattern: line (straight), spray (W-shaped), cross (4 cardinal), xburst (4
diagonal), nova (all 8). No hard cap on projectile count, but keep it reasonable for performance.

```
<projectile:8>
<formation:nova>
```
Fires 8 projectiles outward in all 8 directions simultaneously.

---

### `<projectileDuration:PERCENT_POINTS>`

**Applies to:**
Actors, Classes, Enemies, Weapons, Armors, States

**When:**
always (battler-wide, summed across all active note sources)

**Effect:**
a percent-point offset from the 100 baseline applied against how long ALL of this battler's map
actions persist, i.e. every `<duration:FRAMES>` skill this battler fires. Clamped to never drop
the resulting multiplier below 0.

```
<projectileDuration:50>
```
This battler's map actions last 150% as long as their base `<duration>` value.

---

### `<hitbox:circle|rhombus|arc|square|line|wall|cross>`

**Applies to:**
Skills, Items

**When:**
always

**Effect:**
the collision shape used by the skill's action event, always centered on the action event with
some exceptions. `circle`/`rhombus` grow with radius; `arc` is a forward wedge whose width is set
by `<degrees:VAL>` (default 90°); `square` uses radius as side length; `line` uses radius as
length (1 tile wide); `wall` is an inverted line (1 tile tall, radius as width); `cross` combines
both axes. All projectiles from one skill share the same hitbox shape.

```
<hitbox:arc>
<degrees:120>
<radius:3>
```
A 120-degree forward wedge reaching 3 tiles.

**See also:** `<radius>`, `<degrees>`
