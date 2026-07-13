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
  this._item.setObject(skillToSet);
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
  this._item.setObject(itemObject);
};

/**
 * Extends {@link #apply}.<br/>
 * Also applies on-hit states.
 */
J.EXTEND.Aliased.Game_Action.set('apply', Game_Action.prototype.apply);
Game_Action.prototype.apply = function(target)
{
  // perform original logic.
  J.EXTEND.Aliased.Game_Action.get('apply')
    .call(this, target);

  // apply our on-hit self-states if we have any.
  this.applyOnHitStateEffects(target);
};

/**
 * Applies all on-hit state modifications, such as adding or removing states to self or the target.
 * @param {Game_Actor|Game_Enemy} target The target being hit with the action.
 */
Game_Action.prototype.applyOnHitStateEffects = function(target)
{
  // if we cannot apply on-hit state effects, then do not.
  if (this.canApplyOnHitStateEffects(target) === false) return;

  // apply our on-hit self-states if we have any.
  this.applyOnHitSelfStates();

  // apply our on-hit lose-states if we have any.
  this.applyOnHitLoseStates();

  // apply our on-hit apply-states (with optional duration/stack overrides) if we have any.
  this.applyOnHitApplyStates(target);

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
 * Applies all applicable on-hit self states.
 */
Game_Action.prototype.applyOnHitSelfStates = function()
{
  // apply all on-hit states to oneself.
  this.applyStates(this.subject(), this.onHitSelfStates());
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
 * Removes all applicable on-hit lose states.
 */
Game_Action.prototype.applyOnHitLoseStates = function()
{
  // lose all on-hit states from oneself.
  this.loseStates(this.subject(), this.onHitLoseStates());
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
 * Each entry is evaluated independently: the chance is rolled, and on success a
 * {@link JABS_StateOverrides} is constructed and passed to
 * {@link Game_Battler#addStateWithOverrides}.
 * Target state resistance is still respected inside {@link Game_Battler#handleAddingJabsState}.
 * @param {Game_Actor|Game_Enemy} target The target being hit with the action.
 */
Game_Action.prototype.applyOnHitApplyStates = function(target)
{
  // grab caster-wide applyState entries from all of the attacker's notes.
  const casterEntries = RPGManager.getAllCapturesFromAllNotesByRegex(
    this.subject().getAllNotes(),
    J.EXTEND.RegExp.ApplyState);

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
    // roll the chance; if it doesn't pass, this state does not apply on this hit.
    if (!RPGManager.chanceIn100(chance)) return;

    // build the overrides object from whatever the tag provided.
    const overrides = new JABS_StateOverrides(duration, stacks);

    // apply the state to the target with the overrides; resistance is checked inside.
    target.addStateWithOverrides(stateId, attacker, overrides);
  });
};

/**
 * Extends {@link #applyItemUserEffect}.<br/>
 * Also applies on-cast target-affecting states (strip/remove).
 * On-cast self states (self/lose) fire once at press-time via {@link JABS_Engine#handleOnCastStateEffects} instead.
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
 * (see {@link JABS_Engine#handleOnCastStateEffects}), same as the on-cast self-state family below.
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
  return RPGManager.getNumbersFromNoteByRegex(this.item(), J.EXTEND.RegExp.ToggleOnExecute);
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
 * Applies the given states to the target.
 * @param target {Game_Actor|Game_Enemy} The target to apply states to.
 * @param jabsOnChanceEffects {JABS_OnChanceEffect[]} The various states to potentially apply.
 */
Game_Action.prototype.applyStates = function(target, jabsOnChanceEffects)
{
  // if there are no effects, don't bother.
  if (jabsOnChanceEffects.length === 0) return;

  // iterate over each of them and see if we should apply them.
  jabsOnChanceEffects.forEach(jabsOnChanceEffect =>
  {
    // the caster wants the state to stick; the target's own curse can undermine that success.
    const attacker = this.subject();
    const skill = jabsOnChanceEffect.baseSkill(attacker);
    const positiveRolls = 1 + attacker.getPositiveRollsForSkill(skill);
    const negativeRolls = target.getNegativeRolls();

    // resolve how many times this proc's action should execute (Accumulate Mode/Encore aware).
    const procCount = jabsOnChanceEffect.resolveProcCount(positiveRolls, negativeRolls, attacker);

    // apply the given state once per success, with the caster as the attacker.
    for (let i = 0; i < procCount; i++)
    {
      target.addState(jabsOnChanceEffect.skillId, attacker);
    }
  });
};

/**
 * Loses the given states from the target.
 * This consumes a single stack in JABS, or removes the whole state outside JABS.
 * @param target {Game_Actor|Game_Enemy} The target to lose states from.
 * @param jabsOnChanceEffects {JABS_OnChanceEffect[]} The various states to potentially lose.
 */
Game_Action.prototype.loseStates = function(target, jabsOnChanceEffects)
{
  // if there are no effects, don't bother.
  if (jabsOnChanceEffects.length === 0) return;

  // iterate over each of them and see if we should apply them.
  jabsOnChanceEffects.forEach(jabsOnChanceEffect =>
  {
    // the caster wants the removal to succeed; the target's own curse can resist it.
    const attacker = this.subject();
    const skill = jabsOnChanceEffect.baseSkill(attacker);
    const positiveRolls = 1 + attacker.getPositiveRollsForSkill(skill);
    const negativeRolls = target.getNegativeRolls();

    // roll the dice to see if the on-chance effect applies.
    if (jabsOnChanceEffect.shouldTrigger(positiveRolls, negativeRolls, attacker))
    {
      // lose the given state from the target.
      this.loseState(target, jabsOnChanceEffect.skillId);
    }
  });
};

/**
 * Strips the given states from the target.
 * This consumes a single stack in JABS, or removes the whole state outside JABS.
 * @param target {Game_Actor|Game_Enemy} The target to strip states from.
 * @param jabsOnChanceEffects {JABS_OnChanceEffect[]} The various states to potentially strip.
 */
Game_Action.prototype.stripStates = function(target, jabsOnChanceEffects)
{
  // if there are no effects, don't bother.
  if (jabsOnChanceEffects.length === 0) return;

  // iterate over each of them and see if we should apply them.
  jabsOnChanceEffects.forEach(jabsOnChanceEffect =>
  {
    // the caster wants the strip to succeed; the target's own curse can resist it.
    const attacker = this.subject();
    const skill = jabsOnChanceEffect.baseSkill(attacker);
    const positiveRolls = 1 + attacker.getPositiveRollsForSkill(skill);
    const negativeRolls = target.getNegativeRolls();

    // roll the dice to see if the on-chance effect applies.
    if (jabsOnChanceEffect.shouldTrigger(positiveRolls, negativeRolls, attacker))
    {
      // strip the given state from the target.
      this.stripState(target, jabsOnChanceEffect.skillId);
    }
  });
};

/**
 * Loses a single stack of the given state from the target.
 * This falls back to full state removal outside JABS.
 * @param {Game_Actor|Game_Enemy} target The target losing the state.
 * @param {number} stateId The id of the state to lose.
 */
Game_Action.prototype.loseState = function(target, stateId)
{
  // if JABS is available, then consume only a single stack.
  if (J.ABS)
  {
    target.decrementStateStacks(stateId);
    return;
  }

  // otherwise, just remove the state normally.
  target.removeState(stateId);
};

/**
 * Strips a single stack of the given state from the target.
 * This falls back to full state removal outside JABS.
 * @param {Game_Actor|Game_Enemy} target The target losing the state.
 * @param {number} stateId The id of the state to strip.
 */
Game_Action.prototype.stripState = function(target, stateId)
{
  // if JABS is available, then consume only a single stack.
  if (J.ABS)
  {
    target.decrementStateStacks(stateId);
    return;
  }

  // otherwise, just remove the state normally.
  target.removeState(stateId);
};

/**
 * Removes the given states from the target.
 * This fully strips the state instead of consuming a single stack.
 * @param target {Game_Actor|Game_Enemy} The target to apply states to.
 * @param jabsOnChanceEffects {JABS_OnChanceEffect[]} The various states to potentially apply.
 */
Game_Action.prototype.removeStates = function(target, jabsOnChanceEffects)
{
  // if there are no effects, don't bother.
  if (jabsOnChanceEffects.length === 0) return;

  // iterate over each of them and see if we should apply them.
  jabsOnChanceEffects.forEach(jabsOnChanceEffect =>
  {
    // the caster wants the removal to succeed; the target's own curse can resist it.
    const attacker = this.subject();
    const skill = jabsOnChanceEffect.baseSkill(attacker);
    const positiveRolls = 1 + attacker.getPositiveRollsForSkill(skill);
    const negativeRolls = target.getNegativeRolls();

    // roll the dice to see if the on-chance effect applies.
    if (jabsOnChanceEffect.shouldTrigger(positiveRolls, negativeRolls, attacker))
    {
      // apply the given state to the caster, with the caster as the attacker.
      target.removeState(jabsOnChanceEffect.skillId);
    }
  });
};
//endregion Game_Action