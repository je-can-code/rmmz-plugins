//region Game_Action
import OverlayManager from './../managers/OverlayManager.js';

/**
 * Overwrites {@link #setSkill}.<br/>
 * If a caster is available to this action, then update the udnerlying skill with
 * the overlayed skill instead.
 */
J.EXTEND.Aliased.Game_Action.set('setSkill', Game_Action.prototype.setSkill);
Game_Action.prototype.setSkill = function(skillId)
{
  // check if we are missing a caster.
  if (!this.subject())
  {
    // perform original logic.
    J.EXTEND.Aliased.Game_Action.get('setSkill')
      .call(this, skillId);

    // stop processing.
    return;
  }

  // build the extended skill.
  const skillToSet = OverlayManager.getExtendedSkill(this.subject(), skillId);

  // assign the overlayed skill to the object instead.
  this.rawItem().setObject(skillToSet);
};

/**
 * Overwrites {@link #setItemObject}.<br/>
 * If a caster is available to this action, then update the underlying item with the data.
 */
J.EXTEND.Aliased.Game_Action.set('setItemObject', Game_Action.prototype.setItemObject);
Game_Action.prototype.setItemObject = function(itemObject)
{
  // check if we are missing a caster.
  if (!this.subject())
  {
    // perform original logic.
    J.EXTEND.Aliased.Game_Action.get('setItemObject')
      .call(this, itemObject);

    // stop processing.
    return;
  }

  // TODO: sort out how to manage this when both skills AND items come through this way.
  this.rawItem().setObject(itemObject);
};

/**
 * Extends {@link #apply}.<br/>
 * Also applies on-hit states.<br/>
 * The `<applyStateWhenAfflicted>` family is judged before the original logic runs. The hit's own state effects land
 * inside it, so a target judged afterwards would already carry a state this very hit just gave it, and a gate meant to
 * reward an earlier affliction would pass on the first hit every time.
 */
J.EXTEND.Aliased.Game_Action.set('apply', Game_Action.prototype.apply);
Game_Action.prototype.apply = function(target)
{
  // judge the afflicted-gated states against the target as it stands before this hit lands anything.
  const afflictedGatedStates = this.whenAfflictedApplyStatesAgainst(target);

  // perform original logic.
  J.EXTEND.Aliased.Game_Action.get('apply')
    .call(this, target);

  // apply our on-hit self-states if we have any.
  this.applyOnHitStateEffects(target, afflictedGatedStates);
};

/**
 * Applies all on-hit state modifications, such as adding or removing states to self or the target.
 * @param {Game_Actor|Game_Enemy} target The target being hit with the action.
 * @param {[number, number, number][]} afflictedGatedStates The `<applyStateWhenAfflicted>` entries the target
 * qualified for before the hit landed, as `[stateId, necessaryStateId, chance]`.
 */
Game_Action.prototype.applyOnHitStateEffects = function(target, afflictedGatedStates)
{
  // if we cannot apply on-hit state effects, then do not.
  if (this.canApplyOnHitStateEffects(target) === false) return;

  // the self-states this hit carries roll with the roller its rolls against the struck battler get.
  const struckRoller = this.chanceRollerAgainst(target);

  // apply our on-hit self-states if we have any.
  this.applyOnHitSelfStates(struckRoller);

  // apply our on-hit lose-states if we have any.
  this.applyOnHitLoseStates(struckRoller);

  // apply our on-hit apply-states (with optional duration/stack overrides) if we have any.
  this.applyOnHitApplyStates(target);

  // apply our on-hit afflicted-gated states, the ones the target qualified for before the hit landed.
  this.applyOnHitWhenAfflictedStates(target, afflictedGatedStates);

  // apply our on-hit strip-states if we have any.
  this.applyOnHitStripStates(target);

  // apply our on-hit remove-states if we have any.
  this.applyOnHitRemoveStates(target);
};

/**
 * Determines whether or not the on-hit state effects can apply.
 * @param {Game_Actor|Game_Enemy}target
 */
Game_Action.prototype.canApplyOnHitStateEffects = function(target)
{
  // if the target wasn't actually hit, then we can't apply on-hit state effects.
  if (target.result()
    .isHit() === false)
  {
    return false;
  }

  // apply the state effects!
  return true;
};

/**
 * Applies all applicable on-hit self states.<br/>
 * They roll with the roller this hit's rolls against the struck battler get, so whatever guarantees those rolls,
 * such as a critical hit with `<forceCritProcs>`, guarantees these too.
 * @param {Game_Battler|object} positiveRoller Whose fate overrides, Accumulate Mode and Encore count the landings.
 */
Game_Action.prototype.applyOnHitSelfStates = function(positiveRoller)
{
  // apply all on-hit states to oneself.
  this.applyStates(this.subject(), this.onHitSelfStates(), positiveRoller);
};

/**
 * Gets all possible states that could be self-inflicted when this skill hits a target.
 * @returns {JABS_OnChanceEffect[]}
 */
