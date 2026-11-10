//region Game_Enemy
import RPG_Skill from './../database/implementations/RPG_Skill.js';
import RPG_EnemyAction from './../database/_data/RPG_EnemyAction.js';
import RPG_Enemy from './../database/implementations/RPG_Enemy.js';
/**
 * Gets the battler id of this enemy from the database.
 * @returns {number}
 */
Game_Enemy.prototype.battlerId = function()
{
  return this.enemyId();
};

/**
 * The underlying database data for this enemy.
 * @returns {RPG_Enemy}
 */
Game_Enemy.prototype.databaseData = function()
{
  return this.enemy();
};

/**
 * Gets all notes associated with the enemy and its class.
 * @returns {[RPG_Enemy]}
 */
Game_Enemy.prototype.getEnemyNotes = function()
{
  // grab reference to the enemy.
  const enemy = this.enemy();

  // return a collection of all things related to this enemy.
  return [
    // add the enemy itself to the source list.
    enemy ];
};

/**
 * Extends {@link #initMembers}.<br/>
 * Also gives this enemy somewhere of its own to keep the skills it learns.
 */
J.BASE.Aliased.Game_Enemy.set('initMembers', Game_Enemy.prototype.initMembers);
Game_Enemy.prototype.initMembers = function()
{
  // perform original logic.
  J.BASE.Aliased.Game_Enemy.get('initMembers')
    .call(this);

  /**
   * The J object where all my additional properties live.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with the base plugin.
   */
  this._j._base ||= {};

  /**
   * The actions this enemy has learned since it was created, on top of the ones its database entry lists.<br/>
   * They live on the enemy rather than in that entry because the entry is shared: every enemy of the same id reads
   * the same row, so a skill written there would be known by all of them, including every one spawned afterward.
   * @type {RPG_EnemyAction[]}
   */
  this._j._base._learnedActions = [];
};

/**
 * Gets the actions this enemy has learned since it was created.
 * @returns {RPG_EnemyAction[]}
 */
Game_Enemy.prototype.learnedActions = function()
{
  return this._j._base._learnedActions;
};

/**
 * Sets the actions this enemy has learned since it was created.
 * @param {RPG_EnemyAction[]} newLearnedActions The new collection of learned actions.
 */
Game_Enemy.prototype.setLearnedActions = function(newLearnedActions)
{
  this._j._base._learnedActions = newLearnedActions;
};

/**
 * Gets every action this enemy can take: the ones its database entry lists, followed by any it has learned since.<br/>
 * Anything asking what an enemy knows reads this rather than the database entry, which is what keeps a learned skill
 * with the one enemy that learned it. The entry itself is the catalog, so it stays exactly as authored.
 * @returns {RPG_EnemyAction[]}
 */
Game_Enemy.prototype.enemyActions = function()
{
  // the authored actions, then the learned ones.
  return [ ...this.enemy().actions, ...this.learnedActions() ];
};

/**
 * Extends {@link #setup}.<br/>
 * Adds a hook for performing actions when an enemy is setup.
 */
J.BASE.Aliased.Game_Enemy.set('setup', Game_Enemy.prototype.setup);
Game_Enemy.prototype.setup = function(enemyId)
{
  // perform original logic.
  J.BASE.Aliased.Game_Enemy.get('setup')
    .call(this, enemyId);

  // execute the on-setup hook.
  this.onSetup(enemyId);
};

/**
 * A hook for performing actions when an enemy is setup.
 * @param {number} enemyId The enemy's id.
 */
// eslint-disable-next-line no-unused-vars
Game_Enemy.prototype.onSetup = function(enemyId)
{
  // flag this battler for needing a data update.
  this.onBattlerDataChange();
};

/**
 * Overwrites the vanilla {@link #traitObjects} defined on {@link Game_Enemy}.<br/>
 * Routes all calls through the cache wrapper on {@link Game_BattlerBase} so the
 * vanilla implementation — which concatenates directly onto the returned array — can never
 * shadow our cache layer or cause accidental mutation.
 * @returns {(RPG_Enemy|RPG_State)[]}
 */
Game_Enemy.prototype.traitObjects = function()
{
  return Game_BattlerBase.prototype.traitObjects.call(this);
};

/**
 * Overwrites {@link #buildTraitObjects}.<br/>
 * Enemies have one additional trait-bearing source beyond states: their own enemy database entry.
 *
 * Returns a fresh array — never mutates the result of any super call — so the
 * cache in {@link #traitObjects} remains safe.
 * @returns {(RPG_Enemy|RPG_State)[]}
 */
Game_Enemy.prototype.buildTraitObjects = function()
{
  return [
    // states are the base trait source for all battlers.
    ...this.states(),

    // the enemy's own database entry carries traits.
    this.enemy(),
  ];
};

