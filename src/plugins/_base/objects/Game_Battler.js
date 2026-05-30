//region Game_Battler
import RPGManager from './../managers/RPGManager.js';
import ParameterRegistry from './../core/ParameterRegistry.js';
import RPG_State from './../database/implementations/RPG_State.js';
import RPG_Skill from './../database/implementations/RPG_Skill.js';
import RPG_EquipItem from './../database/core/RPG_EquipItem.js';
import RPG_Enemy from './../database/implementations/RPG_Enemy.js';
import RPG_Class from './../database/implementations/RPG_Class.js';
import RPG_BaseItem from './../database/base/RPG_BaseItem.js';
import RPG_Actor from './../database/implementations/RPG_Actor.js';

/**
 * Gets the skill associated with the given skill id.
 * By default, we simply get the skill from the database with no modifications.
 * @param {number} skillId The skill id to get the skill for.
 * @returns {RPG_Skill}
 */
Game_Battler.prototype.skill = function(skillId)
{
  return $dataSkills[skillId];
};

/**
 * Gets all skills this battler has available to it.
 * @returns {RPG_Skill[]}
 */
Game_Battler.prototype.skills = function()
{
  return Array.empty;
};

/**
 * Gets the raw skill ids available to this battler.
 * Returns an empty array by default; actor and enemy override this for their respective data sources.
 * @returns {number[]}
 */
Game_Battler.prototype.skillIds = function()
{
  return Array.empty;
};

/**
 * The underlying database data for this battler.
 *
 * This allows operations to be performed against both actor and enemy indifferently.
 * @returns {number}
 */
Game_Battler.prototype.battlerId = function()
{
  return 1;
};

/**
 * The underlying database data for this battler.
 *
 * This allows operations to be performed against both actor and enemy indifferently.
 * @returns {RPG_Enemy|RPG_Actor}
 */
Game_Battler.prototype.databaseData = function()
{
  return null;
};

/**
 * Gets the class associated with the given class id.
 * By default, we simply get the class from the database with no modifications.
 * @param {number} classId The class id to get the class for.
 * @returns {RPG_Class}
 */
Game_Battler.prototype.class = function(classId)
{
  return $dataClasses.at(classId);
};

/**
 * Overwrites {@link #maxTp}.<br/>
 * Replaces the default of 100 for all battlers with a tag-based calculation that reviews all available notes to sum
 * together all maxTp values for a custom value.
 * @returns {number}
 */
Game_Battler.prototype.maxTp = function()
{
  // get the base max tp for the battler.
  const baseMaxTp = this.getBaseMaxTp();

  // determine the sum of all max tech values from the available notes- if any.
  const combinedMaxTp = this.getBaseMaxTpBonuses();

  // check if none of the notes had any max tech v
  return Math.max(0, (baseMaxTp + combinedMaxTp));
};

/**
 * The base max TP for all battlers- always 0 at this level.
 * @returns {number}
 */
Game_Battler.prototype.getBaseMaxTp = function()
{
  return 0;
};

/**
 * The base bonus to max tech on this battler.
 * @returns {number}
 */
Game_Battler.prototype.getBaseMaxTpBonuses = function()
{
  // grab all the notes.
  const objectsToCheck = this.getAllNotes();

  // determine the sum of all max tech values from the available notes- if any.
  return RPGManager.getSumFromAllNotesByRegex(objectsToCheck, J.BASE.RegExp.MaxTp);
};

/**
 * Gets everything that this battler has with notes on it.
 * All battlers have their own database data, along with all their states.
 * Actors also get their class, skills, and equips added.
 * Enemies also get their skills added.
 * @returns {(RPG_Actor|RPG_Enemy|RPG_Class|RPG_Skill|RPG_EquipItem|RPG_State)[]}
 */
Game_Battler.prototype.getAllNotes = function()
{
  // initialize the container.
  const objectsWithNotes = this.getNotesSources();

  // return this combined collection of note-containing objects.
  return objectsWithNotes;
};

/**
 * Gets all database objects from which notes can be derived for this battler.
 * @returns {RPG_BaseItem[]}
 */
Game_Battler.prototype.getNotesSources = function()
{
  return [
    // add the actor/enemy to the source list.
    this.databaseData(),

    // add all skills for the actor/enemy to the source list.
    ...this.skills(),

    // add all currently applied states to the source list.
    ...this.allStates(), ];
};

/**
 * Adds a hook for performing actions when some part of the battler's data has changed.
 * All battlers will trigger this hook when states are added or removed.
 *
 * Unlike {@link Game_Battler.refresh}, this does not trigger when hp/mp/tp changes.
 */
Game_Battler.prototype.onBattlerDataChange = function()
{
};

//region state management
/**
 * Gets the state associated with the given state id.
 * By abstracting this, we can modify the underlying state before it reaches its destination.
 * @param {number} stateId The state id to get data for.
 * @returns {RPG_State}
 */
Game_Battler.prototype.state = function(stateId)
{
  return $dataStates[stateId];
};

/**
 * Overwrites {@link #states}.<br/>
 * Returns all states from the view of this battler.
 * @returns {RPG_State[]}
 */
Game_Battler.prototype.states = function()
{
  return this._states.map(stateId => this.state(stateId), this);
};

/**
 * Extends {@link #eraseState}.<br/>
 * Adds a hook for performing actions when a state is removed from the battler.
 */