Game_Action.prototype.onHitSelfStates = function()
{
  // grab all the self-state sources.
  const sources = this.reactiveStateSources();

  // get all "skill chances" aka "chance to inflict a state" on oneself.
  const stateChances = RPGManager.getOnChanceEffectsFromDatabaseObjects(sources, J.EXTEND.RegExp.OnHitSelfState);

  // return what we found.
  return stateChances;
};

/**
 * Removes all applicable on-hit lose states.<br/>
 * They roll with the roller this hit's rolls against the struck battler get, the same as the on-hit self states.
 * @param {Game_Battler|object} positiveRoller Whose fate overrides settle each roll.
 */
Game_Action.prototype.applyOnHitLoseStates = function(positiveRoller)
{
  // lose all on-hit states from oneself.
  this.loseStates(this.subject(), this.onHitLoseStates(), positiveRoller);
};

/**
 * Gets all possible states that could be self-lost when this skill hits a target.
 * @returns {JABS_OnChanceEffect[]}
 */
Game_Action.prototype.onHitLoseStates = function()
{
  // grab all the self-state sources.
  const sources = this.reactiveStateSources();

  // get all "skill chances" aka "chance to inflict a state" on oneself.
  const stateChances = RPGManager.getOnChanceEffectsFromDatabaseObjects(sources, J.EXTEND.RegExp.OnHitLoseState);

  // return what we found.
  return stateChances;
};

/**
 * Applies all applicable on-hit state stripping.
 * @param {Game_Actor|Game_Enemy} target The target being hit with the action.
 */
Game_Action.prototype.applyOnHitStripStates = function(target)
{
  // strip all on-hit states from the target.
  this.stripStates(target, this.onHitStripStates());
};

/**
 * Gets all possible states that could lose a single stack from the target when it hits.
 * @returns {JABS_OnChanceEffect[]}
 */
Game_Action.prototype.onHitStripStates = function()
{
  // grab all the sources.
  const sources = this.reactiveStateSources();

  // get all "skill chances" aka "chance to strip a state stack" on the target.
  const stateChances = RPGManager.getOnChanceEffectsFromDatabaseObjects(sources, J.EXTEND.RegExp.OnHitStripState);

  // return what we found.
  return stateChances;
};

/**
 * Applies all applicable on-hit full state removals.
 * @param {Game_Actor|Game_Enemy} target The target being hit with the action.
 */
Game_Action.prototype.applyOnHitRemoveStates = function(target)
{
  // remove all on-hit states from the target.
  this.removeStates(target, this.onHitRemoveStates());
};

/**
 * Gets all possible states that could be fully removed from the target when it hits.
 * @returns {JABS_OnChanceEffect[]}
 */
Game_Action.prototype.onHitRemoveStates = function()
{
  // grab all the sources.
  const sources = this.reactiveStateSources();

  // get all "skill chances" aka "chance to remove a state" on the target.
  const stateChances = RPGManager.getOnChanceEffectsFromDatabaseObjects(sources, J.EXTEND.RegExp.OnHitRemoveState);

  // return what we found.
  return stateChances;
};

/**
 * Applies all on-hit apply-states to the target, drawing from two sources:
 * the executing skill ({@code <thisApplyState>}) and the caster's full notes
 * ({@code <applyState>}). Caster-wide entries fire first; skill-scoped entries
 * fire second and win on any same-state conflict via force-replace semantics.
 *
 * Each entry rolls on its own, as this action's state roll through {@link #resolveStateProcCountAgainst}: the
 * authored percent meets the target's State Rate traits and {@code <stateTypeResist>}, then the luck between the
 * caster and the target, and then this action's fate decides how many times it lands. Every landing carries the
 * entry's {@link JABS_StateOverrides} to {@link Game_Battler#addStateWithOverrides}, so Accumulate Mode and Encore
 * land the authored duration and stacks each time, and the target's immunities are checked on each one inside
 * {@link Game_Battler#handleAddingJabsState}.
 * @param {Game_Actor|Game_Enemy} target The target being hit with the action.
 */
Game_Action.prototype.applyOnHitApplyStates = function(target)
{
  // grab caster-wide applyState entries from all of the attacker's notes. each
  // <applyState:[...]> tag is a single bracket, so it parses directly into a tuple.
  const notes = this.subject()
    .getAllNotes();

  const casterEntries = RPGManager.getArraysFromAllNotesByRegex(notes, J.EXTEND.RegExp.ApplyState);

  // grab skill-scoped thisApplyState entries from the executing skill only.
  const skillEntries = RPGManager.getArraysFromNotesByRegex(this.item(), J.EXTEND.RegExp.ThisApplyState);

  // combine both lists; caster-wide fires first, skill-scoped fires last and wins conflicts.
  const allEntries = [...casterEntries, ...skillEntries];

  // if there are no entries from either source, there is nothing to do.
  if (!allEntries.length) return;

  // grab the attacker for attribution when tracking the applied state.
  const attacker = this.subject();

  // iterate over every entry and conditionally apply.
  allEntries.forEach(([stateId, chance, duration = null, stacks = null]) =>
  {
    // roll the authored percent against the target's resistances, the luck between the two battlers and this
    // action's fate; the count is how many times the state lands on this hit, and zero means it never did.
    const procCount = this.resolveStateProcCountAgainst(target, stateId, chance);

    // build the overrides object from whatever the tag provided; every landing carries the same one.
    const overrides = new JABS_StateOverrides(duration, stacks);

    // apply the state to the target once per landing with the overrides; immunity is checked on each one inside.
    for (let i = 0; i < procCount; i++)
    {
      target.addStateWithOverrides(stateId, attacker, overrides, this.item());
    }
  });
};

