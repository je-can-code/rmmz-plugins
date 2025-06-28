//region Game_Enemy

/**
 * Extends {@link Game_Enemy.setup}.<br>
 * Includes setting up the learned level map for skills.
 */
J.LEVEL.Aliased.Game_Enemy.set('initMembers', Game_Enemy.prototype.initMembers);
Game_Enemy.prototype.initMembers = function()
{
  // perform original logic.
  J.LEVEL.Aliased.Game_Enemy.get('initMembers')
    .call(this);

  /**
   * The J object where all my additional properties live.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with levels.
   */
  this._j._level ||= {};

  /**
   * All skill learnings this enemy has for it recorded as a dictionary.
   * @type {Record<number, number>}
   */
  this._j._level._skillLearnings = {};
};

/**
 * Sets a skill's learning by its skill and level.
 * @param {number} skillId The skill id to be learned.
 * @param {number} level The level the corresponding skill is learned.
 */
Game_Enemy.prototype.setSkillLearning = function(skillId, level)
{
  this._j._level._skillLearnings[skillId] = level;
};

/**
 * Extends {@link Game_Enemy.setup}.<br>
 * Includes setting up the learned level map for skills.
 */
J.LEVEL.Aliased.Game_Enemy.set('setup', Game_Enemy.prototype.setup);
Game_Enemy.prototype.setup = function(enemyId, x, y)
{
  // perform original logic.
  J.LEVEL.Aliased.Game_Enemy.get('setup')
    .call(this, enemyId, x, y);

  // initialize the skill learnings for this enemy.
  this.setupSkillLearnings();
};

/**
 * Sets up the learnings defined on the enemy.
 */
Game_Enemy.prototype.setupSkillLearnings = function()
{
  const learnings = RPGManager.getArraysFromNotesByRegex(this.enemy(), J.LEVEL.RegExp.Learning) ?? [];
  if (learnings.length === 0) return;

  learnings.forEach(learning => this.setSkillLearning(learning.at(0), learning.at(1)));
};

/**
 * Extends {@link #canMapActionToSkill}.<br/>
 * Also factors in whether or not the skill is technically learned or not.
 * @param {RPG_EnemyAction} action The action being mapped to a skill.
 * @returns {boolean}
 */
J.LEVEL.Aliased.Game_Enemy.set('canMapActionToSkill', Game_Enemy.prototype.canMapActionToSkill);
Game_Enemy.prototype.canMapActionToSkill = function(action)
{
  // perform original logic.
  const baseCanMap = J.LEVEL.Aliased.Game_Enemy.get('canMapActionToSkill')
    .call(this, action);

  // if the skill is otherwise unmappable, then don't bother with level-related logic.
  if (baseCanMap === false) return false;

  // determine if the skill is learned according to its level.
  const isLearned = this.isLearnedSkillByLevel(action);

  // return what we found.
  return isLearned;
};

/**
 * Determines if a skill has been learned from potential level restrictions.
 * @param {RPG_EnemyAction} action The action being mapped to a skill.
 * @returns {boolean}
 */
Game_Enemy.prototype.isLearnedSkillByLevel = function(action)
{
  const levelLearned = this._j._level._skillLearnings[action.skillId];

  // if the skill didn't map, then the value will be undefined.
  if (levelLearned === undefined) return true;

  // if the enemy is at or above the level learned, then the skill is learned.
  if (this.level >= levelLearned) return true;

  // otherwise, the skill is not learned and shouldn't be considered.
  return false;
};

/**
 * Overrides {@link #getBattlerBaseLevel}.<br/>
 * Instead of defaulting to zero, it will use the enemy's own note, accommodating any overrides if present.
 * @returns {number}
 */
J.LEVEL.Aliased.Game_Enemy.set('getBattlerBaseLevel', Game_Enemy.prototype.getBattlerBaseLevel);
Game_Enemy.prototype.getBattlerBaseLevel = function()
{
  // calculate the original level- probably zero unless another plugin modifies this.
  const defaultBaseLevel = J.LEVEL.Aliased.Game_Enemy.get('getBattlerBaseLevel')
    .call(this);

  // grab the level from the enemy's own note.
  const noteLevel = RPGManager.getNumberFromNoteByRegex(this.enemy(), J.LEVEL.RegExp.Level);

  // combine the default and enemy levels.
  const baseLevel = defaultBaseLevel + noteLevel;

  // if there are no overrides, then return the base level.
  if (this.hasLevelOverride() === false) return baseLevel;

  // get the JABS_Battler associated with this enemy by UUID.
  const jabsBattler = JABS_AiManager.getBattlerByUuid(this.getUuid());

  // return the level override.
  return jabsBattler.getCharacter()
    .getLevelOverrides();
};

/**
 * Checks if this enemy in particular has any JABS level overrides.
 * @returns {boolean}
 */
Game_Enemy.prototype.hasLevelOverride = function()
{
  // if JABS isn't available, then there won't be a level override.
  if (!J.ABS) return false;

  // if there is no battler on this enemy, then there won't be a level override to check.
  if (!this.getUuid()) return false;

  // get the JABS_Battler associated with this enemy by UUID.
  const jabsBattler = JABS_AiManager.getBattlerByUuid(this.getUuid());

  // if there is no battler being tracked by this UUID, then there are no overrides.
  if (!jabsBattler) return false;

  // if overrides is null, then there are none.
  if (jabsBattler.getCharacter()
    .getLevelOverrides() === null)
  {
    return false;
  }

  // there must be overrides!
  return true;
};

/**
 * Determines if the level should be hidden for this enemy based on its notes.
 * @returns {boolean} True if the level should be hidden, false otherwise.
 */
Game_Enemy.prototype.shouldHideLevel = function()
{
  // grab the reference data for this battler.
  const referenceData = this.enemy();

  // check if the hideLevel tag exists in the enemy's notes.
  const hideLevel = RPGManager.checkForBooleanFromNoteByRegex(referenceData, J.LEVEL.RegExp.HideLevel);

  // return whether the level should be hidden.
  return hideLevel;
};

/**
 * Gets all database sources we can get levels from.
 * @returns {RPG_BaseItem[]}
 */
Game_Enemy.prototype.getLevelSources = function()
{
  // our sources of data that a level can be retrieved from.
  return [
    ...this.states(), // all states applied to this enemy are sources.
  ];
};

/**
 * The variable level modifier for this enemy.
 * @returns {number}
 */
Game_Enemy.prototype.getLevelBalancer = function()
{
  // check if we have a variable set for the fixed balancing.
  if (J.LEVEL.Metadata.enemyBalanceVariable)
  {
    // return the adjustment from the variable value instead.
    return $gameVariables.value(J.LEVEL.Metadata.enemyBalanceVariable);
  }

  // we don't have any balancing required.
  return 0;
};
//endregion Game_Enemy