//region Game_Actor
/**
 * Extends {@link #onSetup}.<br/>
 * Also refreshes the passive states on this battler for the first time.
 * @param {number} actorId The battler's id.
 */
J.PASSIVE.Aliased.Game_Actor.set('onSetup', Game_Actor.prototype.onSetup);
Game_Actor.prototype.onSetup = function(actorId)
{
  // attach passives first- deferred, so this doesn't trigger its own battler-data-change cascade-
  // so that when original logic below fires the single notification, passives are already in place.
  this.refreshPassiveStates(true);

  // perform original logic; this is what actually fires the battler-data-change cascade.
  J.PASSIVE.Aliased.Game_Actor.get('onSetup')
    .call(this, actorId);
};

/**
 * Gets all sources from which this battler can derive passive state from.
 *
 * This does include a reference call to potentially getting passive states, but due
 * to control flows, this should always come back with no passive states in the list.
 * @returns {(RPG_Actor|RPG_Enemy|RPG_Class|RPG_Skill|RPG_EquipItem|RPG_State)[]}
 */
Game_Actor.prototype.getPassiveStateSources = function()
{
  // perform original logic to get base sources.
  const originalSources = Game_Battler.prototype.getPassiveStateSources.call(this);

  // define additional sources that actors can derive passive states from.
  const actorPassiveSources = [
    // all equipment currently equipped on the actor.
    ...this.equippedEquips(),

    // also add the class for this
    this.currentClass(), ];

  // combine the sources.
  const combinedSources = originalSources.concat(actorPassiveSources);

  // return this collection of stuff.
  return combinedSources;
};

/**
 * Extends {@link #buildTraitObjects}.<br/>
 * When considering traits, also include the actor's and party's passive states.
 *
 * Returns a fresh array by spreading the base result and appending passives — never
 * mutates the base result so the {@link #traitObjects} cache stays safe.
 * @returns {(RPG_Actor|RPG_Class|RPG_EquipItem|RPG_State)[]}
 */
J.PASSIVE.Aliased.Game_Actor.set('buildTraitObjects', Game_Actor.prototype.buildTraitObjects);
Game_Actor.prototype.buildTraitObjects = function()
{
  // perform original logic.
  const baseObjects = J.PASSIVE.Aliased.Game_Actor.get('buildTraitObjects')
    .call(this);

  // return a new array that includes the actor's and party's passive states.
  return [ ...baseObjects, ...this.getPassiveStates(), ...$gameParty.passiveStates() ];
};

/**
 * Extends {@link #learnSkill}.<br/>
 * Refreshes passive states after the skill is committed to the actor's skill list.<br/>
 * J-Base dispatches {@link #onLearnNewSkill} before the skill is added — too early for skill passives.
 */
J.PASSIVE.Aliased.Game_Actor.set('learnSkill', Game_Actor.prototype.learnSkill);
Game_Actor.prototype.learnSkill = function(skillId)
{
  const wasKnown = this.isLearnedSkill(skillId);

  // perform original logic (J-Base adds the skill after onLearnNewSkill).
  J.PASSIVE.Aliased.Game_Actor.get('learnSkill')
    .call(this, skillId);

  if (wasKnown === false)
  {
    // rebuild passives now that skills() includes the new wrapper row.
    this.refreshPassiveStates();
  }
};

/**
 * Extends {@link #forgetSkill}.<br/>
 * Refreshes passive states after the skill is removed from the actor's skill list.<br/>
 * J-Base dispatches {@link #onForgetSkill} before the skill is dropped — too early for skill passives.
 */
J.PASSIVE.Aliased.Game_Actor.set('forgetSkill', Game_Actor.prototype.forgetSkill);
Game_Actor.prototype.forgetSkill = function(skillId)
{
  const wasKnown = this.isLearnedSkill(skillId);

  // perform original logic (J-Base removes the skill after onForgetSkill).
  J.PASSIVE.Aliased.Game_Actor.get('forgetSkill')
    .call(this, skillId);

  if (wasKnown)
  {
    // rebuild passives now that skills() no longer includes the forgotten wrapper row.
    this.refreshPassiveStates();
  }
};

/**
 * Extends {@link #onEquipChange}.<br/>
 * Triggers a refresh of passive states when equipment changes.
 */
J.PASSIVE.Aliased.Game_Actor.set('onEquipChange', Game_Actor.prototype.onEquipChange);
Game_Actor.prototype.onEquipChange = function()
{
  // perform original logic.
  J.PASSIVE.Aliased.Game_Actor.get('onEquipChange')
    .call(this);

  // refresh our passive state list.
  this.refreshPassiveStates();
};

/**
 * Extends {@link #onClassChange}.<br/>
 * Triggers a refresh of passive states when the class changes.
 */
J.PASSIVE.Aliased.Game_Actor.set('onClassChange', Game_Actor.prototype.onClassChange);
Game_Actor.prototype.onClassChange = function(classId, keepExp)
{
  // perform original logic.
  J.PASSIVE.Aliased.Game_Actor.get('onClassChange')
    .call(this, classId, keepExp);

  // refresh our passive state list.
  this.refreshPassiveStates();
};

/**
 * Extends {@link #getNotesSources}.<br/>
 * Includes passive skill states from this actor and also the party.
 * @returns {RPG_BaseItem[]}
 */
J.PASSIVE.Aliased.Game_Actor.set('getNotesSources', Game_Actor.prototype.getNotesSources);
Game_Actor.prototype.getNotesSources = function()
{
  // perform original logic to get notes.
  const originalSources = J.PASSIVE.Aliased.Game_Actor.get('getNotesSources')
    .call(this);

  // newly defined sources for passives.
  const passiveSources = [
    // also apply the party's effects.
    ...$gameParty.passiveStates(), ];

  // combine the sources.
  const combinedSources = originalSources.concat(passiveSources);

  // return the combination.
  return combinedSources
};
//endregion Game_Actor