/**
 * Gets every afflicted-gated apply-state this action carries, drawing from the same two places
 * {@link #applyOnHitApplyStates} does: the caster's full notes ({@code <applyStateWhenAfflicted>}) and the executing
 * skill ({@code <thisApplyStateWhenAfflicted>}). Caster-wide entries come first and skill-scoped entries last, the
 * order those two land their own variants in. Each entry is a `[stateId, necessaryStateId, chance]` tuple.
 * @returns {[number, number, number][]}
 */
Game_Action.prototype.whenAfflictedApplyStates = function()
{
  // caster-wide entries come from every note source the caster carries: equipment, states, skills and the rest.
  const notes = this.subject()
    .getAllNotes();

  const casterEntries = RPGManager.getArraysFromAllNotesByRegex(notes, J.EXTEND.RegExp.ApplyStateWhenAfflicted);

  // skill-scoped entries come from the executing skill alone.
  const skillEntries = RPGManager.getArraysFromNotesByRegex(this.item(), J.EXTEND.RegExp.ThisApplyStateWhenAfflicted);

  // caster-wide first, skill-scoped last.
  return [ ...casterEntries, ...skillEntries ];
};

/**
 * Gets the afflicted-gated apply-states the target qualifies for right now: the ones whose necessary state it is
 * currently afflicted with.<br/>
 * {@link #apply} asks this before the hit lands anything, so a necessary state the hit itself is about to add never
 * counts. Whoever put the necessary state there does not matter, only that it was already there. Each entry is a
 * `[stateId, necessaryStateId, chance]` tuple.
 * @param {Game_Actor|Game_Enemy} target The battler about to be hit.
 * @returns {[number, number, number][]}
 */
Game_Action.prototype.whenAfflictedApplyStatesAgainst = function(target)
{
  // keep only the entries whose necessary state the target already carries.
  return this.whenAfflictedApplyStates()
    .filter(([ , necessaryStateId ]) => target.isStateAffected(necessaryStateId));
};

/**
 * Applies the afflicted-gated apply-states the target qualified for before the hit landed.<br/>
 * Each entry rolls as this action's state roll through {@link #resolveStateProcCountAgainst}, the same roll an
 * {@code <applyState>} entry makes: the authored percent meets the target's State Rate traits and
 * {@code <stateTypeResist>}, then, for a harmful state, the luck between the caster and the target, and then this
 * action's fate decides how many times it lands. Every landing adds the state through {@link Game_Battler#addState},
 * attributed to the caster with the executing skill as its source, so the target's immunities are checked on each one.
 * @param {Game_Actor|Game_Enemy} target The battler that was hit.
 * @param {[number, number, number][]} qualifyingEntries The entries the target qualified for before the hit landed,
 * as `[stateId, necessaryStateId, chance]`.
 */
Game_Action.prototype.applyOnHitWhenAfflictedStates = function(target, qualifyingEntries)
{
  // the caster applies every state, and the skill being executed is the source each one records.
  const attacker = this.subject();
  const skill = this.item();

  // roll for each qualifying entry on its own.
  qualifyingEntries.forEach(([ stateId, , chance ]) =>
  {
    // the count is how many times the state lands on this hit, and zero means it never did.
    const procCount = this.resolveStateProcCountAgainst(target, stateId, chance);

    // apply the state once per landing; immunity is checked on each one inside.
    for (let i = 0; i < procCount; i++)
    {
      target.addState(stateId, attacker, skill);
    }
  });
};

/**
 * Extends {@link #applyItemUserEffect}.<br/>
 * Also applies on-cast target-affecting states (strip/remove).
 * On-cast self states (self/lose) fire once at press-time instead, through this plugin's extension of
 * {@link JABS_Engine#handleOnCastStateEffects}.
 */
J.EXTEND.Aliased.Game_Action.set('applyItemUserEffect', Game_Action.prototype.applyItemUserEffect);
Game_Action.prototype.applyItemUserEffect = function(target)
{
  // perform original logic.
  J.EXTEND.Aliased.Game_Action.get('applyItemUserEffect')
    .call(this, target);

  // apply our on-cast strip-states if we have any.
  this.applyOnCastStripStates(target);

  // apply our on-cast remove-states if we have any.
  this.applyOnCastRemoveStates(target);
};

