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

---

### `<degrees:VAL>` / `<thickness:VAL>` / `<innerRadius:VAL>`

**Applies to:**
Skills, Items

**When:**
always (shape-modifier tags)

**Effect:**
`degrees` (1-359) sets the angular width of an `arc` hitbox only (ignored elsewhere) — 180+
becomes a full forward hemisphere. `thickness` adds perpendicular width to `line` (sideways) or
`wall` (up/down) hitboxes only. `innerRadius` carves a universal dead zone out of the middle of
any hitbox shape (a donut), measured from the target's center point; keep `radius - innerRadius`
at least 0.5 tiles since targeting precision bottoms out around there.

```
<hitbox:circle>
<radius:4>
<innerRadius:2>
```
A ring-shaped hitbox: hits between 2 and 4 tiles from the origin, nothing closer.

**See also:** `<hitbox>`, `<radius>`

---

### `<castTime:VAL>` / `<castAnimation:VAL>` / `<selfAnimationId:VAL>` / `<onCastAnimationId:VAL>`

**Applies to:**
Skills, Items

**When:**
before/during/at the moment of execution

**Effect:**
`castTime` is frames the battler must wait before the skill fires; `castAnimation` loops on the
caster during that wait. `selfAnimationId` plays on the caster once the skill's hit lands.
`onCastAnimationId` plays exactly once at the moment casting completes and the skill fires
(distinct from the looping cast animation) — good for a "release" flourish after a "charge-up".

```
<castTime:60>
<castAnimation:40>
<onCastAnimationId:41>
```
A 1-second cast that loops animation 40, then plays animation 41 once as the skill fires.

---

### `<channel:[SKILL_ID, TOTAL_DURATION]>` / `<channelTickSpeed:VAL>` / `<onChannelComplete:[SKILL_ID, ...]>`

**Applies to:**
Skills, Items

**When:**
execution — turns this skill into a "vessel" instead of running its own effects

**Effect:**
pays this skill's own cost once, then repeatedly executes SKILL_ID every `channelTickSpeed`
frames (default from plugin param) for TOTAL_DURATION frames total. The first tick fires after
the first interval elapses, not immediately. `onChannelComplete` fires one or more skills for
free, once, only if the channel runs its full duration uninterrupted.

```
<channel:[25, 180]>
<channelTickSpeed:30>
<onChannelComplete:[36]>
```
Fires skill 25 every 30 frames for 180 frames (6 executions total), then fires skill 36 for free
if nothing interrupted the channel.

---

### `<cannotMoveToInterrupt>` / `<interrupt:MAGNIFIER>` / `<thisCannotBeInterrupted>` / `<cannotBeInterrupted>`

**Applies to:**
`cannotMoveToInterrupt` and `thisCannotBeInterrupted`: Skills, Items (the casting/channeling
skill itself). `interrupt`: Skills, Items (an attacking skill). `cannotBeInterrupted`: Actors,
Classes, Enemies, Weapons, Armors, States (battler-wide).

**When:**
during another battler's cast/channel window

**Effect:**
casting/channeling is normally interruptible by self-movement or by getting hit with an
`<interrupt:MAGNIFIER>` skill — either way the in-flight skill never fires and a cooldown penalty
stamps onto its slot (full effective cooldown for self-interrupt, or that cooldown ×
MAGNIFIER/100 for an external interrupt). `cannotMoveToInterrupt` roots the caster in place so
movement can never self-interrupt. `interrupt:MAGNIFIER` is what an attacker needs to interrupt
someone else's cast on hit. `thisCannotBeInterrupted` makes one specific cast immune to external
interrupts. `cannotBeInterrupted` is a battler-wide immunity read from any of the battler's own
note sources, covering whatever it's casting.

```
<interrupt:200>
```
Landing this hit against a casting target doubles the cooldown penalty stamped on their
interrupted skill.

---

### `<pierce:[TIMES, DELAY]>`

**Applies to:**
Skills, Items

**When:**
execution — governs collision resolution

**Effect:**
TIMES is the total connection budget (including the first hit); DELAY is frames to wait between
connections. A skill can register at most one new connection per frame, so `DELAY:0` connects
every frame its hitbox overlaps valid targets. JABS ignores the database "repeats" field entirely
for both pierce and per-connection bonus hits.

```
<pierce:[3, 10]>
```
This skill can connect up to 3 times, with at least 10 frames between each connection.

**See also:** `<bonus-hits>`

---

### `<bonus-hits:VAL>` / `<bonus-hits:[FORMULA]>`

**Applies to:**
Skills, Items

**Formula context:**
`a` = the caster at the moment the action is created, `b` = 0, `v` = `$gameVariables._data`.

**When:**
each pierce-step connection

**Effect:**
adds extra battle-effect applications per target on a connection, stacking with the battler-side
`bonus-hits-*` family below. Accepts either a flat non-negative integer or a bracketed formula.
The combined total across every bonus-hits source is floored once at the very end — formulas
don't need their own `floor()`. If a parry triggers on the first application in a bundle, the
rest of that bundle is skipped for that target; guard runs (and mitigates) every application.

```
<bonus-hits:[a.luk / 10]>
```
Grants extra hit applications per connection scaled off the caster's own LUK.

**See also:** `<pierce>`

---

### `<knockback:VAL>`

**Applies to:**
Skills, Items

**When:**
on hit

**Effect:**
knocks the target back VAL tiles. See `<ignoreTerrain>` for how forced displacement handles
obstacles along the push path, and `<knockbackResist>`/`<proximityKnockback>` for defensive
counters.

**See also:** `<ignoreTerrain>`, `<knockbackResist>`, `<proximityKnockback>`

---

### `<delay:[DURATION, TOUCHABLE]>`

**Applies to:**
Skills, Items

**When:**
execution — the action sits on the map before triggering

**Effect:**
DURATION is frames the action waits on the map before detonating (-1 = never auto-detonates —
must be paired with TOUCHABLE:true or it sits forever). TOUCHABLE (true/false) controls whether
walking into it triggers it early.

```
<delay:[300, true]>
```
Sits on the map for ~5 seconds; anyone who walks into it triggers it early.

---

### `<combo:[COMBO_SKILL_ID, LINK_TIME?, EXPIRE_FRAMES?]>` / `<comboStarter>` / `<freeCombo>` / `<aiSkillExclusion>`

**Applies to:**
Skills, Items

**When:**
after this skill executes (combo), or at AI skill-selection time (starter/exclusion)

**Effect:**
`combo` makes COMBO_SKILL_ID pressable LINK_TIME frames after this skill fires (default 0), with
the window auto-clearing after EXPIRE_FRAMES from the opener's fire time (default 0 = no expiry,
stays open until the slot's base cooldown resets). By default a combo only opens on a landed hit;
`freeCombo` opens it immediately regardless of hit. AI ignores combo-tagged skills unless
`comboStarter` is present; `aiSkillExclusion` removes a skill from AI's random pool entirely
(good for combo-enders that should only be reachable via the chain). The opener's own cooldown
must exceed LINK_TIME or the combo is unreachable.

```
<combo:[5, 8, 60]>
<comboStarter>
```
An AI-usable opener that makes skill 5 pressable after 8 frames, auto-clearing after 60 total.

---

### `<guard:[FLAT, PERCENT]>` / `<parry:VAL>`

**Applies to:**
Skills, Items with the configured "Guard Skill Type"

**When:**
while guarding is held (guard) / in the window right after guard is raised (parry)

**Effect:**
`guard` reduces incoming damage by FLAT (applied first) then PERCENT (both usually negative).
`parry` opens a VAL-frame "just guard" window that fully mitigates one incoming hit — window opens
when guarding starts and counts down; a successful parry stops guarding entirely (re-press to
parry again). Explicit parry (this tag) is distinct from JABS's implicit/passive parry
(attacker-pressure-vs-defender-pressure math that runs when not guarding/casting/dashing).

```
<guard:[-10, -25]>
<parry:12>
```
Guarding cuts 10 flat damage then 25% off the remainder; the first 12 frames of guard are a full
parry window.

**See also:** `<unparryable>`, `<per>`, `<ignoreParry>`

---

### `<counterGuard:[SKILL, CHANCE]>` / `<counterParry:[SKILL, CHANCE]>` / `<unparryable>`

**Applies to:**
Skills, Items (counterGuard/counterParry); Skills, Items (unparryable, on the attacking skill)

**When:**
a hit is guarded or parried

**Effect:**
fires SKILL back at CHANCE percent per guarded/parried hit. If both are available on the same
hit, counter-parry takes precedence over counter-guard. `unparryable` makes a skill impossible to
parry under any circumstance, regardless of the defender's parry window.

```
<counterParry:[7, 100]>
```
Every successfully parried hit fires skill 7 back at the attacker.

**See also:** `<parry>`, `<guard>`

---

### `<per:[FORMULA]>`

**Applies to:**
Actors, Classes, Enemies, Weapons, Armors, States

**When:**
always (battler-wide, summed across all active note sources)

**Formula context:**
`a` = the battler being evaluated, `b` = 0, `v` = `$gameVariables._data`.

**Effect:**
sums to a single percent-point Parry Extension Rate stat that widens the `<parry:VAL>` window:
`Math.floor((1 + per / 100) * parryDuration)`.

```
<per:[a.agi * 0.2]>
```
Extends this battler's parry window scaled off their own AGI.

**See also:** `<parry>`, `<cdr>`

---

### `<retaliate:[SKILL_ID, CHANCE, TYPE?]>`

**Applies to:**
States, Skills, Items, Actors, Classes, Enemies, Weapons, Armors

**When:**
this battler is struck

**Effect:**
fires SKILL_ID immediately at CHANCE percent chance. Optional TYPE (`physical`/`magical`/
`certain`) filters which incoming hit types trigger it; omitted = any type. The payload skill's
damage formula gets three extra variables: `d`/`m`/`t` — the HP/MP/TP damage dealt by the
triggering hit (all default 0 outside a retaliation context, so referencing them is always safe).

```
<retaliate:[30, 100, physical]>
```
Payload skill formula `d * 0.3`, tagged `<unparryable>` — classic thorns: reflects 30% of
incoming physical HP damage back at the attacker.

---

### `<onOwnDefeat:[SKILL_ID, CHANCE]>` / `<onTargetDefeat:[SKILL_ID, CHANCE]>` / `<onDefeatedTarget>`

**Applies to:**
Actors, Classes, Enemies, Weapons, Armors, States (onOwnDefeat/onTargetDefeat); Skills, Items
(onDefeatedTarget)

**When:**
this battler is defeated (onOwnDefeat) / this battler defeats a target (onTargetDefeat)

**Effect:**
fires SKILL_ID at CHANCE percent. `onOwnDefeat` is a parting shot on self-death (explode-on-death
enemies). `onTargetDefeat` is an execute/kill-flourish skill. `onDefeatedTarget`, placed on the
onTargetDefeat payload skill, spawns its action event at the defeated target's last position
instead of at the caster.

```
<onOwnDefeat:[66, 100]>
```
This enemy always detonates a parting skill when defeated.

---

### `<onEvadeApply:[STATE_ID, CHANCE]>` / `<onEvadeApplySelf:[STATE_ID, CHANCE]>` / `<onEvadeExecute:[SKILL_ID, CHANCE]>`

**Applies to:**
Actors, Classes, Enemies, Weapons, Armors, States

**When:**
this battler evades an incoming attack

**Effect:**
`onEvadeApply` inflicts STATE_ID on the attacker who missed (retributive). `onEvadeApplySelf`
inflicts STATE_ID on the evader itself (rewards dodging). `onEvadeExecute` fires SKILL_ID with
the attacker seeded as the target (an AoE/self-scope skill ignores the seed).

```
<onEvadeApplySelf:[9, 100]>
```
Successfully evading always grants this battler a self-buff state.

---

### `<luckyRolls:[FORMULA]>` / `<thisLuckyRolls:[FORMULA]>` / `<cursedRolls:[FORMULA]>` / `<thisCursedRolls:[FORMULA]>`

**Applies to:**
`luckyRolls`/`cursedRolls`: Actors, Classes, Enemies, Weapons, Armors, States. `thisLuckyRolls`/
`thisCursedRolls`: Skills, Items.

**When:**
any on-chance roll involving this battler (hit, crit, state application, procs)

**Formula context:**
`a` = the battler being evaluated, `b` = 0, `v` = `$gameVariables._data`.