/**
 * Converts all "actions" from an enemy into their collection of known skills.
 * This includes both skills listed in their skill list, and any added skills via traits.
 * @returns {RPG_Skill[]}
 */
Game_Enemy.prototype.skills = function()
{
  // grab the actions for the enemy, learned ones included.
  const actions = this.enemyActions()
    .filter(this.canMapActionToSkill, this)
    .map(action => this.skill(action.skillId), this);

  // grab any additional skills added via traits.
  const skillTraits = this.traitObjects()
    .filter(trait => trait.code === J.BASE.Traits.ADD_SKILL)
    .map(skillTrait => this.skill(skillTrait.dataId), this);

  // combine the two arrays of skills.
  return actions
    .concat(skillTraits)
    .sort();
};

/**
 * Gets the raw skill ids available to this enemy.
 * Combines action skill ids with any bonus skill ids granted by traits,
 * then deduplicates so each id appears at most once.
 * Mirrors the logic of {@link #skills} but returns ids instead of resolved skill objects,
 * making it safe to call from inside the skill extension resolver.
 * @returns {number[]}
 */
Game_Enemy.prototype.skillIds = function()
{
  // collect skill ids from all actions that can be mapped to skills, learned ones included.
  const actionIds = this.enemyActions()
    .filter(this.canMapActionToSkill, this)
    .map(action => action.skillId);

  // collect any additional skill ids granted via traits.
  const traitIds = this.traitObjects()
    .filter(trait => trait.code === J.BASE.Traits.ADD_SKILL)
    .map(trait => trait.dataId);

  // combine and deduplicate.
  return [...new Set(actionIds.concat(traitIds))];
};

/**
 * Determines whether or not the action can be mapped to a skill.
 * @param {RPG_EnemyAction} action The action being mapped to a skill.
 * @returns {boolean}
 */
// eslint-disable-next-line no-unused-vars
Game_Enemy.prototype.canMapActionToSkill = function(action)
{
  return true;
};

/**
 * Checks whether or not this enemy knows this skill.
 * @param {number} skillId The id of the skill to check for.
 * @returns {boolean}
 */
Game_Enemy.prototype.hasSkill = function(skillId)
{
  return this.skills()
    .some(skill => skill.id === skillId);
};

/**
 * Forces this enemy, and only this enemy, to learn the skill of the given id.<br/>
 * Will not learn the skill again if it is already learned. Others of the same id are untouched, both those already
 * on the map and those spawned afterward- see {@link #enemyActions} for why that has to be stated.
 * @param {number} skillId The skill id to learn.
 * @returns {boolean} True if the enemy learned the new skill, false if it already knew it.
 */
Game_Enemy.prototype.learnSkill = function(skillId)
{
  // don't try to learn the skill if its already known.
  if (this.hasSkill(skillId)) return false;

  // build the new underlying action to be detected by the enemy, shaped like the ones its database entry lists.
  const rpgEnemyAction = this.buildLearnedAction(skillId);

  // add it to what this enemy has learned, never to its database entry, which every enemy of this id shares.
  this.setLearnedActions([ ...this.learnedActions(), rpgEnemyAction ]);

  // indicate that a new skill was learned to any callers that might be interested.
  return true;
};

/**
 * Builds the action that a learned skill adds to this enemy.<br/>
 * Unconditional, at the default rating of 5, so the skill is on offer whenever the enemy is choosing at all.
 * @param {number} skillId The skill being learned.
 * @returns {RPG_EnemyAction}
 */
Game_Enemy.prototype.buildLearnedAction = function(skillId)
{
  return new RPG_EnemyAction({
    conditionParam1: 0,
    conditionParam2: 0,
    conditionType: 0,
    rating: 5,
    skillId,
  });
};

/**
 * Extends {@link #die}.<br/>
 * Adds a toggle of the death effects.
 */
J.BASE.Aliased.Game_Enemy.set('die', Game_Enemy.prototype.die);
Game_Enemy.prototype.die = function()
{
  // perform original logic.
  J.BASE.Aliased.Game_Enemy.get('die')
    .call(this);

  // perform on-death effects.
  this.onDeath();
};

/**
 * An event hook fired when this enemy dies.
 */
Game_Enemy.prototype.onDeath = function()
{
  // flag this battler for needing a data update.
  this.onBattlerDataChange();
};

/**
 * Gets the base max tp for this enemy.
 * @returns {number}
 */
Game_Enemy.prototype.getBaseMaxTp = function()
{
  return J.BASE.Metadata.BaseTpMaxEnemies;
};
//endregion Game_Enemy