/**
 * Toggles all {@code <toggleOnExecute:STATE_ID>} states on the caster: for each tagged state id,
 * removes it if the caster currently has it, or adds it if they don't. Fires once at press-time
 * (see this plugin's extension of {@link JABS_Engine#handleOnCastStateEffects}), same as the on-cast
 * self-state family below.
 * There is no chance roll; this always triggers when the skill executes.
 */
Game_Action.prototype.applyToggleOnExecuteStates = function()
{
  // grab the caster; this is a self-only toggle, so the caster is always both actor and target.
  const caster = this.subject();

  // toggle each tagged state independently.
  this.toggleOnExecuteStateIds()
    .forEach(stateId =>
    {
      // if the caster already has this state, toggling it off means removing it.
      if (caster.isStateAffected(stateId))
      {
        caster.removeState(stateId);
      }
      // otherwise, toggling it on means adding it, attributed to the caster.
      else
      {
        caster.addState(stateId, caster);
      }
    });
};

/**
 * Gets all state ids tagged with {@code <toggleOnExecute:STATE_ID>} on the executing skill.
 * Skill-scoped only; a skill may carry multiple tags to toggle multiple states in one execution.
 * @returns {number[]}
 */
Game_Action.prototype.toggleOnExecuteStateIds = function()
{
  // this tag is skill-scoped, so only the executing skill's own note is read.
  // getNumbersFromNoteByRegex is the wrong tool here- it expects a single bracketed
  // list capture (e.g. <passive:[1,2,3]>), but this tag captures one bare number per
  // repeated line, so getStringsFromNoteByRegex (which correctly collects one entry
  // per matching line rather than overwriting) is what actually matches this shape.
  return RPGManager.getStringsFromNoteByRegex(this.item(), J.EXTEND.RegExp.ToggleOnExecute)
    .map(Number);
};

/**
 * Cycles all {@code <toggleGroupOnExecute:[STATE_ID, ...]>} groups on the caster: for each
 * tagged group, advances the caster from whichever state in the group is currently active to
 * the next one in the list, wrapping back to the first after the last. Fires once at
 * press-time, same as {@link #applyToggleOnExecuteStates}.
 */
Game_Action.prototype.applyToggleGroupOnExecuteStates = function()
{
  // grab the caster; this is a self-only toggle, same as the scalar form above.
  const caster = this.subject();

  // cycle each tagged group independently.
  this.toggleGroupOnExecuteGroups()
    .forEach(group =>
    {
      // find every id in this group the caster currently has active.
      const activeIds = group.filter(stateId => caster.isStateAffected(stateId));

      // remove whatever is currently active before adding the next one- this covers the
      // "exactly one active" case as well as the "somehow more than one active" repair case,
      // since removing zero, one, or many ids all funnel through the same call.
      activeIds.forEach(stateId => caster.removeState(stateId));

      // with none active (a fresh group) or exactly one active, the next id to add is the
      // one immediately after the (single) active id, wrapping to the front of the list.
      // with more than one active (a corrupted group), skip the wrap logic entirely and
      // resync straight to the first id in the list.
      let nextId;
      if (activeIds.length === 1)
      {
        // find where the currently-active id sits in the group's ordering.
        const currentIndex = group.indexOf(activeIds[0]);

        // step forward one slot, wrapping back to 0 once we'd run past the last index.
        const nextIndex = (currentIndex + 1) % group.length;

        // that wrapped index is the one we advance to.
        nextId = group[nextIndex];
      }
      else
      {
        // zero or 2+ active: resync straight to the first id in the list.
        [ nextId ] = group;
      }

      // add the resolved next id, attributed to the caster.
      caster.addState(nextId, caster);
    });
};

/**
 * Gets all cycle groups tagged with {@code <toggleGroupOnExecute:[STATE_ID, ...]>} on the
 * executing skill. Skill-scoped only; a skill may carry multiple tags to cycle multiple
 * independent groups in one execution.
 * @returns {number[][]}
 */
Game_Action.prototype.toggleGroupOnExecuteGroups = function()
{
  // this tag is skill-scoped, so only the executing skill's own note is read.
  return RPGManager.getArraysFromNotesByRegex(this.item(), J.EXTEND.RegExp.ToggleGroupOnExecute);
};

/**
 * Applies all applicable on-cast self states.
 */
Game_Action.prototype.applyOnCastSelfStates = function()
{
  // apply all self-inflictable states to oneself.
  this.applyStates(this.subject(), this.onCastSelfStates());
};

/**
 * Applies all applicable on-cast lose states.
 */
Game_Action.prototype.applyOnCastLoseStates = function()
{
  // lose all self-removable states from oneself.
  this.loseStates(this.subject(), this.onCastLoseStates());
};

/**
 * Applies conditional on-cast self-states that require the caster to already have a specific state.
 * Reads from the skill note and the caster's active states.
 * Each tag is [STATE_TO_APPLY, CHANCE, STATE_REQUIREMENT]; the state is applied only when the
 * caster is currently afflicted with STATE_REQUIREMENT.
 */