**Effect:**
most JABS on-chance rolls are a "best of N" contest per side. These tags add extra rolls: lucky
rolls help this battler succeed when it's the one rolling for success (landing hits, applying
states, crits, procs); cursed rolls help this battler fail when it's on the defending end
(incoming hits/states). The `this*` variants are skill-scoped, stacking on top of the
battler-wide total.

```
<luckyRolls:[Math.floor(a.luk / 20)]>
```
Grants one bonus positive roll per 20 points of this battler's own LUK.

**See also:** `<veryLucky>`, `<encoreRepeats>`, `<accumulate>`

---

### `<veryLucky>` / `<veryCursed>`

**Applies to:**
Actors, Classes, Enemies, Weapons, Armors, States

**When:**
any on-chance roll where this battler is the roller

**Effect:**
boolean bypass flags rather than reroll counts — short-circuit the entire roll contest instead
of adding dice. `veryLucky` always succeeds; `veryCursed` always fails. Checked before reroll math
runs; if both are present on the same battler, lucky wins the tie (avoid stacking both).

```
<veryLucky>
```
This battler's on-chance rolls (as the roller) always succeed, no dice involved.

**See also:** `<luckyRolls>`

---

### `<encoreRepeats:[FORMULA]>` / `<accumulate>`

**Applies to:**
Actors, Classes, Enemies, Weapons, Armors, States

**When:**
a successful on-chance proc (bonus hits, retaliate, on-evade, on-defeat, etc.) fires

**Formula context:**
`a` = the battler being evaluated, `b` = 0, `v` = `$gameVariables._data`.

**Effect:**
`encoreRepeats` is a battler-wide bonus to how many times a successful proc executes: normally 1,
becomes `1 + encoreRepeats`. `accumulate` changes how the underlying roll contest is scored — by
default it stops at the first success, but with this tag every positive roll in the contest is
counted, and that count feeds proc executions on top of (not instead of) encoreRepeats.

```
<encoreRepeats:[1]>
<accumulate>
```
Every successful proc fires at least twice, and gets extra executions per lucky roll beyond the
first success.

**See also:** `<luckyRolls>`

---

### `<skillHistoryBonus:[TYPE_ID, WINDOW, PCT, COUNT_MODE]>` / `<thisSkillHistoryBonus:[WINDOW, PCT, COUNT_MODE]>`

**Applies to:**
`skillHistoryBonus`: Actors, Classes, Enemies, Weapons, Armors, States. `thisSkillHistoryBonus`:
Skills, Items.

**When:**
every attack by the bearer (skillHistoryBonus) / only when this exact skill executes
(thisSkillHistoryBonus)

**Effect:**
scales damage by `1 + (PCT * COUNT / 100)`, where COUNT is read from a lookback WINDOW (seconds)
of this battler's recent skill execution history per COUNT_MODE: `all` (total matching
executions), `unique` (distinct skill ids), `streak` (consecutive matches from most recent,
stopping at the first non-match), or `distinct_types` (distinct skill type ids — pair with
TYPE_ID 0 for "any type"). `skillHistoryBonus` filters by TYPE_ID (0 = no filter);
`thisSkillHistoryBonus` is implicitly scoped to this skill's own id only.

```
<skillHistoryBonus:[7, 5, 5, streak]>
```
+5% damage per consecutive weapon-type-7 skill execution within the last 5 seconds.

---

### `<castTimeDamageBonus:N>` / `<thisCastTimeDamageBonus:N>`

**Applies to:**
`castTimeDamageBonus`: Actors, Classes, Enemies, Weapons, Armors, States. `thisCastTimeDamageBonus`:
Skills, Items.

**When:**
a skill with a resolved cast time > 0 lands direct HP/MP damage

**Effect:**
`bonusPct = sum(all N-per-second tags) × (resolvedCastFrames / 60)`, then
`finalDamage = round(baseDamage × (1 + bonusPct / 100))`. No cap. Does NOT apply to healing,
recovery, slip DoT ticks, or state-only skills. Faster cast speed (e.g. via J-ABS-Timing) reduces
the resolved cast duration and therefore reduces the bonus. The two tags stack additively.

```
<castTime:180>
<thisCastTimeDamageBonus:20>
```
A 3-second cast on this skill alone grants +60% damage from this tag (before any passive
castTimeDamageBonus also stacks on top).

---

### `<rangeBuff:N>` / `<rangeRate:N>`

