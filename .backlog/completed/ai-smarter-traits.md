---
completed: 2026-11-17
ship: J-ABS 4.29.0 and J-ABS-Shield 1.3.0
---

# Smarter AI traits: careful strips buffs, tactical interrupts and follows up, executor cracks shields

## Severity

**Medium.** Nothing is broken. Chef Adventure's final boss, Grudj, a battle mage who reads the duo, needs it, and every
enemy wearing these traits gets it for free. Only four event pages in CA carry `careful`, `executor` or `tactical`
today, all of them the AI demo ghosts (Map204, Map205, Map207, Map208), so the upgrade surprises nothing else.

## Gain

Three existing traits learn to read the target:

- **`careful`** also strips what protects you: a positive state on the target that one of its skills can remove.
- **`tactical`** also cuts your casts with an `<interrupt:N>` skill, never wasted on a cast that can't be cut, and
  casts first the skill it saved for a state you carry (a follow-up: Grudj's Black Meltima on a Scrambled duo).
- **`executor`** also cracks your shield first, with a skill that bypasses shields or bites into them (in J-ABS-Shield,
  since core cannot know about shields).

## Decided with Jeremy (2026-11-16)

- "All of those would be great if it can be done? I think the existing 'careful' could include stripping buffs,
  'tactical' would include proper usage of interrupts, and going after your shields could be woven into 'executor'."
  No new trait.
- A guard-break was skipped: "It's not necessary."
- The follow-up is his wish: "I'd want him to also HAVE the spell himself... wish there was a way to make his AI just
  notice 'oh i see they are scrambled, I should use dark meltima on them'."

## Source

- `src/plugins/abs/core/models/JABS_EnemyAI.js`: `decideAction` (support layer, berserker, then the attack layer),
  `decideAttackAction` (careful filter, executor filter, tactical filter, then `decideFromNoneToManySkills`),
  `filterForTacticalSkills`.
- `src/plugins/abs/core/models/JABS_AI.js`: `filterUncastableSkills`, `decideFromNoneToManySkills`,
  `filterElementallyIneffectiveSkills`, `findMostElementallyEffectiveSkill`, `decideCleansing`,
  `determineBestSkillForStateCleansing` (returns `null`, not a sentinel, when nothing removes the state).
- `src/plugins/abs/core/models/JABS_Battler.js`: `isCasting`, `isCastingOrChanneling` (line ~4213),
  `getDecidedAction`, `getSkillIdsFromEnemy` and `aiSkillFilter` (`<aiSkillExclusion>` removes a skill from the
  pool before the AI ever sees it, which is why a skill saved for a follow-up cannot use that tag).
- `src/plugins/abs/core/managers/JABS_Engine.js` `checkInterrupt` (line ~3846): the engine's own "can this cast be
  cut" rule: casting or channeling, the in-flight skill without `<thisCannotBeInterrupted>`
  (`RPG_Skill.jabsThisCannotBeInterrupted`), the battler without `<cannotBeInterrupted>`
  (`Game_Battler.isImmuneToInterrupt`). The attacking skill's `<interrupt:N>` is `RPG_UsableItem.jabsInterruptMagnifier`
  (sentinel 0).
- `src/plugins/abs/core/database/RPG_Skill.js` (`jabsAiSkillExclusion` at ~line 548) and
  `src/plugins/abs/core/_metadata/initialization.js` (`AiSkillExclusion`, the `// ai traits.` block at ~line 1103).
- `RPG_State.isNegativeType()` (`abs/core/database/RPG_State.js`): a state's polarity; the cleanser already uses it.
- `RPGManager.getArrayFromNotesByRegex(databaseData, structure)` returns `[]` when the tag is absent.
- J-ABS-Shield: `src/plugins/abs/ext/shield/objects/_Game_Battler.js` `getShieldStates()` (unbroken shields only),
  `src/plugins/abs/ext/shield/database/RPG_UsableItem.js` (`hasShieldBypass`, `shieldBonusFormulas`), the alias
  map in `src/plugins/abs/ext/shield/_metadata/initialization.js`, `_models/` holding its augments of J-ABS models,
  and `entry.js`.
- Tests: `test/plugins/abs/core/models/jabs-enemy-ai.test.js` (JABS_AI mocked as a class with stub methods),
  `test/plugins/abs/core/models/jabs-ai.test.js`, `test/plugins/abs/core/models/jabs-battler.test.js`,
  `test/plugins/abs/core/managers/jabs-engine.test.js` (`describe('checkInterrupt')` at ~line 5375, its own
  `buildTarget`), `test/plugins/abs/core/database/rpg-skill.test.js`, `test/plugins/abs/ext/shield/_models/`.
- Docs: `docs/notetag-reference.md` (`<aiTrait:TRAIT>` at ~line 2045, the combo/`<aiSkillExclusion>` entry at
  ~line 2856), `docs/plugins/abs/core/notetags/enemy-events/ai-traits.md`,
  `docs/plugins/abs/core/notetags/skills/` (one page per tag), `src/build-tools/notetag-id-targets.js`.

**A doc drift this fixes:** the glossary and the book both describe `tactical` as "repositions to optimal range before
using a skill". The code (`filterForTacticalSkills`) prefers skills that apply states. Both docs are rewritten from the
code below.

## Work

### 1. One rule for "can this cast be cut", shared by the engine and the AI

`src/plugins/abs/core/models/JABS_Battler.js`, directly after `isCastingOrChanneling`:

```javascript
  /**
   * Whether a landed `<interrupt:MAGNIFIER>` hit would cut this battler's cast or channel right now.<br/>
   * It has to be casting or channeling, the skill in flight must not carry `<thisCannotBeInterrupted>`, and none of
   * the battler's own note sources may carry `<cannotBeInterrupted>`. The engine asks this when such a hit lands,
   * and a tactical AI asks it before spending an interrupt.
   * @returns {boolean}
   */
  isInterruptible()
  {
    // only a battler mid-cast or mid-channel has anything to cut.
    if (this.isCastingOrChanneling() === false) return false;

    // an immunity on the skill in flight wins first.
    const decidedActions = this.getDecidedAction();
    const skillInFlight = decidedActions
      ? decidedActions.at(0).getBaseSkill()
      : null;
    if (skillInFlight && skillInFlight.jabsThisCannotBeInterrupted) return false;

    // then the battler-wide immunity, from any of its own note sources.
    if (this.getBattler().isImmuneToInterrupt()) return false;

    return true;
  };
```

`src/plugins/abs/core/managers/JABS_Engine.js`, `checkInterrupt` becomes (JSDoc kept; the rule moves, the behavior
does not change):

```javascript
  checkInterrupt(action, target)
  {
    // the attacking skill must actually carry interrupt capability.
    const magnifier = action.getBaseSkill().jabsInterruptMagnifier;
    if (!magnifier) return;

    // the target has to be mid-cast, with nothing making that cast immune.
    if (target.isInterruptible() === false) return;

    target.interrupt(magnifier, false);
  }
```

### 2. The follow-up tags

`src/plugins/abs/core/_metadata/initialization.js`, directly after `AiSkillExclusion`:

```javascript
  /**
   * The states a skill follows up on. While its target carries one of them, an AI with the tactical trait casts this
   * skill before anything else, which is how a boss reads a combo off the field: one battler lays a state, another
   * cashes it in.
   *
   * <pre>
   * Structure:
   *  <aiFollowUp:[STATE_IDS]>
   *
   * Example:
   *  <aiFollowUp:[2090, 4]>
   *
   * Translation:
   *  While its target carries state 2090 or state 4, a tactical AI casts this first.
   * </pre>
   * @type {RegExp}
   */
  AiFollowUp: /<aiFollowUp:[ ]?(\[[\d, ]+])>/i,

  /**
   * The declaration that the AI saves a skill for its follow-up: it never comes up in an ordinary decision, only when
   * its target carries a state it follows up on, so it is never on cooldown when that moment arrives. Unlike
   * `<aiSkillExclusion>`, the skill stays in the AI's pool.
   *
   * <pre>
   * Structure:
   *  <aiFollowUpOnly>
   *
   * Example:
   *  <aiFollowUpOnly>
   *
   * Translation:
   *  The AI casts this only as a follow-up.
   * </pre>
   * @type {RegExp}
   */
  AiFollowUpOnly: /<aiFollowUpOnly>/i,
```

`src/plugins/abs/core/database/RPG_Skill.js`, directly after `jabsAiSkillExclusion`:

```javascript
/**
 * The ids of the states this skill follows up on, from `<aiFollowUp:[STATE_IDS]>`. While a tactical AI's target
 * carries one of them, the AI casts this skill before anything else. Empty when it follows up on nothing.
 * @type {number[]}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsAiFollowUpStateIds', {
  get: function()
  {
    return RPGManager.getArrayFromNotesByRegex(this, J.ABS.RegExp.AiFollowUp);
  },
});

/**
 * Whether the AI saves this skill for its follow-up, from `<aiFollowUpOnly>`: it is never chosen in an ordinary
 * decision, only as a follow-up.
 * @type {boolean}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsAiFollowUpOnly', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.RegExp.AiFollowUpOnly);
  },
});
```

### 3. The readings, on `JABS_AI` (so ally AI can use them later)

`src/plugins/abs/core/models/JABS_AI.js`. First, `determineBestSkillForStateCleansing` returns the sentinel `0`
instead of `null` (its JSDoc already promises `{number}`): `let bestSkillForStateCleansing = 0;`. Grepped 2026-11-16
across `src` and `test`: its only caller is `decideCleansing` (lines 288 and 294, both truthiness checks, so
unaffected), and two tests in `jabs-ai.test.js` expect `null` (`toBeNull()` at ~line 1119 and in "returns null when
every effect matches only half the predicate" at ~line 1177); both expect `0`, the second renamed "returns 0 when...".

Then, in the `//region attack filters` block, after `findMostElementallyEffectiveSkill`:

```javascript
  /**
   * The executor's pick: the skills most effective against this target.<br/>
   * Core judges effectiveness by element alone; extensions widen it, as J-ABS-Shield does for a shielded target.
   * @param {number[]} skillsToUse The available skills to use.
   * @param {JABS_Battler} user The battler deciding the action.
   * @param {JABS_Battler} target The battler being targeted.
   * @returns {number[]}
   */
  filterForExecutorSkills(skillsToUse, user, target)
  {
    return this.findMostElementallyEffectiveSkill(skillsToUse, user, target);
  }

  /**
   * Drops every skill saved for a follow-up, so it never comes up in an ordinary decision.
   * @param {JABS_Battler} user The battler deciding the action.
   * @param {number[]} skillsToUse The available skills to use.
   * @returns {number[]}
   */
  filterFollowUpOnlySkills(user, skillsToUse)
  {
    return skillsToUse.filter(skillId => user.getSkill(skillId).jabsAiFollowUpOnly === false);
  }
```

And a new region after it:

```javascript
  //region openings
  /**
   * Finds a skill that follows up on a state the target carries right now, saved-for-it or not.
   * @param {JABS_Battler} user The battler deciding the action.
   * @param {JABS_Battler} target The battler being targeted.
   * @param {number[]} usableSkills The skills the user can cast right now.
   * @returns {number} The skill id, or 0 when nothing follows up on any state the target has.
   */
  decideFollowUp(user, target, usableSkills)
  {
    // the target's current states, by id.
    const targetStateIds = target.getBattler()
      .states()
      .map(state => state.id);

    // the first skill naming any of them is the one this moment was waiting for.
    const followUpSkillId = usableSkills.find(skillId =>
    {
      const { jabsAiFollowUpStateIds } = user.getSkill(skillId);
      return jabsAiFollowUpStateIds.some(stateId => targetStateIds.includes(stateId));
    });

    return followUpSkillId ?? 0;
  }

  /**
   * Finds the skill that would cut the target's cast, choosing the one with the largest interrupt magnifier, but only
   * when the cast can actually be cut: an interrupt spent on an immune cast is a wasted turn.
   * @param {JABS_Battler} user The battler deciding the action.
   * @param {JABS_Battler} target The battler being targeted.
   * @param {number[]} usableSkills The skills the user can cast right now.
   * @returns {number} The skill id, or 0 when there is no cast to cut or nothing to cut it with.
   */
  decideInterrupt(user, target, usableSkills)
  {
    // a target that isn't mid-cast, or whose cast is immune, offers nothing to cut.
    if (target.isInterruptible() === false) return 0;

    let bestSkillId = 0;
    let bestMagnifier = 0;
    usableSkills.forEach(skillId =>
    {
      // the strongest interrupt wins, and the first one listed wins a tie.
      const { jabsInterruptMagnifier } = user.getSkill(skillId);
      if (jabsInterruptMagnifier > bestMagnifier)
      {
        bestSkillId = skillId;
        bestMagnifier = jabsInterruptMagnifier;
      }
    });

    return bestSkillId;
  }

  /**
   * Finds a skill that strips a positive state off the target: the target's states are read in the order it carries
   * them, and the first one some skill can remove is the one stripped, with the skill that removes it most reliably.
   * @param {JABS_Battler} user The battler deciding the action.
   * @param {JABS_Battler} target The battler being targeted.
   * @param {number[]} usableSkills The skills the user can cast right now.
   * @returns {number} The skill id, or 0 when the target carries nothing the user can strip.
   */
  decideStrip(user, target, usableSkills)
  {
    // only what protects the target is worth stripping.
    const positiveStates = target.getBattler()
      .states()
      .filter(state => state.isNegativeType() === false);

    // the first protection something can remove is the one stripped; the early exit is why this is a for..of.
    for (const state of positiveStates)
    {
      const stripSkillId = this.determineBestSkillForStateCleansing(usableSkills, state.id, user);
      if (stripSkillId !== 0) return stripSkillId;
    }

    return 0;
  }
  //endregion openings
```

### 4. The wiring, on `JABS_EnemyAI`

`src/plugins/abs/core/models/JABS_EnemyAI.js`. The trait field JSDocs gain a sentence each:

- `careful`: "Strips a positive state off its target when one of its skills can remove it."
- `executor`: "Its pick of the most effective skill is widened by extensions; J-ABS-Shield aims it at a target's
  shield first."
- `tactical`: "Casts first a skill that follows up on a state its target carries, then a skill that cuts its target's
  cast when that cast can be cut."

`decideAction`, the opening lines become:

```javascript
  decideAction(user, target, availableSkills)
  {
    // filter out the unusable or invalid skills.
    const castableSkills = this.filterUncastableSkills(user, availableSkills);

    const {
      careful,
      executor,
      reckless,
      tactical,
      berserker,
      cleanser,
      healer,
      buffer,
    } = this;

    // a tactical mind reads the moment before anything else: a state a skill was saved for, or a cast to cut.
    if (tactical)
    {
      const opening = this.decideTacticalOpening(user, target, castableSkills);
      if (opening.length) return opening;
    }

    // a skill saved for a follow-up never comes up any other way.
    const usableSkills = this.filterFollowUpOnlySkills(user, castableSkills);
```

and everything after it in `decideAction` keeps using `usableSkills`, unchanged. New method, after `decideAction`:

```javascript
  /**
   * The tactical opening: a skill that follows up on a state the target carries, else one that cuts its cast.<br/>
   * A combo underway keeps its rhythm, so no opening is taken while one is due.
   * @param {JABS_Battler} user The battler deciding the action.
   * @param {JABS_Battler} target The battler being targeted.
   * @param {number[]} castableSkills The skills the user can cast right now, saved ones included.
   * @returns {number[]} Exactly one skill id, or empty when the moment offers no opening.
   */
  decideTacticalOpening(user, target, castableSkills)
  {
    // a combo underway is followed through by the ordinary path.
    if (this.shouldFollowWithCombo(user)) return [];

    // the state a skill was saved for comes first: it is the whole reason it was saved.
    const followUp = this.decideFollowUp(user, target, castableSkills);
    if (followUp) return [ followUp ];

    // then a cast that can be cut.
    const interrupt = this.decideInterrupt(user, target, castableSkills);
    if (interrupt) return [ interrupt ];

    return [];
  }
```

`decideAttackAction`, after `const target = user.getTarget();` and before `let filtered = usableSkills;`:

```javascript
    // careful: a protection on the target is worth stripping before anything is thrown at it.
    if (this.careful)
    {
      const strip = this.decideStrip(user, target, usableSkills);
      if (strip) return [ strip ];
    }
```

and its executor line becomes:

```javascript
    // executor: the skills most effective against this target, as core and any extension judge it.
    if (this.executor)
    {
      filtered = this.filterForExecutorSkills(filtered, user, target);
    }
```

### 5. J-ABS-Shield: executor cracks shields

`src/plugins/abs/ext/shield/_metadata/initialization.js`: add `JABS_AI: new Map(),` to `J.ABS.EXT.SHIELD.Aliased`.

New file `src/plugins/abs/ext/shield/_models/JABS_AI.js`, imported in `entry.js` after `./_models/JABS_StateBuilder.js`:

```javascript
//region JABS_AI
/**
 * Extends {@link JABS_AI.filterForExecutorSkills}.<br/>
 * An executor facing a shield reaches for what breaks it first. While its target carries an unbroken shield and at
 * least one of its skills bypasses shields or deals bonus damage to them, it chooses among those alone, the most
 * effective of them first; otherwise it chooses as it always has.
 * @param {number[]} skillsToUse The available skills to use.
 * @param {JABS_Battler} user The battler deciding the action.
 * @param {JABS_Battler} target The battler being targeted.
 * @returns {number[]}
 */
J.ABS.EXT.SHIELD.Aliased.JABS_AI.set('filterForExecutorSkills', JABS_AI.prototype.filterForExecutorSkills);
JABS_AI.prototype.filterForExecutorSkills = function(skillsToUse, user, target)
{
  // the shield-breakers among the skills, when the target has a shield up to break.
  const breakers = this.findShieldBreakers(skillsToUse, user, target);

  // narrow to the breakers when there are any, and judge effectiveness among what remains.
  const candidates = breakers.length > 0
    ? breakers
    : skillsToUse;

  // perform original logic.
  return J.ABS.EXT.SHIELD.Aliased.JABS_AI.get('filterForExecutorSkills')
    .call(this, candidates, user, target);
};

/**
 * The skills that would break the target's shield: those bypassing shields or dealing bonus damage to them. None
 * while the target has no unbroken shield up.
 * @param {number[]} skillsToUse The available skills to use.
 * @param {JABS_Battler} user The battler deciding the action.
 * @param {JABS_Battler} target The battler being targeted.
 * @returns {number[]}
 */
JABS_AI.prototype.findShieldBreakers = function(skillsToUse, user, target)
{
  // a target with no shield up gives a breaker no edge.
  const shieldStates = target.getBattler()
    .getShieldStates();
  if (shieldStates.length === 0) return [];

  return skillsToUse.filter(skillId =>
  {
    const skill = user.getSkill(skillId);

    // a bypass of any kind reaches past the shield.
    if (skill.hasShieldBypass) return true;

    // bonus shield damage bites into it.
    return skill.shieldBonusFormulas.length > 0;
  });
};
//endregion JABS_AI
```

A typed shield or a typed bypass (`<shieldType>`, `<shieldBypass:[...]>`) is not matched against each other here: any
bypass or bonus counts. That is deliberate for now and named in the shield book.

### 6. Tests

`test/plugins/abs/core/models/jabs-battler.test.js`, new `describe('isInterruptible()')`, one `it` per branch:

1. not casting or channeling: `false`.
2. casting, the skill in flight carries `jabsThisCannotBeInterrupted`: `false` (and `isImmuneToInterrupt` never
   consulted).
3. casting, nothing decided (`getDecidedAction` null), the battler immune: `false`.
4. casting, a decided skill without the tag, the battler not immune: `true`.

`test/plugins/abs/core/managers/jabs-engine.test.js` `describe('checkInterrupt')`: `buildTarget` gains
`isInterruptible: () => true`. Tests become: no magnifier → `interrupt` not called (with `isInterruptible` true, so
the magnifier is the only reason); `isInterruptible` false → not called (with a magnifier, so immunity is the only
reason); both → `interrupt(magnifier, false)`. The three immunity tests move to `isInterruptible` above.

`test/plugins/abs/core/_component/channeling-interrupt.test.js` `describe('JABS_Engine.checkInterrupt')` (~line 568)
runs the real `checkInterrupt` against a duck-typed `buildTarget` without `isInterruptible`, so it would throw. Its
`buildTarget` gains `isInterruptible: globalThis.JABS_Battler.prototype.isInterruptible,` (the file already loads the
real `JABS_Battler` onto `globalThis`), which keeps that test exercising the real rule end to end; its expectations do
not change.

`test/plugins/abs/core/database/rpg-skill.test.js`: `jabsAiFollowUpStateIds` reads `[2090, 4]` from
`<aiFollowUp:[2090, 4]>` and `[]` from a note without it; `jabsAiFollowUpOnly` true with the tag, false without.

`test/plugins/abs/core/models/jabs-ai.test.js` (real `JABS_AI`), each with a near-miss that must survive:

- `filterForExecutorSkills`: delegates to `findMostElementallyEffectiveSkill` with the same arguments and returns its
  result (spy, return `[ 7 ]`, expect `[ 7 ]`).
- `filterFollowUpOnlySkills`: skills 1 (saved) and 2 (not): `[ 2 ]`.
- `decideFollowUp`: the target carries states 4 and 9; skill 1 follows up on `[ 12 ]`, skill 2 on `[ 9 ]`, skill 3 on
  `[]`: `2`. With the target carrying only 7: `0`.
- `decideInterrupt`: target not interruptible, skill with magnifier 200 available: `0`. Interruptible, skills
  magnifier 0, 150, 200, 200 (ids 1-4): `3` (largest, first of the tie). Interruptible, no magnifier anywhere: `0`.
- `decideStrip`: the target carries a negative state 4 and positive states 50, 60; skill 1 removes 4, skill 2 removes
  60 (rate 1): `2` (the negative state is skipped, 50 has no remover, 60 does). Carrying only 4: `0`.
- `determineBestSkillForStateCleansing`: the "nothing removes it" test now expects `0`.

`test/plugins/abs/core/models/jabs-enemy-ai.test.js` (JABS_AI mocked): the mock class gains `decideFollowUp() { return
0; }`, `decideInterrupt() { return 0; }`, `decideStrip() { return 0; }`, `filterFollowUpOnlySkills(_user, skills)
{ return skills; }` and `filterForExecutorSkills(skills) { return skills; }`. New tests:

- `decideAction`: tactical with `decideTacticalOpening` returning `[ 8 ]` returns `[ 8 ]` before any support or attack
  path runs (spy `decideAttackAction`, not called). Tactical with the opening `[]` falls through (attack path called).
  Not tactical: `decideTacticalOpening` never called. `filterFollowUpOnlySkills` returning `[ 2 ]` from `[ 1, 2 ]`:
  the attack path receives `[ 2 ]`.
- `decideTacticalOpening`: combo due → `[]` and `decideFollowUp` not called; follow-up 5 → `[ 5 ]` and
  `decideInterrupt` not called; no follow-up, interrupt 6 → `[ 6 ]`; neither → `[]`.
- `decideAttackAction`: careful with `decideStrip` 4 → `[ 4 ]` and `filterElementallyIneffectiveSkills` not called;
  careful with strip 0 → falls through to the filters; not careful → `decideStrip` never called. The existing
  "applies the executor filter" test spies `filterForExecutorSkills` instead of `findMostElementallyEffectiveSkill`,
  and so does its "skips" twin.

`test/plugins/abs/ext/shield/_models/jabs-ai.test.js` (new; real alias over a stub `JABS_AI` whose
`filterForExecutorSkills` returns its first argument):

- target with no shield: the original receives every skill.
- target shielded, skills 1 (plain), 2 (`hasShieldBypass`), 3 (one bonus formula): the original receives `[ 2, 3 ]`.
- target shielded, no breakers among `[ 1, 4 ]`: the original receives `[ 1, 4 ]`.
- `findShieldBreakers`: no shield → `[]` with a breaker present; shield up → only the breakers.

### 7. Docs (verbatim)

**`docs/notetag-reference.md`, `<aiTrait:TRAIT>` (~line 2045):** its `**Effect:**` paragraph becomes:

~~~markdown
**Effect:**
tunes how this enemy chooses and uses skills. TRAIT is one of: `careful` (drops skills its target
resists, and first strips a positive state off its target when one of its skills can remove it),
`executor` (picks the skill most effective against its target; with J-ABS-Shield, first a skill that
bypasses shields or bites into them while its target has a shield up), `reckless` (never
basic-attacks, spams learned skills), `healer` (prioritizes healing nearby allies), `cleanser`
(removes negative states from allies), `buffer` (applies positive states to allies before
attacking), `tactical` (prefers skills that apply states; before anything else it casts a skill
that follows up on a state its target carries, see `<aiFollowUp>`, then a skill that cuts its
target's cast when that cast can be cut), or `berserker` (goes all-out below an HP threshold,
ignoring range/cooldown/efficiency). Multiple traits can stack on one enemy; careful/reckless
amplify the judgment of other traits when combined. `follower`/`leader` are also accepted as
backward-compatible aliases for the AI ROLE tags below.
~~~

and its `**See also:**` line becomes `**See also:** <aiRole:...>, <aiFollowUp>` (each in backticks, as now).

**`docs/notetag-reference.md`, new entry** directly after the entry headed
`### <combo:[COMBO_SKILL_ID, LINK_TIME?, EXPIRE_FRAMES?]> / <comboStarter> / <freeCombo> / <aiSkillExclusion>`
(~line 2856), after its closing `---`:

~~~markdown
### `<aiFollowUp:[STATE_IDS]>` / `<aiFollowUpOnly>`

**Applies to:**
Skills

**When:**
an AI with the `tactical` trait deciding its next action

**Effect:**
`aiFollowUp` names the states a skill follows up on: while its target carries one of them, a
tactical AI casts this skill before anything else, ahead of interrupts, support and ordinary
picks. That is how a boss reads a combo off the field: one battler lays a state, another cashes
it in. `aiFollowUpOnly` makes the AI save the skill for that moment: it never comes up in an
ordinary decision, so it is never on cooldown when the moment arrives. Unlike
`<aiSkillExclusion>`, a saved skill stays in the AI's pool. A skill saved this way on an AI
without the tactical trait is never cast.

```
<aiFollowUp:[2090]>
<aiFollowUpOnly>
```
This skill is cast only as a follow-up, and first, whenever its caster's target carries state 2090.

**See also:** `<aiTrait>`, `<aiSkillExclusion>`

---
~~~

**`src/build-tools/notetag-id-targets.js`:** `aiFollowUp: [ { position: 'each', table: 'States' } ],` beside
`passive`. (`verify:notetag-reference` requires it: the heading names `STATE_IDS`.)

**`docs/plugins/abs/core/notetags/enemy-events/ai-traits.md`:** the three sections become:

~~~markdown
### `<aiTrait:careful>`

Careful enemies are more calculating. They avoid skills their target resists, and before attacking they strip a
positive state off their target when one of their skills can remove it: a careful enemy takes your protection away
first. This also amplifies the judgment of other AI traits when combined.

### `<aiTrait:executor>`

Executor enemies pick the skill most effective against their target, and use everything in their arsenal to destroy
you. With `J-ABS-Shield`, an executor facing a raised shield first reaches for a skill that bypasses shields or deals
bonus damage to them.
~~~

~~~markdown
### `<aiTrait:tactical>`

Tactical enemies read the moment. Before anything else they cast a skill that follows up on a state their target
carries (see [AI Follow-Up](../skills/ai-follow-up.md)); failing that, they cut their target's cast with an
`<interrupt>` skill, but only when that cast can be cut. Otherwise they prefer skills that apply states.
~~~

**New page `docs/plugins/abs/core/notetags/skills/ai-follow-up.md`**, exactly (no trailing newline):

~~~markdown
---
type: notetag
title: AI Follow-Up
description: The tags making a tactical AI cast a skill first while its target carries a given state, and save it for that.
tags: [abs, tag, skill, ai]
---

# AI Follow-Up

## Description

Names the states a skill follows up on. While its target carries one of them, an AI with the tactical trait casts this
skill before anything else. One battler lays a state and another cashes it in: a boss's machine paralyzes you, and his
big spell follows.

`<aiFollowUpOnly>` makes the AI save the skill for that moment. It never comes up in an ordinary decision, so it is
never on cooldown when the moment arrives.

## NOTE ABOUT AI SKILL EXCLUSION

`<aiSkillExclusion>` removes a skill from the AI's pool entirely, so it can never be a follow-up either. Use
`<aiFollowUpOnly>` to keep a skill for its follow-up alone.

## NOTE ABOUT THE TACTICAL TRAIT

Only an AI with `<aiTrait:tactical>` looks for follow-ups. A skill saved with `<aiFollowUpOnly>` on any other AI is
never cast.

## TAG USAGE

- Skills

## TAG FORMAT

`<aiFollowUp:[STATE_IDS]>`

`<aiFollowUpOnly>`

## TAG EXAMPLES

`<aiFollowUp:[2090, 4]>`
While its caster's target carries state 2090 or state 4, a tactical AI casts this skill first.

`<aiFollowUp:[2090]>`
`<aiFollowUpOnly>`
This skill is cast only as a follow-up to state 2090.
~~~

**`docs/plugins/abs/core/index.md`:** directly after the `[AI Skill Exclusion]` line (~line 54):

`* [AI Follow-Up](notetags/skills/ai-follow-up.md) - The tags making a tactical AI cast a skill first while its target carries a given state, and save it for that.`

**`docs/plugins/abs/ext/shield/overview.md`:** a new subsection at the end of `## Details`, before
`## Plugin parameters and commands`:

~~~markdown
### Executor AI

An enemy with `<aiTrait:executor>` facing a raised shield first reaches for a skill that bypasses shields
(`<shieldBypass>`) or deals bonus damage to them (`<shieldDamage:[FORMULA]>`), and picks the most effective of those.
Typed shields and typed bypasses are not matched against each other in that choice: any bypass or bonus counts.
~~~

### 8. PR time (not now)

J-ABS minor (new tags, three traits changed), J-ABS-Shield minor; changelogs; restamp both books after reading them.

### 9. Chef Adventure (part of Grudj's build)

Grudj wears `<aiTrait:executor>`, `<aiTrait:careful>` and `<aiTrait:tactical>`. Black Meltima (the saved one) carries
`<aiFollowUp:[SCRAMBLED]>` and `<aiFollowUpOnly>`; the machine's `fallen` reaction `learnSkill`s the twin without
them. His beam carries `<shieldDamage:[...]>`, his seeking bolts `<interrupt:N>`, his void zone removes positive states
(effect code 22 on the states his duo can carry). The hall run logs every decision with its reason.

## Definition of done

- `grep -n "isInterruptible" src/plugins/abs/core/managers/JABS_Engine.js src/plugins/abs/core/models/JABS_AI.js`
  shows both callers; `grep -n "decideTacticalOpening\|decideStrip\|filterForExecutorSkills"
  src/plugins/abs/core/models/JABS_EnemyAI.js` shows the wiring.
- `bun run hotfix` green; coverage 100% on every touched file, the new `_models/JABS_AI.js` included.
- `bun run mutate src/plugins/abs/core/models/JABS_AI.js`, `.../JABS_EnemyAI.js` and
  `src/plugins/abs/ext/shield/_models/JABS_AI.js`: every survivor on the new lines explained.
- In CA's hall: a Scrambled duo draws Black Meltima as the first thing Grudj casts; a cast by Rupert draws a seeking
  bolt with an interrupt (and the cast is cut); a shielded Jerald draws the beam.

## Notes

Built 2026-11-16, test-proven only (nothing in a probe wore these traits). Beyond the plan:

- The leader→follower directive (`decideActionForFollower`) also drops the follower's saved skills, and the tactical
  interrupt is chosen from unsaved skills only, so a saved skill is cast as a follow-up and nothing else. Ally AI
  reads neither tag; the docs say so.
- Two `decideCleansing` tests: with the cleanser's sentinel now 0, a mutant (`isNegative && canBeCleansed` → true)
  survived that the old test only killed through null-vs-0.
- `decideStrip` reaches first for a skill that purges buffs wholesale (`findBuffPurger`: `<purgeStates>` with polarity
  `positive` or `all`), at his "the Void Zone strips ALL buffs. Thats it. It voids your benefits." A target with no
  buff now returns 0 before anything is searched. Tested (100%), no new survivor.

**Hall run 2026-11-16** (`ca/dist/playtest/grudj-hall-probe.js`, run 2): a Scrambled Jerald drew Black Meltima as
the follow-up, first thing, twice; Searing Beam (`<shieldDamage>`) cracked SHIELD; the Void Zone's purge took gun-fu.
Not exercised: an interrupt (the bot never casts with a wind-up). Found: **executor keeps only the single most
elementally effective skill**, so a boss with a varied kit casts one or two skills forever (Grudj: Drowning Spiral
22x, Searing Beam 10x, nothing else). Why: Jerald takes Heat x3, so Searing Beam is honestly his best; careful drops
Seeking Bolt and Stunning Quake (Air and Ground x0.5); and with Beam cooling down, everything left ties at x1 and the
stable sort handed the tie to the first in his action list, Spiral.

**Executor ties, at his 15:47 call** ("He SHOULD be using your weakness. When your weakness is on cooldown however,
the remaining options if all equal, should be equally chosen from, not just the first one in the list."):
`findMostElementallyEffectiveSkill` became `findMostElementallyEffectiveSkills`, keeping every skill tied at the best
rate in the given order, so `decideFromNoneToManySkills` picks evenly among them. Its count guard went: the new body
handles an empty or one-skill list on its own. The element test-cast moved into `elementRateAgainst`, shared with
`filterElementallyIneffectiveSkills`. The J-ABS-Shield alias needs nothing (it narrows the list before the core
judges it). Docs: `ai-traits.md`'s executor section and the glossary's executor line. **Still to weigh with him:**
tactical's filter runs after executor and keeps only skills with an add-state effect (code 21), and RMMZ's "Normal
Attack" add-state (data id 0, which adds nothing to a battler with no attack-state traits) counts, so Grudj's ties
narrow to Spiral and Void Zone; Smite carries none and drops out.

Built and verified the same day: hotfix green (19,861 tests), 100% on `JABS_AI.js`, mutation clean on every new line
(the 4 survivors, lines 129, 424, 503 and 677, are older guards outside the diff). Hall-proven with every decision
logged (`ca/dist/playtest/grudj-decisions-probe.js`, 90 s, 31 decisions): executor handed on real ties (Spiral + Void
Zone + Smite, Spiral + Smite, Void Zone + Smite), Searing Beam alone whenever it was ready, and the picks matched an
even split of the final candidates (Spiral 13 against 11 expected, Void Zone 8/10, Smite 3/3, Beam 5/5). Tactical
dropped Smite from every tie it shared with Spiral or Void Zone. The basic attack never reached executor: it is the
fallback when nothing is castable.

**Tactical leaves an executor's ties alone, at his 18:41 call** ("i choose (a)", against the other option of tactical
counting only states that land): `JABS_EnemyAI.decideAttackAction` runs the executor's judgment, or tactical's
preference for a battler that is no executor, never both. A tactical executor keeps its openings (follow-up, then
interrupt); only the status-skill narrowing steps aside. The executor test now runs with tactical on as well and
asserts the tactical filter is never asked and the pick receives the executor's ties. Docs: the glossary's tactical
line and `ai-traits.md`'s tactical section. hotfix green (19,861), 100% on `JABS_EnemyAI.js`, mutation clean on the
new lines (survivors at 659 and 669 are older healing thresholds outside the diff). Hall re-logged (90 s, 35
decisions): tactical never ran for Grudj, and Smite won ties it used to lose (Spiral 12 picks against 11.7 expected
from an even split, Searing Beam 6/6, Void Zone 10/8.2, Smite 3/5.2).

**Watch in Grudj's hall:** `states()` holds applied states only (J-Passive's live in `allStates()`), so a strip never
targets a passive. But a J-Passive-Conditional auto-rule re-applies its state, so a buff stripped off one comes back:
watch whether Grudj keeps spending casts re-stripping it.