Game_Action.prototype.applyOnCastSelfStatesIfAfflicted = function()
{
  // grab the caster for affliction checks and state application.
  const caster = this.subject();

  // gather all sources that could carry this tag: the skill itself and the caster's active states.
  const sources = this.reactiveStateSources();

  // collect every [stateToApply, chance, stateRequirement] triple across all sources.
  const allArrays = sources.flatMap(source =>
    RPGManager.getArraysFromNotesByRegex(source, J.EXTEND.RegExp.OnCastSelfStateIfAfflicted) ?? []
  );

  // nothing to do if no tags were found.
  if (allArrays.length === 0) return;

  // build a JABS_OnChanceEffect for each tag that passes the affliction gate, then apply them
  // all through applyStates so the JABS engine registers the tracker (required for HUD display).
  const effects = allArrays
    .filter(([ , , stateRequirement ]) => caster.isStateAffected(stateRequirement))
    .map(([ stateToApply, chance ]) =>
      new JABS_OnChanceEffect(stateToApply, chance, J.EXTEND.RegExp.OnCastSelfStateIfAfflicted.toString())
    );

  // apply any qualifying effects through the JABS path so they appear in the HUD.
  this.applyStates(caster, effects);
};

/**
 * Applies all applicable on-cast state stripping.
 * @param {Game_Actor|Game_Enemy} target The target the casted action will affect.
 */
Game_Action.prototype.applyOnCastStripStates = function(target)
{
  // strip all removable state stacks from a target.
  this.stripStates(target, this.onCastStripStates());
};

/**
 * Applies all applicable on-cast full state removals.
 * @param {Game_Actor|Game_Enemy} target The target the casted action will affect.
 */
Game_Action.prototype.applyOnCastRemoveStates = function(target)
{
  // apply all removable states to a target.
  this.removeStates(target, this.onCastRemoveStates());
};

/**
 * Maximum nesting depth permitted for {@code <onCastExecuteSkill>} chains.
 * A forced skill's own tag is allowed to trigger one further hop before being cut off, guarding
 * against an authoring mistake (or a deliberately cyclic pair of skills) looping forever.
 * @type {number}
 */
const ON_CAST_EXECUTE_SKILL_MAX_DEPTH = 2;

/**
 * Current nesting depth of in-flight {@code <onCastExecuteSkill>} dispatches.
 * @type {number}
 */
let onCastExecuteSkillDepth = 0;

/**
 * Gets all skills that should be force-executed when casting this skill, alongside their
 * individual roll chances. Skill-scoped and repeatable — a skill may carry several
 * {@code <onCastExecuteSkill>} tags, each collected and rolled independently.
 * @returns {[number, number][]} Tuples of `[skillId, chance]`.
 */
Game_Action.prototype.onCastExecuteSkills = function()
{
  // this tag is skill-scoped, so only the executing skill's own note is read.
  return RPGManager.getArraysFromNotesByRegex(this.item(), J.EXTEND.RegExp.OnCastExecuteSkill) ?? [];
};

/**
 * Rolls and force-executes a batch of already-gated `[skillId, chance]` payloads through JABS,
 * sharing the single depth guard between both the unconditional and state-gated
 * {@code onCastExecuteSkill} families so a mixed chain still can't loop forever.<br/>
 * Each payload rolls once, by the caster, through {@link Game_Action#rollOnCastExecuteSkill}, and a payload whose
 * roll lands is force-executed once.
 * @param {Game_Action} action The action being cast, whose caster rolls for every payload.
 * @param {[number, number][]} payloads Tuples of `[skillId, chance]` that have already passed
 * whatever gate (if any) applies to their source tag.
 * @param {JABS_Battler} caster The JABS battler executing this cast.
 */
function dispatchOnCastExecuteSkillPayloads(action, payloads, caster)
{
  // nothing to do if no tags were found.
  if (payloads.length === 0) return;

  // bail out once nesting gets too deep- a forced skill's own onCastExecuteSkill tag would
  // otherwise be able to re-trigger this same chain indefinitely.
  if (onCastExecuteSkillDepth >= ON_CAST_EXECUTE_SKILL_MAX_DEPTH) return;

  // track this dispatch on the depth stack for the duration of the forced executions below.
  onCastExecuteSkillDepth += 1;

  try
  {
    // roll each payload independently and force-execute the skill on success.
    payloads.forEach(([skillId, chance]) =>
    {
      // skip the payload entirely when the caster's roll fails; nothing to execute this tag this cast.
      if (action.rollOnCastExecuteSkill(chance) === false) return;

      // force the payload skill onto the map as a real, independent action, once.
      $jabsEngine.forceMapAction(caster, skillId, false);
    });
  }
  finally
  {
    // always unwind the depth counter, even if a forced execution threw partway through.
    onCastExecuteSkillDepth -= 1;
  }
}