J.BASE.Aliased.Game_Battler.set('eraseState', Game_Battler.prototype.eraseState);
Game_Battler.prototype.eraseState = function(stateId)
{
  // grab a snapshot of what the equips looked like before changing.
  const oldStates = Array.from(this._states);

  // perform original logic.
  J.BASE.Aliased.Game_Battler.get('eraseState')
    .call(this, stateId);

  // determine if the states array changed from what it was before original logic.
  const isChanged = !oldStates.equals(this._states);

  // check if we did actually have change.
  if (isChanged)
  {
    // triggers the on-removal hook.
    this.onStateRemoval(stateId);
  }
};

/**
 * An event hook fired when this battler has a state removed.
 * @param {number} stateId The state id being removed.
 */
// eslint-disable-next-line no-unused-vars
Game_Battler.prototype.onStateRemoval = function(stateId)
{
  // flag this battler for needing a data update.
  this.onBattlerDataChange();
};

/**
 * Extends {@link #addNewState}.<br/>
 * Adds a hook for performing actions when a state is added on the battler.
 */
J.BASE.Aliased.Game_Battler.set('addNewState', Game_Battler.prototype.addNewState);
Game_Battler.prototype.addNewState = function(stateId)
{
  // grab a snapshot of what the equips looked like before changing.
  const oldStates = Array.from(this._states);

  // perform original logic.
  J.BASE.Aliased.Game_Battler.get('addNewState')
    .call(this, stateId);

  // determine if the states array changed from what it was before original logic.
  const isChanged = !oldStates.equals(this._states);

  // check if we did actually have change.
  if (isChanged)
  {
    // triggers the on-added hook.
    this.onStateAdded(stateId);
  }
};

/**
 * An event hook fired when this battler has a state added.
 * @param {number} stateId The state id being added.
 */
// eslint-disable-next-line no-unused-vars
Game_Battler.prototype.onStateAdded = function(stateId)
{
  // flag this battler for needing a data update.
  this.onBattlerDataChange();
};

/**
 * Gets all states on the battler.
 * This can include other states from other plugins, too.
 * @returns {RPG_State[]}
 */
Game_Battler.prototype.allStates = function()
{
  // initialize our state collection.
  const states = [];

  // add in all base states.
  states.push(...this.states());

  // return that combined collection.
  return states;
};
//endregion state management

/**
 * Gets the current health percent of this battler.
 * @returns {number}
 */
Game_Battler.prototype.currentHpPercent = function()
{
  return parseFloat((this.hp / this.mhp).toFixed(2));
};

/**
 * Gets the current health percent of this battler as a base-100 integer.
 * @returns {number}
 */
Game_Battler.prototype.currentHpPercent100 = function()
{
  // return the whole base-100 version of the hp percent.
  return Math.round(this.currentHpPercent() * 100);
};

/**
 * Resolves a catalog parameter value by string key.
 * Delegates to {@link ParameterRegistry} — does not bypass param/xparam/sparam alias chains.
 * @param {string} key The parameter key (e.g. `'atk'`).
 * @returns {number}
 */
Game_Battler.prototype.parameter = function(key)
{
  return ParameterRegistry.resolveValue(this, key);
};

/**
 * Hook fired after any positive resource recovery on this battler.
 * Extensions alias this instead of gainHp/gainMp/gainTp to react to healing events
 * without duplicating three separate aliases per plugin.
 * @param {string} _resource One of {@link J.BASE.Resource}.HP / .MP / .TP.
 * @param {number} _amount The positive amount that was recovered.
 */
Game_Battler.prototype.onHeal = function(_resource, _amount)
{
};

/**
 * Extends {@link #gainHp}.<br/>
 * Fires {@link #onHeal} after any positive HP recovery so listeners can react.
 */
J.BASE.Aliased.Game_Battler.set('gainHp', Game_Battler.prototype.gainHp);
Game_Battler.prototype.gainHp = function(value)
{
  // perform original logic.
  J.BASE.Aliased.Game_Battler.get('gainHp').call(this, value);
  // notify heal listeners when a positive HP recovery is applied.
  if (value > 0) this.onHeal(J.BASE.Resource.HP, value);
};

/**
 * Extends {@link #gainMp}.<br/>
 * Fires {@link #onHeal} after any positive MP recovery so listeners can react.
 */
J.BASE.Aliased.Game_Battler.set('gainMp', Game_Battler.prototype.gainMp);
Game_Battler.prototype.gainMp = function(value)
{
  // perform original logic.
  J.BASE.Aliased.Game_Battler.get('gainMp').call(this, value);
  // notify heal listeners when a positive MP recovery is applied.
  if (value > 0) this.onHeal(J.BASE.Resource.MP, value);
};

/**
 * Extends {@link #gainTp}.<br/>
 * Fires {@link #onHeal} after any positive TP recovery so listeners can react.
 */
J.BASE.Aliased.Game_Battler.set('gainTp', Game_Battler.prototype.gainTp);
Game_Battler.prototype.gainTp = function(value)
{
  // perform original logic.
  J.BASE.Aliased.Game_Battler.get('gainTp').call(this, value);
  // notify heal listeners when a positive TP recovery is applied.
  if (value > 0) this.onHeal(J.BASE.Resource.TP, value);
};
//endregion Game_Battler