**Applies to:**
Actors, Classes, Enemies, Weapons, Armors, States (also accepted on a skill directly, but then
affects ALL of the bearer's outgoing actions, not just that skill)

**When:**
always — scales radius, proximity, AND thickness simultaneously for every action the bearer fires

**Effect:**
`rangeBuff` adds N tiles (flat, can be negative) before the rate multiplier. `rangeRate` is the
rate itself, not a delta — each tag contributes `(N - 1.0)` to an additive rate accumulator so
multiple rate tags stack additively rather than compounding: `finalValue = max(0, (base +
buffs) * (1.0 + sum(rate - 1.0)))`. Skipped entirely on any dimension the skill has no tag for
(a skill with no `<proximity>` is unaffected on that axis).

```
<rangeBuff:2>
<rangeRate:1.5>
```
+2 tiles flat, then 1.5x, applied to radius, proximity, and thickness on every outgoing action.

**See also:** `<radiusBuff>`, `<proximityBuff>`, `<thicknessBuff>`

---

### `<radiusBuff:N>` / `<radiusRate:N>` / `<proximityBuff:N>` / `<proximityRate:N>` / `<thicknessBuff:N>` / `<thicknessRate:N>`

**Applies to:**
Actors, Classes, Enemies, Weapons, Armors, States

**When:**
always — same stacking math as `<rangeBuff>`/`<rangeRate>` but scoped to a single dimension

**Effect:**
axis-specific counterparts to `<rangeBuff>`/`<rangeRate>`: radius affects AoE splash only,
proximity affects direct-skill targeting reach only, thickness affects LINE/WALL width only. Each
stacks additively on top of any shared `<rangeBuff>`/`<rangeRate>` tags rather than replacing
them.

```
<radiusBuff:2>
<radiusRate:1.5>
```
+2 tiles then 1.5x, but only on AoE splash radius — targeting reach and line/wall width untouched.

**See also:** `<rangeBuff>`, `<rangeRate>`

---

### `<perDebuffBuff:N>`

**Applies to:**
Actors, Classes, Enemies, Weapons, Armors, States

**When:**
the caster's action resolves against a target

**Effect:**
adds N% bonus damage per `<negative>`-tagged state currently active on the target — total is N ×
debuff count, not a flat addition. Multiple tags sum their N first, then multiply by count.
Negative N acts as a penalty against debuffed targets instead. Applied before guard reduction
(guard still mitigates the amplified value, just less completely).

```
<perDebuffBuff:5>
```
+5% damage per negative-tagged state on the target — three debuffs active = +15%.

**See also:** `<bonusDamageIfState>`, `<negative>`

---

### `<bonusDamageIfState:[STATE_ID, PCT]>` / `<thisBonusDamageIfState:[STATE_ID, PCT]>`

**Applies to:**
`bonusDamageIfState`: Actors, Classes, Enemies, Weapons, Armors, States. `thisBonusDamageIfState`:
Skills, Items.

**When:**
the caster's action resolves against a target carrying STATE_ID

**Effect:**
adds PCT% bonus damage if the target has this specific state active. Multiple tags for the same
state id stack additively; different state ids each contribute independently. The `this*` variant
is skill-scoped instead of caster-wide, so the bonus doesn't leak across the rest of the kit.

```
<bonusDamageIfState:[13, 25]>
<bonusDamageIfState:[14, 25]>
```
+25% each if the target is paralyzed (13) and/or rooted (14) — up to +50% if both are active.

**See also:** `<perDebuffBuff>`, `<bonusDamageIfStateType>`

---

### `<thisBonusDamage:PCT>`

**Applies to:**
Skills, Items

**When:**
this specific skill is the action being resolved

**Effect:**
an unconditional flat percent damage bonus with no target-state requirement — just a per-skill
multiplier. Multiple tags on the same skill stack additively. Useful for boosting one skill's
damage without touching its formula.

```
<thisBonusDamage:20>
```
This skill always deals +20% damage, regardless of target state.

---

### `<bonusDamageIfStateType:[TYPE, PCT]>` / `<bonusDamagePerStateType:[TYPE, PCT]>`

**Applies to:**
Actors, Classes, Enemies, Weapons, Armors, States

**When:**
the caster's action resolves against a target carrying a state with a matching `<type:TYPE>`
classifier

**Effect:**
`bonusDamageIfStateType` is a presence check — PCT applies once if the target has ANY state
carrying TYPE, regardless of how many. `bonusDamagePerStateType` instead multiplies PCT by the
count of distinct matching states. Both match TYPE case-insensitively; multiple tags for
different TYPEs contribute independently.

```
<bonusDamagePerStateType:[poison, 10]>
```
+10% per distinct poison-typed state on the target — two active poison states = +20%.

**See also:** `<stateTypeResist>`, `<stateTypeImmune>`

---

### `<bonusDamageIfSelfState:[STATE_ID, PCT]>` / `<thisBonusDamageIfSelfState:[STATE_ID, PCT]>`

**Applies to:**
`bonusDamageIfSelfState`: Actors, Classes, Enemies, Weapons, Armors, States.
`thisBonusDamageIfSelfState`: Skills, Items.

**When:**
the caster's action resolves while the caster itself carries STATE_ID

**Effect:**
sibling to `<bonusDamageIfState>` but checks the caster's own active states instead of the
target's — "empowered while buffed" kits. The `this*` variant is skill-scoped, layering on top of
the caster-wide tag rather than replacing it.

```
<thisBonusDamageIfSelfState:[22, 40]>
```
This skill deals +40% damage only while the caster carries state 22 (e.g. a "Shadow Form" buff).

---

### `<bonusDamagePerStateStack:[STATE_ID, PCT]>`

**Applies to:**
Actors, Classes, Enemies, Weapons, Armors, States

**When:**
the caster's action resolves against a target currently tracked as afflicted by STATE_ID

**Effect:**
adds PCT% bonus damage per current stack of that exact state on the target — stack depth, not
distinct-state count. Contributes nothing if the target isn't currently tracked as afflicted by
STATE_ID.

```
<bonusDamagePerStateStack:[8, 8]>
```
+8% per stack of state 8 (e.g. Bleed) — 3 stacks = +24% bonus damage on this hit.

**See also:** `<bonusDamagePerStateType>`, `<stackMax>`

---

### `<bonusDamageForMyStateCount:PCT>` / `<thisBonusDamageForMyStateCount:PCT>`

**Applies to:**
`bonusDamageForMyStateCount`: Actors, Classes, Enemies, Weapons, Armors, States.
`thisBonusDamageForMyStateCount`: Skills, Items.

**When:**
the caster's action resolves against a target carrying states this exact caster applied

**Effect:**
adds PCT% bonus damage per distinct state on the target that this caster (specifically) is the
source of — always live regardless of which skill is executing. The `this*` variant reads only
from the executing skill's own note, stacking on top of the caster-wide tag.

```
<thisBonusDamageForMyStateCount:15>
```
+15% per distinct state this caster personally applied to the target — 3 such states = +45%.

---

### `<applyStateOnExpire:[STATE_ID, CHANCE]>`

**Applies to:**
States

**When:**
the state expires naturally (frame-counter reaches zero) — NOT forced removal (dispel, script
call, KO, food-chain strip)

**Effect:**
applies STATE_ID to the same battler at CHANCE percent, inheriting the same source battler as the
expiring state. This distinction (natural vs. forced) is intentional — removing a chain state
early does not cascade the chain forward. Only the first tag per state is read.

```
<applyStateOnExpire:[15, 50]>
```
A "Burning" state that naturally expiring has a 50% chance to leave behind state 15 (e.g.
"Scorched").

---

### `<purgeStates:[TYPE, ALLOW_DEATH, COUNT]>` / `<noLogs>`

**Applies to:**
`purgeStates`: Skills, Items. `noLogs`: States.

**When:**
a `<purgeStates>` skill lands a hit (parried/evaded hits do not trigger it)

**Effect:**
strips COUNT states from the target, highest priority first. TYPE filters by polarity: `negative`
(default, only `<negative>`-tagged states), `positive` (states not tagged `<negative>`), or `all`.
ALLOW_DEATH (default false) controls whether the death state (id 1) is eligible. All three
parameters are optional with sensible defaults. `<noLogs>`, placed on a state, suppresses that
specific state's removal from being written to the text log when purged.

```
<purgeStates:[all, false, 3]>
```
A cleanse burst: strips up to 3 states of any polarity (never death) from the target.

---

### `<spread:[CHANCE, RANGE]>` / `<viral>` / `<spreadTick:FRAMES>` / `<spreadPerTick:N>` / `<spreadPreferUnafflicted>` / `<spreadSkipAfflicted>`

**Applies to:**
States

**When:**
on a spread pulse cadence, independent of slip/regen ticks

**Effect:**
tracked states can spread to nearby battlers (buffs and debuffs both qualify). CHANCE is rolled
independently per candidate each pulse; RANGE is tile distance. Spread uses the original source
battler from when the state was first applied. `viral` widens candidates to all battlers in range
instead of just same-side allies. `spreadTick` sets frames between pulses (default from plugin
param, usually 30). `spreadPerTick` caps successful spreads per pulse. `spreadPreferUnafflicted`
tries unafflicted battlers first (closest-first); `spreadSkipAfflicted` never re-spreads to a
battler that already has the state.

```
<spread:[25, 3]>
<spreadTick:60>
<spreadSkipAfflicted>
```
A contagion state: 25% chance per nearby battler within 3 tiles every second, never re-infecting
someone who already has it.

---

### `<skillId:SKILL_ID>` / `<offhandSkillId:SKILL_ID>` / `<offhandEligible>`

**Applies to:**
Weapons, Armors (skillId, offhandSkillId); Skills (offhandEligible)

**When:**
equip-slot resolution / offhand assignment

**Effect:**
`skillId` designates what skill an equipped item grants to its slot. `offhandSkillId`, placed on
a mainhand weapon, overrides what the offhand slot resolves to for two-handed-but-still-active
weapons (also bypasses RMMZ's "Seal Equip: Offhand" trait, unlike a bare seal). Offhand
resolution precedence: native offhand seal (unless overridden) > player pin > mainhand's
offhandSkillId > offhand item's own skillId > nothing. `offhandEligible`, placed on a skill, opts
it into the player-assignable offhand pin list regardless of skill type — generic learned weapon
skills are NOT eligible by default.

```
<skillId:14>
<offhandSkillId:15>
```
This weapon grants skill 14 to mainhand, and overrides the offhand to skill 15 (e.g. a spear that
keeps a thrust action even while two-handed).

**See also:** `<skillTransform>`

---

### `<knockbackResist:VAL>` / `<proximityKnockback:[RADIUS, PCT]>`

**Applies to:**
Weapons, Armors (knockbackResist); Actors, Classes, Enemies, Weapons, Armors, States
(proximityKnockback)

**When:**
receiving knockback (resist) / dealing knockback (proximityKnockback)

**Effect:**
`knockbackResist` cancels VAL tiles of any incoming knockback. `proximityKnockback` amplifies
this battler's outgoing knockback by PCT percent per opposing battler found within RADIUS tiles,
evaluated fresh against the live battlefield each hit. Allies within RADIUS don't count; multiple
tags (different sources/radii) sum independently.

```
<proximityKnockback:[4, 25]>
```
+25% outgoing knockback per opposing battler within 4 tiles of this caster.

**See also:** `<knockback>`, `<ignoreTerrain>`

---

### `<bonus-hits-global:VAL>` / `<bonus-hits-basic:VAL>` / `<bonus-hits-skill:VAL>` (+ formula variants)

**Applies to:**
Actors, Classes, Enemies, Weapons, Armors, States

**Formula context (bracketed variant):**
`a` = the battler carrying the tag, `b` = 0, `v` = `$gameVariables._data`.

**When:**
every pierce-step connection, stacking with `<bonus-hits:VAL>` on the executing skill

**Effect:**
battler-wide counterparts to the skill-note `<bonus-hits>` tag: `global` applies to every JABS
action; `basic` applies only to basic attacks (mainhand/offhand for actors, the enemy's
designated basic attack); `skill` applies only to non-basic skills. All three accept a flat
integer or a bracketed formula, same floor-once-at-the-end behavior as the skill-note variant.

```
<bonus-hits-basic:[a.luk / 10]>
```
Basic attacks only get extra hit applications per connection scaled off this battler's own LUK.

**See also:** `<bonus-hits>`, `<pierce>`

---

### `<hideFromJabsMenu>`

**Applies to:**
Skills, Items

**When:**
the JABS quick menu's dodge/combat/tool assignment lists are built

**Effect:**
excludes this skill/item from the slot-assignment menu it would otherwise appear in. Still
appears normally in the main menu; only the JABS quick-menu assignment list is affected.

```
<hideFromJabsMenu>
```
This skill can't be assigned via the quick menu, but is unaffected everywhere else.

---

### `<jabsTool>`

**Applies to:**
Items

**When:**
the JABS quick menu's tool vs. usable-item lists are built

**Effect:**
marks an item as belonging in the tool slot (hookshots, bombs) rather than the usable-item slot.
Without this tag an item is a consumable by default. The tag alone isn't sufficient — Item Type
must also be "Regular Item" and Occasion must be "Always" for the item to populate either menu at
all; `<jabsTool>` only decides which of the two qualifying menus it lands in.

```
<jabsTool>
```
This item shows up in the tool-slot assignment list instead of the usable-item list.

---

### `<moveType:forward|backward|directional>` / `<dodge:DISTANCE>` / `<dodgeSpeed:MODIFIER>`

**Applies to:**
Skills (the dodge-slot skill type, defined in plugin params)

**When:**
the dodge skill executes

**Effect:**
`moveType` sets dodge direction: `forward` (facing), `backward` (opposite facing), or
`directional` (whatever direction is currently pressed). `dodge` is the forced-move distance in
tiles. `dodgeSpeed` adds to (or, if negative, subtracts from) the player's current move speed
during the dodge (decimal allowed). The dodge skill still runs through the full JABS action
pipeline — it can deal damage, apply states, fire projectiles, etc., not just move.

```
<moveType:directional>
<dodge:2>
<dodgeSpeed:1.5>
```
A directional dash 2 tiles in whatever direction is held, at +1.5 move speed.

**See also:** `<invincibleDodge>`, `<iframes>`

---

### `<invincibleDodge>` / `<iframes:[START_FRAME, END_FRAME]>`

**Applies to:**
Skills (the dodge-slot skill type)

**When:**
during the dodge's execution window

**Effect:**
`invincibleDodge` makes the player fully invincible for the entire dodge duration.
`iframes` instead grants partial invincibility only between START_FRAME and END_FRAME of the
dodge (a window that extends past the dodge's own duration is simply clipped to the overlap).

```
<iframes:[4, 12]>
```
The player is invincible only from frame 4 through frame 12 of this dodge — not the whole thing.

---

### `<autoAssignSkills>` / `<autoUpgradeSkills>` / `<noAutoAssignType:[TYPE_IDS...]>` / `<noAutoAssign>` / `<upgradeOverSkill:NUM>` / `<onlyUpgrade>` / `<noUpgrade>`

**Applies to:**
`autoAssignSkills`/`autoUpgradeSkills`: Actors, Classes. The rest: Skills.

**When:**
a skill is learned

**Effect:**
governs whether newly learned skills auto-populate the four combat slots (never
mainhand/offhand/dodge/tool). `autoAssignSkills` opts an actor/class into the feature entirely;
without it nothing below applies. Full gate for a given skill: actor/class has
`autoAssignSkills`, the actor doesn't already have the skill equipped, there's an empty combat
slot, the skill isn't `<noAutoAssign>`'d, isn't `<onlyUpgrade>`-restricted, and its skill type
isn't in a `<noAutoAssignType:[...]>` blacklist. `autoUpgradeSkills` (actor/class) additionally
allows auto-learned skills to replace already-equipped ones. `<upgradeOverSkill:NUM>` makes this
newly learned skill replace skill NUM in its slot if equipped (auto-assigns normally if NUM
isn't equipped, unless blocked). `<onlyUpgrade>` prevents a skill from being freely auto-assigned
— it can only arrive via someone else's `upgradeOverSkill`. `<noUpgrade>` prevents a skill from
ever being replaced by another skill's upgrade tag.

```
<upgradeOverSkill:12>
<onlyUpgrade>
```
Learning this skill silently replaces skill 12 in its slot if equipped; otherwise this skill
never auto-assigns on its own.

---

### `<aggro:VAL>` / `<aggroMultiplier:VAL>`

**Applies to:**
Skills, Items

**When:**
the skill lands

**Effect:**
`aggro` adds VAL flat aggro (or removes it if negative) as one step in JABS's aggro calculation
chain (base → HP/MP/TP damage → HP drain → parry → bonus aggro → bonus rate → attacker-state
multipliers → target-state multipliers → attacker TGR → player-unique multiplier).
`aggroMultiplier` (default 1.0) multiplies the whole chain's result for this skill.

```
<aggro:50>
<aggroMultiplier:2.0>
```
This skill adds 50 flat aggro, then doubles the entire calculated total.

---

### `<aggroLock>` / `<aggroOutAmp:VAL>` / `<aggroInAmp:VAL>`

**Applies to:**
States

**When:**
the state is active on a battler

**Effect:**
`aggroLock` freezes this battler's own aggro value while active — they can still affect others'
aggro, but theirs can't change. `aggroOutAmp` multiplies all aggro this battler generates while
the state is active; `aggroInAmp` multiplies all aggro this battler receives while active.

```
<aggroOutAmp:2.0>
```
While this state is active, everything this battler does generates double aggro.

---

### `<useOnPickup>` / `<expires:DURATION>`

**Applies to:**
Items (droppable loot)

**When:**
the item is dropped on the map / picked up

**Effect:**
`useOnPickup` immediately performs the item's effect on the picker-upper the instant it's
collected (the Zelda "heart drop" pattern) rather than adding it to inventory. `expires`
overrides the default loot duration in frames before it despawns. All loot is erased on map
transfer regardless of this tag (intentional).

```
<useOnPickup>
<expires:1800>
```
A heart-drop-style item that's used the instant it's picked up, and despawns after 30 seconds if
left uncollected.

---

### `<negative>` / `<rooted>` / `<disabled>` / `<muted>` / `<paralyzed>`

**Applies to:**
States

**When:**
the state is active on a battler

**Effect:**
`negative` doesn't change mechanics — it's an AI hint that healer/support allies should try to
remove this state. `rooted` locks movement (including dodge skills for actors). `disabled` locks
basic attacks (mainhand/offhand for actors, the basic-attack trait skill for enemies). `muted`
locks combat skills (the four combat slots for actors, anything non-basic for enemies).
`paralyzed` is rooted + disabled + muted combined.

```
<negative>
<paralyzed>
```
A fully incapacitating debuff that AI healers will prioritize removing.

**See also:** `<perDebuffBuff>`, `<purgeStates>`

---

### `<immuneToAll>` / `<immuneToStates>` / `<immuneToNegatives>` / `<stateTypeImmune:TYPE>` / `<stateTypeResist:[TYPE, PCT]>`

**Applies to:**
Actors, Classes, Enemies, Weapons, Armors, States (read from the TARGET's own notes, not the
state being applied)

**When:**
a state application is attempted against this battler

**Effect:**
checked in priority order in `Game_Battler#isStateAddable`, each fully blocking application
before any chance roll: `immuneToAll` blocks everything including death; `immuneToStates` blocks
everything except death; `immuneToNegatives` blocks any `<negative>`-tagged state;
`stateTypeImmune:TYPE` blocks any state carrying a matching `<type:TYPE>`. `stateTypeResist` is
different — it doesn't block outright, it reduces the chance a matching-type state lands, folded
into the normal per-id application roll. Multiple resist tags for the same TYPE stack
additively.

```
<stateTypeResist:[cc, 50]>
```
Halves the application chance of any state carrying the "cc" (crowd-control) type classifier.

---

### `<skillTransform:[BASE, OVERRIDE]>`

**Applies to:**
Actors, Enemies, Classes, Weapons, Armors, States

**When:**
any equipped slot (combat, dodge, offhand — not tool) whose base skill id matches BASE

**Effect:**
transforms BASE into OVERRIDE at runtime for execution and display, without mutating the slot's
stored id. The battler doesn't need to have formally learned OVERRIDE — the tag itself is
implicit permission; only BASE needs the normal hasSkill check. Precedence when multiple sources
define a transform for the same BASE (first match wins): active states (highest priority first)
> equipped items (actors only) > current class (actors only) > actor/enemy database row.

```
<skillTransform:[151, 152]>
```
While this note is active anywhere, any slot whose base skill is 151 executes and displays as
152 instead.

**See also:** `<skillId>`, `<offhandSkillId>`

---

### `<hpFlat:VAL>` / `<mpFlat:VAL>` / `<tpFlat:VAL>` / `<hpPercent:VAL>` / `<mpPercent:VAL>` / `<tpPercent:VAL>`

**Applies to:**
States

**When:**
while the state is active, on the state's tick interval

**Effect:**
slip damage-over-time/regen. All values are "per 5 seconds," spread over 20 ticks
(VAL / 20 = amount per tick). `flat` is a flat amount; `percent` eats/restores a percent of the
battler's max value per tick. Positive VAL = gain (regen/meditation); negative VAL = loss
(poison/exhaustion).

```
<hpFlat:-100>
<mpPercent:50>
```
Loses 100 HP and 50% max MP over 5 seconds (5 HP and 2.5% MP per tick).

**See also:** `<hpFormula>`, `<thisTickSpeed>`, `<tickSpeedPercent>`

---

### `<hpFormula:[FORMULA]>` / `<mpFormula:[FORMULA]>` / `<tpFormula:[FORMULA]>`

**Applies to:**
States

**Formula context:**
`a` = the battler who applied the state (the source), `b` = the battler afflicted by the state
(the one ticking — same battler as `a` if self-inflicted), `v` = `$gameVariables._data`, `s` =
the state object itself.

**When:**
while the state is active, on the state's tick interval

**Effect:**
formula-based slip damage/regen, same "per 5 seconds" convention as FLAT/PERCENT above. **Sign is
inverted from FLAT/PERCENT**: write this like a normal damage formula (positive = harm) — the
engine negates the result internally, so a positive formula becomes a loss and a negative formula
becomes a gain.

```
<tpFormula:[-(a.atk * 2)]>
```
Gains TP equal to 200% of the source's ATK over five seconds (negative formula result = gain).

```
<hpFormula:[(a.mat * 3)]>
```
Loses HP equal to 300% of the source's MAT over five seconds (positive formula result = harm).

**See also:** `<hpFlat>`, `<stateDurationFormula>`

---

### `<tickSpeedFlat:VAL>` / `<tickSpeedPercent:VAL>` / `<tickSpeedTypePercent:[TYPE, VAL]>` / `<thisTickSpeed:FRAMES>`

**Applies to:**
`tickSpeedFlat`/`tickSpeedPercent`/`tickSpeedTypePercent`: Actors, Classes, Enemies, Weapons,
Armors, States. `thisTickSpeed`: States.

**When:**
always (battler-wide, summed across all active note sources) — modifies the interval between
slip/regen ticks

**Effect:**
`tickSpeedFlat` adds/subtracts frames from the base tick interval directly (positive = slower
ticks). `tickSpeedPercent` divides the interval instead: `interval / (1 + VAL/100)` (positive =
faster ticks — **opposite sign convention from flat**). `tickSpeedTypePercent` is the same
percent math but scoped to sources carrying a matching `<type:TYPE>` classifier. Flat applies
first, then the combined percent divides the result; floored at a small per-plugin minimum (never
below 1 frame). `thisTickSpeed`, placed directly on a state, overrides that state's own base tick
interval entirely, independent of the plugin default — flat/percent modifiers still layer on top.

```
<tickSpeedPercent:100>
```
Doubles this battler's slip/regen tick frequency (ticks twice as often).

**See also:** `<hpFormula>`, `<stateTypeResist>`

---

### `<stateDuration:FRAMES>` / `<stateDurationSec:SECONDS>` / `<indefiniteState>`

**Applies to:**
States

**When:**
always (map-timer configuration, not RMMZ's native "Remove by Walking")

**Effect:**
sets how long the state persists on the map. `stateDuration` is frames; `stateDurationSec` is
seconds (× 60 = frames). `indefiniteState` makes it never expire on the map. J-ABS ignores RMMZ's
native stepsToRemove field entirely (which also caps at 9999 in the editor UI, ~2.8 min) — use
these tags instead. Food chain HUD segments read the same duration getter.

```
<stateDurationSec:30>
```
This state lasts 30 seconds on the map.

**See also:** `<stateDurationFlat>`, `<stateDurationFormula>`

---

### `<stateDurationFlat:VAL>` / `<stateDurationPerc:VAL>` / `<stateDurationFormula:[FORMULA]>`

**Applies to:**
Actors, Classes, Enemies, Weapons, Armors, States (whoever is APPLYING the state — outgoing only,
does not shorten/extend incoming states on this battler)

**Formula context (stateDurationFormula):**
`a` = the assailant applying the state (whose notes are being summed), `b` = the base duration in
frames before any boosts, `v` = `$gameVariables._data`.

**When:**
a state is applied by this battler to any target

**Effect:**
extends (or shortens, with negative values) the outgoing duration of every state this battler
applies. `Flat` adds frames directly; `Perc` adds a percent of base duration; `Formula` computes
bonus frames from an expression. Multiple tags across all applicable sources sum together.

```
<stateDurationFormula:[a.luk * 2]>
```
Every state this battler applies gets bonus frames scaled off their own LUK.

**See also:** `<stateDuration>`

---

### `<stackType:refresh|extend|stack>` / `<stateRefreshDiminish:VAL>` / `<stateRefreshReset:VAL>` / `<stackExtendAmount:VAL>` / `<stackExtendMax:VAL>` / `<stackMax:VAL>` / `<applyStacks:VAL>` / `<loseAllStacksAtOnce>`

**Applies to:**
States

**When:**
this specific state is reapplied while already active

**Effect:**
overrides the plugin-wide default reapply strategy per-state. `stackType` picks the strategy.
`stateRefreshDiminish`/`stateRefreshReset` tune the "refresh" strategy's diminishing-returns
timer. `stackExtendAmount`/`stackExtendMax` tune the "extend" strategy's per-application frame
gain and cap. `stackMax` caps stack count for the "stack" strategy; `applyStacks` sets how many
stacks land per hit (default 1); `loseAllStacksAtOnce` makes expiry drop every stack at once
instead of one-at-a-time-with-refresh.

```
<stackType:stack>
<stackMax:5>
<applyStacks:1>
```
This state stacks up to 5 times, gaining 1 stack per application.

**See also:** `<stackOnExpire>`, `<stacksConvertToState>`

---

### `<stacksConvertToState:[NEW_STATE_ID, STACKS_REQUIRED]>` / `<removeOnConvert>` / `<convertUsesCaster>`

**Applies to:**
States

**When:**
this state's stack count reaches STACKS_REQUIRED (checked on every application, `>=` so
overshoot is safe)

**Effect:**
applies NEW_STATE_ID to the battler as a fresh application (starting at 1 stack regardless of the
source count) once the threshold is hit; only the first `stacksConvertToState` tag is read. If
the converted state is already active, it's re-applied per its own reapplication type. Without
`removeOnConvert` the source state stays active alongside the new one (intentional for escalation
patterns — e.g. base poison persists while lethal dose also applies); with it, the source state is
fully removed on conversion. By default conversion data is read from the TARGET's perceived
version of the state; `convertUsesCaster` (placed on the base state) reads it from the CASTER's
perceived version instead — required when the conversion tag is added via a caster-side extension
passive the target otherwise wouldn't see.

```
<stacksConvertToState:[9, 20]>
<removeOnConvert>
```
At 20 stacks, this state is replaced entirely by state 9.

**See also:** `<stackMax>`, `<applyStacks>`

---

### `<noSwitch>`

**Applies to:**
Actors

**When:**
always

**Effect:**
prevents the player from switching to this actor as party leader via the JABS party-rotate
command. Use for permanent support members or story actors that should never be
player-controlled.

---

### `<visOffset:[X, Y]>` / directional `<visOffsetU/D/L/R/UR/UL/DR/DL:[X, Y]>`

**Applies to:**
Skills, Items

**When:**
always — purely cosmetic, no effect on hitboxes or physics

**Effect:**
shifts the action sprite by a fixed pixel offset from the action event's center. X positive =
right, Y positive = down. Directional variants apply a different offset depending on the action's
travel direction and take precedence over the plain `<visOffset>` when a direction-specific tag
matches.

```
<visOffset:[0, -8]>
```
Shifts this skill's sprite 8 pixels up from center, for every direction that has no more specific
directional override.

---

### `<visAnchor:[AX, AY]>` / `<visRotate>` / `<visScale:[SX, SY]>` / `<visZ:VAL>` / `<visDebug>`

**Applies to:**
Skills, Items

**When:**
always — cosmetic sprite properties, no effect on hitboxes/physics

**Effect:**
`visAnchor` overrides the sprite's anchor point (0.0-1.0 per axis, [0.5,0.5] = center).
`visRotate` makes the sprite rotate to face its travel direction (arrows, beams). `visScale`
overrides sprite stretch (1.0 = normal). `visZ` overrides render order (higher = on top).
`visDebug` renders a center-point gizmo for diagnosing offset/anchor issues during development —
remove before shipping.

```
<visRotate>
<visAnchor:[0.5, 0.9]>
```
A projectile sprite that rotates to face its travel direction, anchored near its base rather than
center.

**See also:** `<visOffset>`

---

### `<noCastPreview>` / `<castPreviewWarnAt:FRAMES>` / `<noCastPreviews>`

**Applies to:**
`noCastPreview`/`castPreviewWarnAt`: Skills, Items. `noCastPreviews`: Actors, Enemies (event
comment or database).

**When:**
while a battler is casting a skill and the hitbox preview overlay is enabled

**Effect:**
`noCastPreview` disables the hitbox preview for this one skill's cast. `castPreviewWarnAt` delays
the preview until only the last FRAMES of the cast remain, for a "flash warning" telegraph
instead of full-cast visibility. `noCastPreviews` disables previews for every skill a given
battler executes — good for bosses whose telegraphs should come from animation/sound instead of a
hitbox overlay.

```
<castTime:120>
<castPreviewWarnAt:20>
```
The hitbox preview only appears for the final 20 frames of this 2-second cast — most of the cast
gives no visual warning.

---

## J-ABS-AllyAI (`src/plugins/abs/ext/allyai/`)

Grants party followers AI so they fight alongside the player. Requires J-ABS and followers
enabled.

### `<defaultAi:PRESET>`

**Applies to:**
Actors, Classes

**When:**
game start / actor initialization

**Effect:**
sets this ally's default AI preset, snapping all three behavior axes (risk, support, spacing) to
a coherent archetype. PRESET is one of: `berserker`, `guardian`, `vanguard`, `war-priest`,
`skirmisher`, `generalist` (default if untagged), `cleric`, `artillery`, `wizard`, `medic`. Class
tags take priority over actor tags when both are present.

```
<defaultAi:medic>
```
This ally defaults to Medic (careful risk / support-focused / backline spacing).

---

## J-ABS-Charge (`src/plugins/abs/ext/charge/`)

Lets skills be "charged" by holding the input for their slot, releasing a different skill at
each charge tier reached — a JABS take on Zelda's charge-swing. Requires J-ABS. Only chargeable
in mainhand/offhand/combat-skill 1-4 slots; dodge and tool slots can never charge, and tools/guard
skills are never valid even if tagged.

### `<chargeTier:[TIER, DURATION, RELEASED_SKILL, CHARGE_ANIM?, DONE_ANIM?]>`

**Applies to:**
Skills

**When:**
the input for this skill's slot is held down

**Effect:**
defines one charge tier. TIER is this tier's number; DURATION is frames the input must be held to
reach it; RELEASED_SKILL is the skill executed if released once this tier is reached (0 = no
skill). CHARGE_ANIM (optional) loops while charging this tier; DONE_ANIM (optional) plays once
this tier completes — both fall back to plugin-param defaults if omitted. Multiple tags on one
skill define multiple tiers; gaps between explicitly defined tiers are auto-generated at 30
frames each with no releasable skill (falling through to the nearest lower tier's skill on
release).

```
<chargeTier:[1,60,125]>
<chargeTier:[2,300,0]>
<chargeTier:[7,150,90]>
```
7 charge tiers (3-6 auto-generated at 30 frames each). Releasing after tier 1 (60 frames) fires
skill 125; releasing between tiers 2-6 also fires skill 125 (tier 2 sets 0); releasing at tier 7
(after ~10.5 seconds total) fires skill 90 instead.

---

## J-ABS-DangerIndicator (`src/plugins/abs/ext/danger/`)

Displays a level-difference danger icon beside enemy HP gauges on the map. Requires J-ABS,
otherwise plug-n-play.

### `<noDangerIndicator>` / `<showDangerIndicator>`

**Applies to:**
Enemies (database note); Enemy events (comment, overrides the database default for that event)

**When:**
always

**Effect:**
overrides the plugin-parameter default ("Show Indicator by Default") on a per-enemy basis.
`noDangerIndicator` suppresses the indicator; `showDangerIndicator` forces it to show. An
event-level tag overrides whatever the database note or plugin default would otherwise decide.

```
<noDangerIndicator>
```
This enemy never shows a danger indicator, even if the plugin default has it enabled globally.

---

## J-ABS-Food (`src/plugins/abs/ext/food/`)

Adds food group chain states, a dedicated R2 food slot, and a JABS quick-menu Equip Food screen.
Chain progression itself is authored via J-ABS core's `<applyStateOnExpire>`, not a tag from this
plugin.

### `<food:TYPE>`

**Applies to:**
Items

**When:**
always

**Effect:**
designates this item as a food item belonging to chain group TYPE (lowercase, e.g. `protein`,
`vegetable`, `fruit`). Food items route to the dedicated R2 food slot and are excluded from the
tool slot.

```
<food:protein>
```
This item is a Protein-group food, equippable in the R2 food slot.

---

### `<foodChain:TYPE>`

**Applies to:**
States

**When:**
always

**Effect:**
marks this state as belonging to food chain group TYPE — every phase state in one arc shares the
same TYPE. The actual progression (which phase expires into which) is authored via J-ABS core's
`<applyStateOnExpire>`, not this tag; this tag only identifies group membership for the HUD/logic
that needs to know "is this a food-chain state, and which arc."

```
<foodChain:protein>
<applyStateOnExpire:[90, 100]>
```
"Well Fed (Protein)" — part of the protein arc, always expires into state 90 ("Pumped").

**See also:** `<applyStateOnExpire>`, `<foodGroupColor>`

---

### `<foodGroupColor:#RRGGBB>`

**Applies to:**
States

**When:**
always

**Effect:**
sets the hex color used for this phase state's segment in the food chain HUD bar. A phase state
with no color tag renders as neutral grey instead.

```
<foodGroupColor:#44cc44>
```
This phase's segment renders in a green shade in the food chain bar.

---

### `<overstuffedImpervious>`

**Applies to:**
Actors, Classes, Enemies, Weapons, Armors, States (any note-bearing source via `getAllNotes()`)

**When:**
re-feeding mid-arc

**Effect:**
"Field Medic" mastery — with this tag active on the leader, re-feeding during any phase
(including Well Fed and peak phases) snaps straight to a fresh Well Fed instead of triggering the
Overstuffed chain. Tail-phase re-feeding always rescues regardless of this tag.

```
<overstuffedImpervious>
```
This actor/passive prevents the Overstuffed chain from ever triggering on re-feed.

---

## J-ABS-Formula (`src/plugins/abs/ext/formula/`)

Lets a single skill fire additional "packets" — inline formulas or child-skill executions —
timed to on-use or on-hit, targeting a chosen recipient group. Skills only; items are not parsed.

### `<on-(hit|use):to-(self|target|allies|enemies|all):by-formula:for-(hp|mp|tp):[FORMULA]>`

**Applies to:**
Skills

**When:**
`hit`: after the parent skill successfully hits a target. `use`: immediately when the parent
skill is used, even on a miss.

**Formula context:**
`a` = source (the user/subject), `b` = recipient (the current entity being affected), `v` =
`$gameVariables._data`, `i` = the parent RPG_Skill.

**Effect:**
applies an inline formula result to the RR resource (hp/mp/tp) of every battler in the AA
recipient group (`self`/`target` [falls back to self]/`allies`/`enemies`/`all`, animate+alive
only). **Sign is inverted from a normal damage formula**: positive result = loss/damage, negative
result = gain/heal, zero = no effect. Damage-path results get element rate, on-hit crit mirroring,
phys/mag rate, guard, variance, and JABS guard/parry reductions applied automatically;
heal-path results get element rate, phys/mag rate, variance, REC (recipient), and HAR (caster).
Multiple packets of the same timing apply in note order.

```
<on-hit:to-target:by-formula:for-hp:[a.atk * 2 - b.def]>
```
On hit, deals HP damage to the target equal to the user's ATK×2 minus the target's DEF.

```
<on-hit:to-allies:by-formula:for-hp:[-(a.mhp * 0.10)]>
```
On hit, heals all allies for 10% of the user's max HP (negative result = heal).

**See also:** `<on-(hit|use):...:by-skill>`

---

### `<on-(hit|use):to-(self|target|allies|enemies|all):by-skill:[SKILL_ID]>`

**Applies to:**
Skills

**When:**
same trigger timing as the by-formula variant above

**Effect:**
executes SKILL_ID as a child JABS action against every battler in the AA recipient group.
Child execution consumes no cost, applies no cooldown, runs no common events, and does not
cascade further formula/skill packets (one level of nesting only). Animations/effects/collisions/
logs/threat all apply normally; on-hit child packets can mirror the parent's crit state. For
target/allies/enemies/all, position bias uses the recipient's current location — useful for
ground-targeted child skills.

```
<on-use:to-self:by-skill:[77]>
```
On use, immediately fires skill 77 (e.g. an aura effect) centered on the caster, for free.

**See also:** `<on-(hit|use):...:by-formula>`

---

## J-ABS-Hitstop (`src/plugins/abs/ext/hitstop/`)

Adds a brief freeze-frame pause ("hitstop") to the attacker, target, and delivering action event
the instant a hit connects — a classic impact-frame trick for making hits feel heavier without
touching damage numbers. All base tuning is hardcoded in the plugin (no editable plugin
parameters); these three tags are the only per-skill/per-battler adjustment surface.

### `<hitstop:FRAMES>` / `<noHitstop>`

**Applies to:**
Skills

**When:**
this skill's hits connect

**Effect:**
`hitstop` sets the base freeze-frame duration for this skill's hits, before crit/guard/
target-scale adjustments (falls back to the plugin's hardcoded default when omitted).
`noHitstop` fully disables hitstop for this skill regardless of the default or any `<hitstop>`
tag present. A parried hit always resolves to zero hitstop regardless of either tag.

```
<hitstop:8>
```
This skill's hits apply 8 base frames of freeze before crit/guard adjustments.

**See also:** `<hitstopScale>`

---

### `<hitstopScale:P%>`

**Applies to:**
Actors, Enemies

**When:**
this battler is the one being hit

**Effect:**
scales the resolved hitstop duration by P percent when this battler is on the receiving end —
read from the TARGET's own database data, not the attacking skill. Defaults to 100% (no scaling)
if untagged.

```
<hitstopScale:0%>
```
This battler never experiences hitstop when hit, regardless of the attacking skill's tags.

**See also:** `<hitstop>`

---

## J-ABS-Juice (`src/plugins/abs/ext/juice/`)

Procedural map-battler motion "juice" for JABS: target hit-reaction squish, caster strike/dodge/
heal pulses, casting shimmer, and optional IconSet weapon-swing overlays. Has no plugin
parameters — all base tuning lives in a required `juice` block in `data/config.jabs.json` (the
plugin throws at startup if it's missing or malformed). These skill tags are the per-skill
adjustment surface on top of that base config.

### `<jabsJuiceIcon:N>`

**Applies to:**
Skills

**When:**
this skill executes with a weapon-swing overlay motion

**Effect:**
forces the IconSet overlay to icon index N. Without this tag, the icon is inferred from the
actor's equipped gear (dual-wield offhand → weapon slot 2; single offhand → matching armor icon).

---

### `<noJuice>` / `<juiceMotion:NAME>`

**Applies to:**
Skills

**When:**
this skill executes

**Effect:**
`noJuice` suppresses all juice motion on the caster (equivalent to `<juiceMotion:none>`). NAME
selects a preset motion: weapon overlay (`arc`, `arc-reverse`, `arc-oscillate`, `bash`, `present`,
`recoil`, `spin`, `spin-reverse`, `stab-forward`), caster-body (`squish`, `pulse`, `flip`,
`flip-reverse`), or `none` to suppress. Legacy aliases: `swing-top-down`→arc,
`swing-bottom-up`→arc-reverse, `spin-360`/`spin-720`→spin, `spin-360-reverse`→spin-reverse.
`present` lifts the icon on screen for a "brandish" pose. On healing skills, omitting this tag
keeps caster-only support squish; any `juiceMotion` tag opts into full strike juice instead.

```
<juiceMotion:arc-oscillate>
<juiceSpan:150>
<juiceRepeatCount:3>
```
A 150-degree arc that sweeps back and forth 3 times, alternating direction each sweep.

**See also:** `<juiceSpan>`, `<juiceRepeatCount>`, `<juiceDuration>`

---

### `<juiceSpan:N>` / `<juiceRepeatCount:N>` / `<juiceDuration:N>`

**Applies to:**
Skills

**When:**
this skill executes with an arc/arc-reverse/arc-oscillate motion (span), any motion (repeat
count/duration)

**Effect:**
`juiceSpan` sets arc width in degrees for arc-family motions (default 120, typical 30-300).
`juiceRepeatCount` sets how many times the motion repeats within the juice duration (default 1):
full rotations for spin/spin-reverse, alternating sweeps for arc-oscillate, full replays for
everything else. `juiceDuration` overrides the swing animation length in frames (default:
`weaponSwingFrames * 2` from config).

---

### `<juiceStabTipDegrees:N>` / `<juiceProfileGun>`

**Applies to:**
Skills

**When:**
this skill executes with a stab/bash/recoil motion (juiceStabTipDegrees), or any weapon overlay
motion (juiceProfileGun)

**Effect:**
`juiceStabTipDegrees` sets the bore/tip bearing in degrees from Pixi's +x axis at rotation 0
(stab defaults to sword diagonal; bash/recoil default toward -x). `juiceProfileGun` switches a
side-profile firearm icon to mirror east/west instead of the usual ~180° rotation, keeping the
grip from reading upside-down.

---

### `<jabsJuiceWeaponStyle:key>`

**Applies to:**
Skills

**When:**
this skill executes with a weapon overlay motion

**Effect:**
selects a tilt/swing multiplier row (`key`) from the `profiles` map in `config.jabs.json`'s
`juice` block. The key must already exist in that map. Without this tag, the key is inferred
from the swing icon: weapon rows use the string weapon type id (e.g. wtypeId 1 → `"1"`); armor
rows use `"a" + armorTypeId` (e.g. atypeId 4 → `"a4"`) so armor buckets never collide with weapon
type ids. A `default` row is mandatory in the config as the fallback.

```
<jabsJuiceWeaponStyle:heavy>
```
This skill's swing uses the `heavy` tilt/swing multiplier row instead of the inferred one.

---

## J-ABS-Poses (`src/plugins/abs/ext/poses/`)

Enables "action poses" — swapping a battler's character sprite file/index for a duration when
they take an action, cycling through its stepping animation to fake a pseudo-animated pose.

### `<poseSuffix:[SUFFIX, INDEX, DURATION]>`

**Applies to:**
Skills, Items

**When:**
this skill/item is executed

**Effect:**
swaps the caster's character sprite to `<originalFilename><SUFFIX>` at character-sheet INDEX for
DURATION frames, then reverts. Not a highly tested feature — may not work as intended in all
cases (per the plugin's own warning).

```
<poseSuffix:[-spell,0,25]>
```
A player using "Actor1" swaps to "Actor1-spell" (0th/upper-left cell) for 25 frames (~half a
second) while this skill executes.

---

## J-ABS-Shield (`src/plugins/abs/ext/shield/`)

State-based HP shields for JABS. States own the shield; when a shield breaks (reduced to 0) its
state is removed, and when the owning state expires the shield goes with it. Stacked shield
states are consumed stack-by-stack until damage is absorbed (unless `<shieldProtect>` is also
present, which caps consumption to one stack per hit). Slip damage (DoT) is NOT currently
mitigated by shields — it bypasses them entirely.

### `<shield:[FORMULA]>`

**Applies to:**
States

**Formula context:**
`a` = the battler applying the shield state, `b` = the battler receiving it, `s` = the
`RPG_State` object of the shield state itself.

**When:**
the state is applied or refreshes

**Effect:**
calculates the shield's absorb amount. Recalculated on every application/refresh — the current
shield amount carries over and adds to the new base amount, while the cap is simply replaced.
After evaluation, the result is multiplied by the applier's `sar` and the receiver's `ser`
factors (see below).

```
<shield:[(a.mat * 3) + s.stepsToRemove]>
```
A shield sized at triple the caster's MAT plus the state's own "steps to remove" database field.

**See also:** `<shieldCap>`, `<sar>`, `<ser>`

---

### `<shieldCap:[FORMULA]>`

**Applies to:**
States

**Formula context:**
same as `<shield>` — `a` = applier, `b` = receiver, `s` = the RPG_State object.

**When:**
the state is applied or refreshes

**Effect:**
sets the maximum the shield can hold. If omitted, the cap defaults to the initial shield amount
— add this tag to let a reapplied state top the shield back up past its original size.

```
<shieldCap:[(a.mat * 3) + s.stepsToRemove]>
```
The shield can be topped up to (caster's MAT × 3) + the state's stepsToRemove value.

**See also:** `<shield>`

---

### `<sar:PERCENT_POINTS>` / `<ser:PERCENT_POINTS>`

**Applies to:**
Actors, Classes, Enemies, Weapons, Armors, States

**When:**
always (summed across all active note sources, also contributed to by SDP panel investment)

**Effect:**
`sar` (Shield Amplification Rate) scales shields THIS battler grants when applying a shield state
to anyone, including themselves. `ser` (Shield Effectiveness Rate) scales shields THIS battler
receives, regardless of who applied them. Both are percent-point sums converted to a multiplier
against a 100 baseline (100 = 1.0x, neutral).

```
<sar:25>
```
Shields this battler applies to others (or themselves) come out 25% larger.

**See also:** `<shield>`

---

### `<shieldPriority:PRIORITY>`

**Applies to:**
States

**When:**
multiple shield states are active simultaneously

**Effect:**
higher PRIORITY shields are consumed first. Ties are broken by application timestamp (earlier
wins).

```
<shieldPriority:10>
```
This shield state is consumed before any shield state with a lower priority value.

---

### `<shieldProtect>`

**Applies to:**
States

**When:**
this shield breaks from a hit larger than its remaining points

**Effect:**
nullifies the overflow damage that would otherwise carry through to HP once the shield breaks,
instead of letting it pass through. Without this tag, a 150-damage hit against a 100-point shield
leaves 50 overflow damage to HP; with it, that 50 is nullified entirely.

```
<shieldProtect>
```
This shield fully absorbs its capacity and negates any overflow beyond it.

---

### `<shieldType:[TYPES...]>`

**Applies to:**
States

**When:**
damage of a matching element type is incoming

**Effect:**
restricts this shield to only absorb damage carrying one of the listed element ids. Without this
tag a shield absorbs any damage type by default (implicitly).

```
<shieldType:[1,2,3]>
```
This shield only absorbs damage of elements 1, 2, or 3 — damage of any other element passes
straight through to HP.

**See also:** `<shieldBypass>`

---

### `<shieldBypass>` / `<shieldBypass:[TYPES...]>`

**Applies to:**
Skills

**When:**
this skill deals damage to a shielded target

**Effect:**
bare `<shieldBypass>` ignores all shields entirely, no exceptions. `<shieldBypass:[TYPES...]>`
only bypasses shields whose `<shieldType>` intersects with the listed element ids — a shield with
no matching type is unaffected and still absorbs normally.

```
<shieldBypass>
```
This skill's damage always lands directly on HP, ignoring any shields on the target.

**See also:** `<shieldType>`

---

### `<shieldDamage:[FORMULA]>`

**Applies to:**
Skills

**Formula context:**
`a` = the attacker executing the skill, `b` = the target with the shield, `o` = the pre-shielded
(original) damage amount.

**When:**
this skill deals damage to a shielded target

**Effect:**
adds bonus damage specifically against the shield, on top of the skill's normal damage — good for
"shield breaker" skills. Multiple tags on one skill sum together.

```
<shieldDamage:[o * 3]>
```
This skill deals an additional 3x its own original damage as bonus shield-only damage.

```
<shieldDamage:[b.currentShieldValue() / 2]>
```
This skill deals bonus shield damage equal to half the target's current shield value.

---

### `<shieldBreak:[SKILL_IDS...]>`

**Applies to:**
Actors, Classes, Weapons, Armors, Enemies, States

**Formula context (for the payload skill's own damage formula):**
`s` = the broken shield's original cap value (0 for any non-shield-break action; never persists
across frames).

**When:**
a shield on this battler breaks (reduced to 0)

**Effect:**
fires every listed skill id when any shield breaks. Contributions from all applicable sources
(the battler itself, plus the specific state that broke) are combined and de-duplicated — a skill
id appearing on both the battler and the breaking state's tag fires only once. The payload
skill's own damage formula can reference `s` directly (e.g. `s * 0.30`) to deal damage scaled off
the broken shield's cap.

```
<shieldBreak:[12]>
```
Payload skill 12's formula written as `s * 0.5` deals damage equal to 50% of this shield's cap
the moment it breaks.

---

## J-ABS-MoveSpeed (`src/plugins/abs/ext/speed/`)

Enables percent-based move speed modifiers for battlers on the map.

### `<speedBoost:NUM>`

**Applies to:**
Actors, Classes, Skills (learned skills only — read from the battler's note-source pool, not
whichever skill is currently executing), Weapons, Armors, Enemies, States

**When:**
always (summed across all active note sources)

**Effect:**
NUM is a signed percent modifier against base move speed. Multiple tags across multiple sources
stack additively. No upper limit; clamped at an arbitrary -90% lower limit.

```
<speedBoost:40>
```
This battler's movement speed is increased by ~40%.

---

## J-ABS-StarBattles (`src/plugins/abs/ext/star/`)

Converts standard RMMZ random encounters into on-the-map, real-time JABS field battles: instead
of transitioning to a turn-based battle scene, the player teleports to a dedicated battle map
where enemies are generated and fought live, then returns to their original map/position when
the battle concludes.

### `<battleMap:MAP_ID>`

**Applies to:**
Maps (the map's own note field, not an event comment)

**When:**
a random encounter triggers while the player is on this map

**Effect:**
transfers the player to MAP_ID as the star battlefield instead of the plugin-wide default battle
map (id 110). Read via RPG Maker's native `$dataMap.meta` parsing.

```
<battleMap:112>
```
Encounters on this map transfer the player to map 112 instead of the default.

---

## J-ABS-Targeting (`src/plugins/abs/ext/targeting/`)

Adds a cursor-driven tactical target-selection mode to JABS. Flagged skills pause combat (the
same soft-pause the JABS quick menu uses) and let the player aim a reticle at allies or enemies
before the action fires.

### `<targeted>`

**Applies to:**
Skills

**When:**
this skill is selected for execution

**Effect:**
marks the skill as requiring the tactical targeting UX instead of firing immediately — combat
pauses and a reticle appears for the player to aim before the skill executes.

```
<targeted>
```
This skill pauses combat and prompts for a target before executing.

---

## J-ABS-Timing (`src/plugins/abs/ext/timing/`)

Enables battler-wide modifiers against JABS cast time and cooldown, computed identically for both
(base → flat → rate) and cached, refreshed on state add/remove and (for actors) equip/level
changes.

**Combination order (same for both cooldown and cast speed):** base is summed first (defaults to
the plugin's configured base parameter if no tags found or they sum to zero); flat is summed
second (a direct frame offset); rate is summed third (a percent factor multiplier against the
action's original cast/cooldown time). Final value = `(originalTime * rateFactor) + flatSum`,
rounded and clamped to a configurable minimum (default 0 frames for both).

### `<baseFastCooldown:[FORMULA]>` / `<fastCooldownFlat:[FORMULA]>` / `<fastCooldownRate:[FORMULA]>`

**Applies to:**
Actors, Classes, Skills, Weapons, Armors, Enemies, States

**Formula context:**
`a` = the battler itself, `b` = the base parameter (defaults to the plugin's "Base Fast Cooldown"
param unless otherwise calculated).

**When:**
always (summed across all active note sources, cached and refreshed on state/equip/level
changes)

**Effect:**
modifies JABS action cooldown. **Negative formula result = faster (shorter) cooldown; positive =
slower.** Minimum cooldown floor is 0 frames.

```
<fastCooldownFlat:[(a.level * -2)]>
```
All cooldowns are reduced by 2 frames per level.

**See also:** `<baseCastTime>`, `<castTimeFlat>`, `<castSpeedRate>`

---

### `<baseCastTime:[FORMULA]>` / `<castTimeFlat:[FORMULA]>` / `<castSpeedRate:[FORMULA]>`

**Applies to:**
Actors, Classes, Skills, Weapons, Armors, Enemies, States

**Formula context:**
`a` = the battler itself, `b` = the base parameter (defaults to the plugin's "Base Cast Speed"
param unless otherwise calculated).

**When:**
always (summed across all active note sources, cached and refreshed on state/equip/level
changes)

**Effect:**
modifies JABS action cast time. **Negative formula result = faster (shorter) cast; positive =
slower.** Minimum cast time floor is 0 frames. Same base→flat→rate combination order as fast
cooldown above.

```
<castTimeFlat:[(a.level * 2) * -1]>
```
All cast times are reduced by 2 frames per level.

**See also:** `<baseFastCooldown>`, `<fastCooldownFlat>`, `<fastCooldownRate>`

---

## J-ABS-Tools (`src/plugins/abs/ext/tools/`)

Adds tool-like functionality to skills: keyed gap-closing ("hookshot"), pull-forward (the
inverse), and a plugin-parameter-only grab-and-throw toggle (no notetags of its own).

### `<gapClose:key>` / `<gapCloseTarget:key>` / `<gapCloseAny>` / `<blockGapClose>`

**Applies to:**
`gapClose`/`gapCloseAny`: Skills. `gapCloseTarget`/`blockGapClose`: primarily Events, Enemies;
secondarily Actors, Classes, Skills, Weapons, Armors, States.

**When:**
a gap-closing skill lands a hit

**Effect:**
`gapClose:key` marks a skill as gap-closing; the caster warps to the target only if the target
carries a matching `gapCloseTarget:key`. Keys namespace independent gap-close mechanics so they
never cross-trigger. `gapCloseAny` skips key-matching entirely — gap closes to whatever single
target the hitbox connects with, no pre-tagging required (melee gap-closers). `blockGapClose`
makes a battler immune to ALL gap closing, including `gapCloseAny` — the only way to opt out of
an "any" gapcloser.

```
<gapClose:hookshot>
```
On skill 25; paired with `<gapCloseTarget:hookshot>` on a grapple-anchor event, using skill 25
against it pulls the player to it.

**See also:** `<gapCloseMode>`, `<gapClosePosition>`, `<respectTerrain>`

---

### `<gapCloseMode:blink|jump|travel>` / `<gapClosePosition:infront|behind|same>` / `<respectTerrain>`

**Applies to:**
Skills (the gap-closing skill)

**When:**
a gap close resolves

**Effect:**
`gapCloseMode` controls HOW the caster travels: `blink` (instant), `jump` (arcing hop, default),
or `travel` (tile-by-tile, respecting collision en route). `gapClosePosition` controls WHERE the
caster lands relative to the target: `infront` (adjacent, facing target), `behind` (adjacent, far
side), or `same` (directly on the target's tile, default). `respectTerrain` cancels the gap close
entirely if the caster can't legally reach the computed destination — without it, gap close
bypasses terrain checks like all modes normally do.

```
<gapCloseMode:travel>
<gapClosePosition:infront>
<respectTerrain>
```
The caster walks tile-by-tile to land in front of the target, and the gap close is cancelled
outright if that tile is unreachable.

---

### `<thisOnGapCloseEnd:[SKILL_IDS...]>` / `<onGapCloseEnd:[SKILL_IDS...]>`

**Applies to:**
`thisOnGapCloseEnd`: Skills (the gap-closing skill itself). `onGapCloseEnd`: Actors, Classes,
Weapons, Armors, States.

**When:**
the caster arrives at the gap-close destination

**Effect:**
fires the listed skill ids for free the instant the caster lands. `thisOnGapCloseEnd` is scoped
to the specific gap-closing skill; `onGapCloseEnd` fires on every gap close this battler performs
regardless of which skill triggered it. IDs from both are merged and de-duplicated before firing.

```
<thisOnGapCloseEnd:[40]>
```
A follow-up strike (skill 40) fires immediately once this hookshot connects.

---

### `<pullForward:MAGNITUDE>`

**Applies to:**
Skills

**When:**
this skill lands a hit

**Effect:**
pulls the target MAGNITUDE tiles toward the caster — the inverse of gap close. NOT key-gated;
behaves like reverse knockback, so any target without enough `<knockbackResist>` to fully negate
it gets pulled. If a skill also carries a gap-close tag, the target is pulled first, then the
caster gap-closes to wherever the target ends up, so the two meet partway.

```
<pullForward:3>
```
On hit, pulls the target 3 tiles toward the caster (before knockbackResist reduction).

**See also:** `<gapClose>`, `<knockbackResist>`

---

## J-Base (`src/plugins/_base/`)

The foundation plugin required by every other J-plugin in this repo. Adds shared managers,
lifecycle hooks, database wrapper classes, and a handful of its own notetags.

### `<max:VALUE>`

**Applies to:**
Items, Weapons, Armors

**When:**
always

**Effect:**
sets the maximum holdable quantity of this database entry, overriding the default (999).

```
<max:15>
```
The maximum amount of this item the party can hold is 15.

---

### `<maxTp:VALUE>`

**Applies to:**
Actors, Classes, Weapons, Armors, Enemies, States

**When:**
always (summed across all active note sources)

**Effect:**
adds VALUE to this battler's max TP, on top of the plugin-param base TP (default 0 for actors,
100 for enemies). Additive across all matching sources; VALUE can be negative for "cursed"
equipment/states that reduce max TP.

```
<maxTp:25>    (on state)
<maxTp:100>   (on weapon)
```
Both active together add +125 max TP on top of the base.

---

### `<type:CLASSIFIER>`

**Applies to:**
States

**When:**
always

**Effect:**
classifies a state under a named category (e.g. `poison`, `bleed`) so other plugins/tags can
react to "any state of this category" instead of a hardcoded state id. A state may carry multiple
`<type:CLASSIFIER>` tags and belongs to every classifier listed. Consumers compare classifier
strings case-insensitively (e.g. J-ABS's type-based damage bonus tags).

```
<type:poison>
<type:bleed>
```
This state is classified as both "poison" and "bleed".

**See also:** J-ABS's `<stateTypeResist>`, `<stateTypeImmune>`, `<bonusDamagePerStateType>`

---

### `<har:VALUE>`

**Applies to:**
Actors, Classes, Skills, Weapons, Armors, Enemies, States

**When:**
always (summed across all active note sources)

**Effect:**
HAR (Healing Rate) — the sender-side counterpart to REC. VALUE is a percent bonus/penalty to
outgoing healing potency this battler deals out (not healing received). Applies everywhere REC
already applies on the giving side: Damage-tab "HP/MP Recover" skills, Effects-tab "Recover
HP/MP" entries, and J-ABS-Formula's custom heal pipeline if installed.

```
<har:25>    (on actor)
```
This battler's outgoing healing is 125% effective.

```
<har:-50>   (on state)
```
While afflicted, this battler's outgoing healing is only 50% effective.

---

## J-CAMods (`src/plugins/__ca-mods/core/`)

Chef Adventure-exclusive code modifications against core scripts and other J-plugins. Not a
publicly supported plugin — unversioned, can change without notice.

### `<damageFlat:VALUE>` / `<damagePerc:VALUE>`

**Applies to:**
Maps (the map's own note field)

**When:**
the actor steps while on this map (extends the native "basic floor damage" hook)

**Effect:**
a minimal tag-driven damage-floor system. `damageFlat` deals a flat HP amount per step;
`damagePerc` deals a percent of the actor's max HP per step. Multiple tags of the same kind on
one map note all sum together.

```
<damageFlat:10>
<damagePerc:5>
```
Stepping anywhere on this map deals 10 flat HP damage plus 5% of the actor's max HP, every step.

---

## J-Escribe (`src/plugins/escribe/core/`)

Enables "describing" a map event with floating text and/or an icon, optionally only visible
within a proximity distance.

### `<text:EVENT_TEXT>` / `<icon:ICON_INDEX>`

**Applies to:**
Events (comment)

**When:**
always (subject to proximity gating if present)

**Effect:**
`text` shows EVENT_TEXT floating above the event; `icon` shows the icon at ICON_INDEX. Either or
both can be present on the same event.

```
<text:A rusty old chest.>
<icon:208>
```
This event shows both descriptive text and an icon above it.

---

### `<proximityText:DISTANCE>` / `<proximityIcon:DISTANCE>`

**Applies to:**
Events (comment)

**When:**
gates visibility of `<text>`/`<icon>` respectively

**Effect:**
DISTANCE is the tile radius the player must be within for the text/icon to become visible.
DISTANCE is required — there is no bare `<proximityText>`/`<proximityIcon>` form; to require the
player stand directly on the event, use `<proximityText:0>` explicitly. Without either proximity
tag, the paired text/icon is always visible whenever the event itself is visible on the map.

```
<text:A hidden switch.>
<proximityText:2>
```
This event's text only becomes visible once the player is within 2 tiles.

**See also:** `<text>`, `<icon>`

---

## J-SkillExtend (`src/plugins/extend/core/`)

Lets skills gain additional effects as a battler learns more skills, by having one skill "extend"
another as an override/augment applied before execution. Also adds a family of on-cast/on-hit
self-state and target-state reaction effects.

### `<extend:[NUM]>` / `<extend:[NUM,NUM,...]>`

**Applies to:**
Skills, States

**When:**
resolved whenever the base skill/state is looked up (recursively, so chains resolve fully)

**Effect:**
marks this skill/state as an extension of the listed skill/state ids. When the battler knows (or
is affected by) both the base and the extension, the extension's data overlays the base's before
execution: replaces crit flag, element id, variance, formula (if non-empty), scope, MP/TP cost,
hit type (unless "certain"), and both message lines; adds repeats (+1 offset), speed, TP gain, and
success (if not 100); merges effects and meta; appends notes (extension wins on duplicate keys).
Occasion is never changeable. The extend tag itself is stripped from the merged note to prevent
recursive re-triggering during this execution only.

```
<extend:[40]>
```
This skill/state acts as an extension to skill/state 40.

**See also:** `<extendStateType>`

---

### `<extendStateType:CLASSIFIER>`

**Applies to:**
States

**When:**
resolved whenever a matching-type state is looked up

**Effect:**
an alternative to id-based `<extend>` for states — extends EVERY currently active state carrying
a matching J-Base `<type:CLASSIFIER>` tag, without listing each target id individually. When a
battler has both type-based and id-based candidates for the same base state, type-based overlays
apply first (ascending id order), then id-based overlays apply second and win any conflict.

```
<extendStateType:poison>
```
This state extends every active state carrying `<type:poison>`, regardless of specific id.

**See also:** `<extend>`, J-Base's `<type>`

---

### `<onCastSelfState:[STATE_ID, CHANCE]>` / `<onHitSelfState:[STATE_ID, CHANCE]>`

**Applies to:**
Skills

**When:**
`onCast`: the skill executes (press-time, no hit required). `onHit`: the skill successfully hits
a target (misses/evades/parries never trigger it; multiple projectiles/repeats/JABS hits each
trigger it independently).

**Effect:**
CHANCE percent chance to apply STATE_ID to the caster. State resistance is NOT factored into
CHANCE — the tag's percent is treated as the full, final chance.

```
<onHitSelfState:[19,100]>
```
Always applies state 19 to the caster the moment this skill lands a hit.

**See also:** `<onCastSelfStateIfAfflicted>`, `<applyState>`

---

### `<onCastSelfStateIfAfflicted:[STATE_TO_APPLY, CHANCE, STATE_REQUIREMENT]>`

**Applies to:**
Skills

**When:**
the skill executes (press-time, no hit required)

**Effect:**
conditional variant of `<onCastSelfState>` — only rolls CHANCE to apply STATE_TO_APPLY to the
caster if the caster currently has STATE_REQUIREMENT active. If the requirement state is absent,
this tag does nothing at all — not even a failed roll.

```
<onCastSelfStateIfAfflicted:[42,100,19]>
```
On cast, if the caster has state 19 active, always applies state 42 to themself. No effect if
state 19 is absent.

**See also:** `<onCastSelfState>`

---

### `<onCastLoseState:[STATE_ID, CHANCE]>` / `<onHitLoseState:[STATE_ID, CHANCE]>`

**Applies to:**
Skills

**When:**
same timing as the SelfState pair above

**Effect:**
CHANCE percent chance the caster loses one stack of STATE_ID from themself.

```
<onCastLoseState:[6,100]>
```
Always strips one stack of state 6 from the caster when the skill is executed.

---

### `<onCastStripState:[STATE_ID, CHANCE]>` / `<onHitStripState:[STATE_ID, CHANCE]>`

**Applies to:**
Skills

**When:**
same timing as the SelfState pair above, but against the TARGET

**Effect:**
CHANCE percent chance the target loses one stack of STATE_ID.

```
<onHitStripState:[9,40]>
```
40% chance to strip one stack of state 9 from the target on a successful hit.

---

### `<onCastRemoveState:[STATE_ID, CHANCE]>` / `<onHitRemoveState:[STATE_ID, CHANCE]>`

**Applies to:**
Skills

**When:**
same timing as the SelfState pair above, but against the TARGET

**Effect:**
CHANCE percent chance to fully remove STATE_ID from the target (all stacks at once, not just one).

```
<onCastRemoveState:[10,100]>
```
Always fully removes state 10 from the target when the skill is executed.

---

### `<thisApplyState:[STATE_ID, CHANCE, DURATION?, STACKS?]>`

**Applies to:**
Skills

**When:**
this specific skill lands a hit

**Effect:**
applies STATE_ID to the target with a custom DURATION (frames) and/or STACKS, overriding the
state's own defaults for this application only. Both DURATION and STACKS are optional — omitting
either falls back to the state's own default. Target state resistances still apply; CHANCE only
rolls if the state could actually land. A skill may carry multiple tags to apply different states
on one hit. If both `<thisApplyState>` and `<applyState>` target the same state id on the same
hit, `<thisApplyState>` fires last and wins. Overridden DURATION replaces the state's base
duration only — attacker duration-boost tags (`stateDurationFlat`/`Perc`/`Formula`) still layer
on top.

```
<thisApplyState:[8, 50, 120, 2]>
```
50% chance to apply state 8 for 120 frames with 2 starting stacks, on this skill only.

**See also:** `<applyState>`, J-ABS's `<stateDurationFlat>`

---

### `<applyState:[STATE_ID, CHANCE, DURATION?, STACKS?]>`

**Applies to:**
Skills, States, Weapons, Armors, Actors, Enemies, Classes

**When:**
the caster lands any hit (caster-wide, not scoped to one skill)

**Effect:**
same mechanics as `<thisApplyState>` above, but reads from ALL of the caster's note sources — a
poisoned-blade state, a cursed accessory, a base actor trait — firing on every hit the battler
lands rather than one specific skill.

```
<applyState:[12, 30]>
```
Every hit this battler lands has a 30% chance to apply state 12 with its own default duration.

**See also:** `<thisApplyState>`

---

### `<toggleOnExecute:STATE_ID>`

**Applies to:**
Skills

**When:**
the skill executes (press-time, no hit required)

**Effect:**
a "stance" toggle: if the caster currently has STATE_ID, it's removed; if not, it's added. No
chance roll — always triggers. A skill may carry multiple tags to toggle several states
independently in one execution.

```
<toggleOnExecute:12>
```
Executing this skill flips state 12 on the caster — removes it if present, adds it if absent.

---

## J-HUD-TargetFrame (`src/plugins/hud/ext/target/`)

A HUD frame that displays the player's current JABS battle target: name, optional subtext, an
optional icon, and HP/MP/TP gauges.

### `<targetFrameText:TEXT>` / `<targetFrameIcon:ICON_INDEX>`

**Applies to:**
Enemies (database note); Events on the map (JABS battler events only)

**When:**
this enemy is the player's current target

**Effect:**
`targetFrameText` shows TEXT as a subtext line between the name and gauges; `targetFrameIcon`
shows the icon at ICON_INDEX beside the gauges. If the same enemy is tagged both in the database
and on its map event, the event tag wins. Without text, gauges shift up slightly to fill the gap;
without an icon, gauges shift left.

```
<targetFrameText:I'm the coolest ghosty ever.>
<targetFrameIcon:25>
```
Targeting this enemy shows its custom subtext and icon 25 in the target frame.

---

### `<hideTargetFrame>` / `<hideTargetFrameText>` / `<hideTargetHpBar>` / `<hideTargetMpBar>` / `<hideTargetTpBar>`

**Applies to:**
Enemies (database note); Events on the map (JABS battler events only)

**When:**
this enemy is the player's current target

**Effect:**
selectively hides target-frame elements for this specific enemy. `hideTargetFrame` hides the
entire frame (text and all gauges); the others hide just their named element. Hiding the whole
frame takes priority over any individual-element tag. An event-level hide tag takes priority over
any show/hide from the database.

```
<hideTargetMpBar>
<hideTargetTpBar>
```
This enemy's target frame shows only the HP gauge (and name/text/icon if present).

---

## J-JAFTING-Refine (`src/plugins/jafting/ext/refine/`)

The "refine" extension of JAFTING — transfers all traits below the "Collapse Effect" divider
from a material equip onto a base equip. Requires J-JAFTING core.

### `<noRefine>` / `<notRefinementBase>` / `<notRefinementMaterial>`

**Applies to:**
Weapons, Armors

**When:**
always

**Effect:**
`noRefine` removes the equip from the refinement menu's lists entirely (unavailable as base or
material). `notRefinementBase` disables it as a "base" selection only (still usable as material)
— good for fragile equipment. `notRefinementMaterial` disables it as a "material" selection only
(still usable as a base) — good for protecting story-critical gear from being sacrificed.

```
<notRefinementMaterial>
```
This unique story item can be used as a refinement base, but can never be sacrificed as a
material.

---

### `<maxRefineCount:NUM>`

**Applies to:**
Weapons, Armors

**When:**
this equip is selected as a refinement base

**Effect:**
caps how many times this equip can be used as a base for refinement to NUM. An already-refined
equip used as a MATERIAL still counts toward the base's remaining refinement budget even if the
material itself is beyond its own cap — the base's own remaining count is what's checked.

```
<maxRefineCount:3>
```
This equip can only be refined (used as a base) 3 times total.

---

### `<maxTraitCount:NUM>`

**Applies to:**
Weapons, Armors

**When:**
this equip is selected as a refinement base

**Effect:**
caps the number of combined trait slots this equip can hold as a base to NUM — refining beyond
the cap is blocked even with refinement counts remaining, though same-trait stacking and
powering up existing traits is still allowed.

```
<maxTraitCount:3>
```
This equip can hold at most 3 unique traits total.

---

## J-Minimap (`src/plugins/map/core/`)

Renders a passability-driven minimap on screen showing the player, followers, and (with J-ABS)
enemy battlers and dropped loot.

### `<minimap:MARKER_TYPE>` / `<mm:MARKER_TYPE>`

**Applies to:**
Events on the map (comment)

**When:**
always

**Effect:**
marks this event with a minimap marker of MARKER_TYPE: `npc` (purple circle), `loot` (green
diamond), `object` (yellow diamond), `teleport` (hollow light-blue square, stretchable via
`<areaEvent>`), `questOffer` (yellow square), `questProgress` (blue diamond), or `questTurnIn`
(green circle). `mm` is a shorthand alias for `minimap`. If multiple marker tags are present on
one event, the last one found wins.

```
<minimap:loot>
```
This event shows up as a green diamond loot marker on the minimap.

**See also:** `<areaEvent>`

---

### `<areaEvent:WIDTHxHEIGHT>`

**Applies to:**
Events on the map (comment), typically alongside `<minimap:teleport>`

**When:**
always

**Effect:**
stretches this event's minimap marker to a WIDTHxHEIGHT tile rectangle instead of the default
single-tile marker — used to represent multi-tile teleport zones accurately on the minimap.
Defaults to 1x1 if absent or malformed.

```
<minimap:teleport>
<areaEvent:3x2>
```
This teleport event's minimap marker is stretched to a 3-wide by 2-tall hollow square.

**See also:** `<minimap>`

---

### `<blockMinimap>`

**Applies to:**
Maps (the map's own note field)

**When:**
always

**Effect:**
suppresses the minimap entirely while the player is on this map, regardless of the plugin's
"Start Visible" default or any toggle plugin command.

```
<blockMinimap>
```
The minimap never renders on this map.

---

## J-MessageTextCodes (`src/plugins/message/core/`)

Adds new `\Code[ID]` text codes for database entries (not covered here — this reference is for
`<tag>` notetags only) and a family of `<tag>` conditionals for hiding/showing "Show Choices"
branches.

### `<leaderChoiceCondition:ACTOR_ID>` / `<notLeaderChoiceCondition:ACTOR_ID>`

**Applies to:**
Event Commands (inside a "Show Choices" branch/choice comment)

**When:**
the "Show Choices" command is evaluated

**Effect:**
`leaderChoiceCondition` shows the choice only while ACTOR_ID is the current party leader;
`notLeaderChoiceCondition` hides the choice only while ACTOR_ID is the current leader. Nesting
multiple "Show Choices" commands with these tags is untested and best avoided.

```
<leaderChoiceCondition:4>
```
This choice is only visible while actor 4 is the party leader.

**See also:** `<switchOnChoiceCondition>`, `<switchOffChoiceCondition>`

---

### `<switchOnChoiceCondition:SWITCH_ID>` / `<switchOffChoiceCondition:SWITCH_ID>`

**Applies to:**
Event Commands (inside a "Show Choices" branch/choice comment)

**When:**
the "Show Choices" command is evaluated

**Effect:**
`switchOnChoiceCondition` shows the choice only while SWITCH_ID is ON;
`switchOffChoiceCondition` shows the choice only while SWITCH_ID is OFF.

```
<switchOnChoiceCondition:222>
```
This choice is only visible while switch 222 is ON.

**See also:** `<leaderChoiceCondition>`, `<notLeaderChoiceCondition>`

---

## J-NaturalGrowths (`src/plugins/natural/core/`)

Level-based and equipment/state-based formulaic growth for every base/ex/sp parameter, plus a
custom max-TP and HAR (Healing Rate) pair, plus enemy reward bonuses. This is one tag FORMAT
applied across ~30 parameter shorthands — see the shorthand table below rather than a
per-parameter entry for each.

### `<(PARAM)(Buff|Growth)(Plus|Rate):[FORMULA]>`

**Applies to:**
Actors, Classes, Skills, Weapons, Armors, Enemies, States

**Formula context:**
`a` = the battler itself, `b` = 0, `v` = `$gameVariables._data`.

**When:**
`Buff` variants: continuously, only while the tagged object (equip/state/etc.) is active —
lost the moment it's removed. `Growth` variants: applied permanently once per level gained (does
NOT reverse if level later decreases, and re-applies if the level increases again through the
same range).

**Effect:**
`Plus` is a flat bonus added to the base parameter; `Rate` is a percent multiplier against
`(base + all Plus bonuses)`. PARAM is one of the shorthands below:

- **Base params:** `mhp`, `mmp`, `atk`, `def`, `mat`, `mdf`, `agi`, `luk`
- **Ex params:** `hit`, `eva`, `cri`, `cev`, `mev`, `mrf`, `cnt`, `hrg`, `mrg`, `trg` (tp regen)
- **Sp params:** `tgr` (targeting), `grd`, `rec`, `pha`, `mcr`, `tcr`, `pdr`, `mdr`, `fdr`, `exr`
- **Custom params (require their own plugins):** `mtp` (max TP), `har` (healing rate, requires
  J-Base 3.5.0+)

```
<atkGrowthPlus:[a.level * 3]>
```
Every level gained permanently adds `(level × 3)` flat ATK.

```
<exrBuffPlus:[25]>
```
+25 flat experience rate while this tagged object is active — lost when removed.

**See also:** J-CriticalFactors' equivalent `<cdmGrowthPlus>`/`<ctrGrowthPlus>` family (same
convention, different plugin)

---

### `<expPlus:[FORMULA]>` / `<goldPlus:[FORMULA]>` / `<sdpPlus:[FORMULA]>`

**Applies to:**
Enemies, States

**Formula context:**
`a` = the enemy itself, `b` = 0, `v` = `$gameVariables._data`.

**When:**
this enemy is defeated

**Effect:**
adds FORMULA on top of the database's static base value for the given reward — the static value
is effectively the "base" the formula adds onto. No `Rate` variant exists for rewards, only
`Plus`.

```
<expPlus:[5 + a.lvl * 50]>
```
Defeating this enemy grants 5 + (level × 50) bonus experience on top of its database base amount.

---

## J-Omnipedia-Monster (`src/plugins/omni/ext/monster/`)

Extends the Omnipedia with a Monsterpedia entry — a bestiary of encountered enemies.

### `<hideFromMonsterpedia>` / `<monsterFamilyIcon:ICON_INDEX>` / `<descriptionLine:TEXT>`

**Applies to:**
Enemies

**When:**
always

**Effect:**
`hideFromMonsterpedia` excludes this enemy from the Monsterpedia listing entirely.
`monsterFamilyIcon` sets the family/category icon shown in the listing. `descriptionLine` adds
one line of flavor text to the enemy's detail view; multiple tags on the same enemy each add
another line, in note order.

```
<descriptionLine:A lumbering beast of the northern peaks.>
<descriptionLine:Known to hoard shiny objects.>
```
This enemy's Monsterpedia entry shows both description lines.

---

## J-Omnipedia-Quest (`src/plugins/omni/ext/quest/`)

Extends the Omnipedia with a Questopedia entry. Quest data itself is authored entirely in an
external `data/config.quest.json` file (use the rmmz-data-editor app), not via notetags — but
this plugin adds tags that gate event pages and message choices behind quest/objective state.

### `<pageQuestCondition:[...]>` / `<choiceQuestCondition:[...]>`

**Applies to:**
Event pages (comment, gates the whole page); "Show Choices" branches (comment, gates one choice)

**When:**
page condition evaluation / choice list building

**Effect:**
gates visibility behind quest state. Accepts one of three array shapes: `[QUEST_KEY]` (valid
while the quest is active in any objective), `[QUEST_KEY, OBJECTIVE_ID]` (valid while that
specific objective is active), or `[QUEST_KEY, OBJECTIVE_ID, STATE]` (valid only while that
objective is in STATE — one of `inactive`/`active`/`completed`/`failed`/`missed`).

```
<pageQuestCondition:[herbalist_delivery, 2, completed]>
```
This event page is only active once objective 2 of the "herbalist_delivery" quest is completed.

---

## J-ABS-Pixelistics (`src/plugins/pixel/ext/abs/`)

JABS integration layer for J-Pixelistics (sub-tile pixel-accurate movement). Adapts ally AI
formation, battler hitbox queries, and dodge distance to the fractional-coordinate system.

### `<hitboxSize:N>` / `<hitboxSize:[W, H]>`

**Applies to:**
Enemies (database note); Events on the map (battler page comment)

**When:**
always

**Effect:**
overrides this enemy's collision/targeting hitbox, shared across PIXEL movement, JABS targeting,
and hitbox overlays. Centered horizontally, anchored to feet vertically. Bare N is a square
shorthand (width = height = N tiles); `[W, H]` sets width and height independently. Precedence:
event comment > enemy note > plugin parameter default.

```
<hitboxSize:[0.8, 0.5]>
```
This enemy's hitbox is 0.8 tiles wide and 0.5 tiles tall.

**See also:** `<hitboxReveal>`

---

### `<hitboxReveal:N>`

**Applies to:**
Enemies (database note); Events on the map (battler page comment)

**When:**
the player is within N tiles

**Effect:**
reveals a faint outline of this enemy's hitbox while the player is within N tiles. Precedence:
event comment > enemy note > plugin parameter default. A default range of 0 disables
proximity-based reveal unless the "Outline Always Active" plugin parameter is enabled.

```
<hitboxReveal:4.5>
```
This enemy's hitbox outline becomes visible once the player is within 4.5 tiles.

**See also:** `<hitboxSize>`

---

## J-Popups-ABS (`src/plugins/popups/ext/abs/`)

Wires up floating combat/reward popup builders for JABS (damage, healing, loot, level-ups, skill
learns, etc.) via JABS_PopupManager.

### `<noHpPopup>` / `<noMpPopup>` / `<noTpPopup>` / `<noSlipPopup>`

**Applies to:**
States

**When:**
this state ticks a slip/regen effect

**Effect:**
suppresses the floating popup for slip/regen ticks generated by this state, per-resource
(`noHpPopup`/`noMpPopup`/`noTpPopup`) or all at once (`noSlipPopup`). The underlying slip effect
still applies — only the visual popup is hidden.

```
<noSlipPopup>
```
This state's HP/MP/TP slip ticks never show a floating popup, even though they still apply.