/**
 * Rolls whether one {@code <onCastExecuteSkill>} or {@code <onCastExecuteSkillIfAfflicted>} payload executes on this
 * cast.<br/>
 * The caster rolls the payload's authored percent with its own fate alone, as it carries it with the skill being
 * cast: one chance plus its lucky rolls, then its cursed rolls as hurdles the roll has to clear, the skill's own
 * {@code <thisLuckyRolls>} and {@code <thisCursedRolls>} joining its battler-wide totals. Nothing is aimed at anyone
 * yet, so no resistance and no other battler's fate weighs on it. The caster's {@code <veryLucky>} executes the
 * payload every time, even at 0%, and its {@code <veryCursed>} never does, even at 100%.<br/>
 * The answer is a single yes or no: a payload whose roll lands executes once, and Accumulate Mode and Encore never
 * repeat it.
 * @param {number} chance The payload's authored chance, as a percent from 0 to 100.
 * @returns {boolean}
 */
Game_Action.prototype.rollOnCastExecuteSkill = function(chance)
{
  // the caster rolls for its own payload.
  const caster = this.subject();

  // the caster's own fate with the skill being cast: its chances, then the hurdles it has to clear.
  const [ positiveRolls, negativeRolls ] = JABS_Fate.ownRolls(caster, this.item());

  // one roll, which the caster's own fate overrides settle before any dice are thrown.
  return RPGManager.fateOf100(caster, chance, positiveRolls, negativeRolls);
};

/**
 * Force-executes every qualifying {@code <onCastExecuteSkill>} payload through JABS, exactly once
 * at the moment of press. Each tag rolls its own chance independently, with the caster's own fate,
 * through {@link #rollOnCastExecuteSkill}, so a single cast can chain into several follow-up skills
 * at once.
 * @param {JABS_Battler} caster The JABS battler executing this cast.
 */
Game_Action.prototype.applyOnCastExecuteSkills = function(caster)
{
  // grab every authored payload tuple from the executing skill and dispatch them, unconditionally.
  dispatchOnCastExecuteSkillPayloads(this, this.onCastExecuteSkills(), caster);
};

/**
 * Gets all state-gated skills that should be force-executed when casting this skill, alongside
 * their individual roll chances. Reads {@code <onCastExecuteSkillIfAfflicted>} from the executing
 * skill's own note only ({@code this.item()}), same skill-scoped rule as its unconditional sibling.
 * @returns {[number, number, number][]} Tuples of `[skillId, chance, stateRequirement]`.
 */
Game_Action.prototype.onCastExecuteSkillsIfAfflicted = function()
{
  // this tag is skill-scoped, so only the executing skill's own note is read.
  return RPGManager.getArraysFromNotesByRegex(this.item(), J.EXTEND.RegExp.OnCastExecuteSkillIfAfflicted) ?? [];
};

/**
 * Force-executes every qualifying {@code <onCastExecuteSkillIfAfflicted>} payload through JABS,
 * exactly once at the moment of press, but only for tags whose required state is currently active
 * on the caster. Lets a skill fire one of several possible payloads depending on which state the
 * caster is carrying, without ever rolling or executing the ones that don't apply. A payload that
 * qualifies rolls exactly as its unconditional sibling does, through {@link #rollOnCastExecuteSkill}.
 * @param {JABS_Battler} caster The JABS battler executing this cast.
 */
Game_Action.prototype.applyOnCastExecuteSkillsIfAfflicted = function(caster)
{
  // grab the underlying battler for the affliction check below.
  const subject = this.subject();

  // gather every authored [skillId, chance, stateRequirement] triple from the executing skill.
  const allTriples = this.onCastExecuteSkillsIfAfflicted();

  // keep only the tags whose required state is currently active on the caster, then drop the
  // now-redundant requirement slot so the shared dispatcher gets plain [skillId, chance] tuples.
  const qualifyingPayloads = allTriples
    .filter(([ , , stateRequirement ]) => subject.isStateAffected(stateRequirement))
    .map(([ skillId, chance ]) => [ skillId, chance ]);

  // dispatch whatever survived the affliction gate through the shared roll-and-execute path.
  dispatchOnCastExecuteSkillPayloads(this, qualifyingPayloads, caster);
};

/**
 * Gets all possible states that could be self-inflicted when casting this skill.
 * @returns {JABS_OnChanceEffect[]}
 */
Game_Action.prototype.onCastSelfStates = function()
{
  // grab all the self-state sources.
  const sources = this.reactiveStateSources();

  // get all "skill chances" aka "chance to inflict a state" on oneself.
  const stateChances = RPGManager.getOnChanceEffectsFromDatabaseObjects(sources, J.EXTEND.RegExp.OnCastSelfState);

  // return what we found.
  return stateChances;
};

/**
 * Gets all possible states that could be self-removed when casting this skill.
 * @returns {JABS_OnChanceEffect[]}
 */
Game_Action.prototype.onCastLoseStates = function()
{
  // grab all the sources.
  const sources = this.reactiveStateSources();

  // get all "skill chances" aka "chance to lose a state" on oneself.
  const stateChances = RPGManager.getOnChanceEffectsFromDatabaseObjects(sources, J.EXTEND.RegExp.OnCastLoseState);

  // return what we found.
  return stateChances;
};

