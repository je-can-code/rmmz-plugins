//region Game_Action
/**
 * Overrides {@link #setSkill}.<br>
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
 * Overrides {@link #setItemObject}.<br>
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
 * Extends {@link #apply}.<br>
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
  if (target.result().isHit() === false) return false;

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
 * Extends {@link #applyItemUserEffect}.<br>
 * Also applies on-cast states.
 */
J.EXTEND.Aliased.Game_Action.set('applyItemUserEffect', Game_Action.prototype.applyItemUserEffect);
Game_Action.prototype.applyItemUserEffect = function(target)
{
  // perform original logic.
  J.EXTEND.Aliased.Game_Action.get('applyItemUserEffect')
    .call(this, target);

  // apply our on-cast self-states if we have any.
  this.applyOnCastSelfStates();

  // apply our on-cast lose-states if we have any.
  this.applyOnCastLoseStates();

  // apply our on-cast strip-states if we have any.
  this.applyOnCastStripStates(target);

  // apply our on-cast remove-states if we have any.
  this.applyOnCastRemoveStates(target);
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
    // roll the dice to see if the on-chance effect applies.
    if (jabsOnChanceEffect.shouldTrigger())
    {
      // apply the given state to the caster, with the caster as the attacker.
      target.addState(jabsOnChanceEffect.skillId, this.subject());
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
    // roll the dice to see if the on-chance effect applies.
    if (jabsOnChanceEffect.shouldTrigger())
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
    // roll the dice to see if the on-chance effect applies.
    if (jabsOnChanceEffect.shouldTrigger())
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
    // roll the dice to see if the on-chance effect applies.
    if (jabsOnChanceEffect.shouldTrigger())
    {
      // apply the given state to the caster, with the caster as the attacker.
      target.removeState(jabsOnChanceEffect.skillId);
    }
  });
};
//endregion Game_Action