/**
 * Gets all possible states that could lose a single stack from the target when casting this skill.
 * @returns {JABS_OnChanceEffect[]}
 */
Game_Action.prototype.onCastStripStates = function()
{
  // grab all the self-state sources.
  const sources = this.reactiveStateSources();

  // get all "skill chances" aka "chance to strip a state stack" on the target.
  const stateChances = RPGManager.getOnChanceEffectsFromDatabaseObjects(sources, J.EXTEND.RegExp.OnCastStripState);

  // return what we found.
  return stateChances;
};

/**
 * Gets all possible states that could be fully removed from the target when casting this skill.
 * @returns {JABS_OnChanceEffect[]}
 */
Game_Action.prototype.onCastRemoveStates = function()
{
  // grab all the self-state sources.
  const sources = this.reactiveStateSources();

  // get all "skill chances" aka "chance to remove a state" on the target.
  const stateChances = RPGManager.getOnChanceEffectsFromDatabaseObjects(sources, J.EXTEND.RegExp.OnCastRemoveState);

  // return what we found.
  return stateChances;
};

/**
 * All sources to derive self-applied states from.
 * @returns {(RPG_UsableItem|RPG_State)[]}
 */
Game_Action.prototype.reactiveStateSources = function()
{
  // define the sources for this action.
  const sources = [
    // this action itself is a source (the underlying item/skill).
    this.item(),

    // the caster's states also apply as a source.
    ...this.subject()
      .allStates(),
  ];

  // return what we found.
  return sources;
};

/**
 * Applies the given chance-based states to the target, which is the caster itself for every on-hit and on-cast
 * self-state.<br/>
 * Each state rolls as this action's state roll through {@link #resolveStateProcCountAgainst}: the effect's authored
 * percent meets the target's own State Rate traits and {@code <stateTypeResist>}, then, for a harmful state, the luck
 * between the caster and the target, and then this action's fate decides how many times it lands. A caster giving
 * itself a state holds no luck over itself and brings its fate once. Every landing adds the state through
 * {@link Game_Battler#addState},
 * attributed to the caster, so Accumulate Mode and Encore can land it more than once and the target's immunities are
 * checked on each one.<br/>
 * Each landing records the skill being executed as the state's source skill, the way a skill's own state effect does.
 * The effect names a state, never a skill, so a skill looked up by that id would be an unrelated row at best- and that
 * row is what the state's slip amplification, spreading and expiry would go on to read.
 * @param {Game_Actor|Game_Enemy} target The battler receiving the states; the caster itself for a self-state.
 * @param {JABS_OnChanceEffect[]} jabsOnChanceEffects The states to roll for, each naming its state and percent chance.
 * @param {Game_Battler|object|null=} positiveRoller Whose fate overrides, Accumulate Mode and Encore count the
 * landings; null, the default, leaves it to {@link #chanceRollerAgainst}.
 */
Game_Action.prototype.applyStates = function(target, jabsOnChanceEffects, positiveRoller = null)
{
  // if there are no effects, don't bother.
  if (jabsOnChanceEffects.length === 0) return;

  // the caster applies every state, and the skill being executed is the source each one records.
  const attacker = this.subject();
  const skill = this.item();

  // iterate over each of them and see if we should apply them.
  jabsOnChanceEffects.forEach(jabsOnChanceEffect =>
  {
    // the effect names the state to apply and authors its chance as a percent.
    const { skillId: stateId, chance } = jabsOnChanceEffect;

    // roll the chance against the target's own resistances with this action's fate; zero means it never landed.
    const procCount = this.resolveStateProcCountAgainst(target, stateId, chance, positiveRoller);

    // apply the given state once per landing, with the caster as the attacker and the executing skill as its source.
    for (let i = 0; i < procCount; i++)
    {
      target.addState(stateId, attacker, skill);
    }
  });
};

/**
 * Rolls whether an on-chance state removal lands on the target: one stack lost or stripped, or the whole state
 * removed.<br/>
 * A removal meets no resistances. Its authored percent rolls with this action's fate against the target, as
 * {@link #fateRollsAgainst} describes: a removal aimed at the caster's opponents is harm, so a cursed foe gives it one
 * more chance to land for every curse it carries, while a removal aimed at anyone else is help, and has to clear
 * every curse its target carries. A caster removing its own state brings its fate once. The roller's
 * {@code <veryLucky>} and {@code <veryCursed>} settle the roll outright; that is the caster, unless
 * {@link #chanceRollerAgainst} or the caller hands over a stand-in that guarantees it. A state carrying
 * {@code <immuneToFate>}, as the target sees it, comes off on one plain roll instead, with no one's fate weighing in.
 * @param {Game_Actor|Game_Enemy} target The battler losing the state; the caster itself for a lose-state.
 * @param {JABS_OnChanceEffect} jabsOnChanceEffect The removal to roll, naming the state and its percent chance.
 * @param {Game_Battler|object|null=} positiveRoller Whose fate overrides settle the roll; null, the default, leaves it
 * to {@link #chanceRollerAgainst}.
 * @returns {boolean}
 */
Game_Action.prototype.rollStateRemovalAgainst = function(target, jabsOnChanceEffect, positiveRoller = null)
{
  // a state immune to fate comes off on one plain roll, with no one's fate weighing in.
  const state = target.state(jabsOnChanceEffect.skillId);
  if (state.isImmuneToFate()) return RPGManager.chanceIn100(jabsOnChanceEffect.chance);

  // the chances this action's fate gives the removal to land on the target, then the hurdles it has to clear.
  const [ positiveRolls, negativeRolls ] = this.fateRollsAgainst(target);

  // a caller's own roller wins; otherwise this action names the roller for its rolls against the target.
  const roller = positiveRoller ?? this.chanceRollerAgainst(target);

  // roll the dice, letting the roller's fate overrides settle it first.
  return jabsOnChanceEffect.shouldTrigger(positiveRolls, negativeRolls, roller);
};

/**
 * Loses the given states from the target, each on its own roll through {@link #rollStateRemovalAgainst}.
 * Each one that lands consumes a single stack of its state, through {@link #loseState}.
 * @param {Game_Actor|Game_Enemy} target The target to lose states from; the caster itself for a lose-state.
 * @param {JABS_OnChanceEffect[]} jabsOnChanceEffects The various states to potentially lose.
 * @param {Game_Battler|object|null=} positiveRoller Whose fate overrides settle each roll; null, the default, leaves
 * it to {@link #chanceRollerAgainst}.
 */
Game_Action.prototype.loseStates = function(target, jabsOnChanceEffects, positiveRoller = null)
{
  // if there are no effects, don't bother.
  if (jabsOnChanceEffects.length === 0) return;

  // iterate over each of them and see if we should lose them.
  jabsOnChanceEffects.forEach(jabsOnChanceEffect =>
  {
    // roll the dice with this action's fate against the target to see if the on-chance effect applies.
    if (this.rollStateRemovalAgainst(target, jabsOnChanceEffect, positiveRoller))
    {
      // lose the given state from the target.
      this.loseState(target, jabsOnChanceEffect.skillId);
    }
  });
};

/**
 * Strips the given states from the target, each on its own roll through {@link #rollStateRemovalAgainst}.
 * Each one that lands consumes a single stack of its state, through {@link #stripState}.
 * @param {Game_Actor|Game_Enemy} target The target to strip states from.
 * @param {JABS_OnChanceEffect[]} jabsOnChanceEffects The various states to potentially strip.
 */
Game_Action.prototype.stripStates = function(target, jabsOnChanceEffects)
{
  // if there are no effects, don't bother.
  if (jabsOnChanceEffects.length === 0) return;

  // iterate over each of them and see if we should strip them.
  jabsOnChanceEffects.forEach(jabsOnChanceEffect =>
  {
    // roll the dice with this action's fate against the target to see if the on-chance effect applies.
    if (this.rollStateRemovalAgainst(target, jabsOnChanceEffect))
    {
      // strip the given state from the target.
      this.stripState(target, jabsOnChanceEffect.skillId);
    }
  });
};

/**
 * Loses a single stack of the given state from the target.<br/>
 * J-ABS decrements the stack it tracks, and removes the state once its last stack is gone.
 * @param {Game_Actor|Game_Enemy} target The target losing the state.
 * @param {number} stateId The id of the state to lose.
 */
Game_Action.prototype.loseState = function(target, stateId)
{
  // consume a single stack of the state.
  target.decrementStateStacks(stateId);
};

/**
 * Strips a single stack of the given state from the target.<br/>
 * J-ABS decrements the stack it tracks, and removes the state once its last stack is gone.
 * @param {Game_Actor|Game_Enemy} target The target losing the state.
 * @param {number} stateId The id of the state to strip.
 */
Game_Action.prototype.stripState = function(target, stateId)
{
  // consume a single stack of the state.
  target.decrementStateStacks(stateId);
};

/**
 * Removes the given states from the target, each on its own roll through {@link #rollStateRemovalAgainst}.
 * This fully strips the state instead of consuming a single stack.
 * @param {Game_Actor|Game_Enemy} target The target to remove states from.
 * @param {JABS_OnChanceEffect[]} jabsOnChanceEffects The various states to potentially remove.
 */
Game_Action.prototype.removeStates = function(target, jabsOnChanceEffects)
{
  // if there are no effects, don't bother.
  if (jabsOnChanceEffects.length === 0) return;

  // iterate over each of them and see if we should remove them.
  jabsOnChanceEffects.forEach(jabsOnChanceEffect =>
  {
    // roll the dice with this action's fate against the target to see if the on-chance effect applies.
    if (this.rollStateRemovalAgainst(target, jabsOnChanceEffect))
    {
      // remove the given state from the target entirely.
      target.removeState(jabsOnChanceEffect.skillId);
    }
  });
};
//endregion Game_Action