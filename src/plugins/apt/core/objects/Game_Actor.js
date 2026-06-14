//region Game_Actor
import AptitudeSkillSourceProgress from './../_models/AptitudeSkillSourceProgress.js';
import AptitudeSkillAggregate from './../_models/AptitudeSkillAggregate.js';
import AptitudeSkill from './../_models/AptitudeSkill.js';
import AptitudeProgress from './../_models/AptitudeProgress.js';
import AptitudeLearning from './../_models/AptitudeLearning.js';

/**
 * Extends {@link #initMembers}.<br/>
 * Also initializes aptitude members.
 */
J.APT.Aliased.Game_Actor.set('initMembers', Game_Actor.prototype.initMembers);
Game_Actor.prototype.initMembers = function()
{
  // perform original logic.
  J.APT.Aliased.Game_Actor.get('initMembers')
    .call(this);

  // also initialize aptitude members.
  this.initAptitudeMembers();
};

/**
 * Initializes the aptitude members.
 */
Game_Actor.prototype.initAptitudeMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with this plugin.
   */
  this._j._aptitude ||= {};

  /**
   * A collection of all aptitudes that are presently being learned.
   * @type {Record<string, AptitudeProgress>}
   */
  this._j._aptitude._progress = {};

  /**
   * The aptitude skills for this actor.
   * @type {Record<number, AptitudeSkill>}
   */
  this._j._aptitude._learned = {};

  /**
   * The cached result of the {@link #apr} property getter.
   * Null when the cache is cold; invalidated by {@link #onBattlerDataChange}.
   * @type {number|null}
   */
  this._j._aptitude._cachedApr = null;
};

/**
 * Gets the cached APR factor for this actor, or null if the cache is cold.
 * @returns {number|null}
 */
Game_Actor.prototype.getCachedApr = function()
{
  return this._j._aptitude._cachedApr;
};

/**
 * Sets the cached APR factor for this actor.
 * @param {number|null} value The new cached value, or null to invalidate.
 */
Game_Actor.prototype.setCachedApr = function(value)
{
  this._j._aptitude._cachedApr = value;
};

/**
 * Extends {@link #onBattlerDataChange}.<br/>
 * Invalidates the APR factor cache.
 */
J.APT.Aliased.Game_Actor.set('onBattlerDataChange', Game_Actor.prototype.onBattlerDataChange);
Game_Actor.prototype.onBattlerDataChange = function()
{
  // perform original logic.
  J.APT.Aliased.Game_Actor.get('onBattlerDataChange')
    .call(this);

  // invalidate the APR factor cache.
  this.setCachedApr(null);
};

/**
 * Gets all aptitude progress for this actor.
 * @returns {Record<string, AptitudeProgress>}
 */
Game_Actor.prototype.getAllAptitudeProgresses = function()
{
  // emergency initialize for existing saves.
  if (!this._j._aptitude) this.initAptitudeMembers();

  return this._j._aptitude._progress;
};

/**
 * Gets all learned aptitude skills for this actor.
 * @returns {Record<number, AptitudeSkill>}
 */
Game_Actor.prototype.getAllAptitudeSkillsLearned = function()
{
  // emergency initialize for existing saves.
  if (!this._j._aptitude) this.initAptitudeMembers();

  return this._j._aptitude._learned;
};

/**
 * Builds per‑skill aptitude aggregates across all current sources on this actor.
 * Each aggregate contains the database skill and all per‑source progress rows.
 * @returns {AptitudeSkillAggregate[]} The list of aggregates, one per skill id.
 */
Game_Actor.prototype.getAptitudeSkillAggregates = function()
{
  // acquire all aptitude progresses keyed by source.
  const progresses = this.getAllAptitudeProgresses();

  // build index keyed by skillId.
  /** @type {{ [skillId: string]: AptitudeSkillAggregate }} */
  const perSkill = {};

  // iterate each source → progress.
  Object.entries(progresses)
    .forEach(([ sourceKey, progress ]) =>
    {
      // iterate each learning under this progress.
      Object.entries(progress.learnings())
        .forEach(([ skillId, learning ]) =>
        {
          // create the aggregate if not present.
          if (!perSkill[skillId])
          {
            // retrieve the database skill for name/icon/desc.
            const skillData = this.skill(skillId);

            // initialize the aggregate bucket.
            perSkill[skillId] = new AptitudeSkillAggregate(skillId, skillData);
          }

          // build the per‑source row for this skill (now includes skillId).
          const row = new AptitudeSkillSourceProgress(
            sourceKey,
            skillId,
            learning.currentAp,
            learning.requiredAp,
            learning.isLearned()
          );

          // add this source row into the aggregate.
          perSkill[skillId].addSource(row);
        });
    });

  // return the aggregates as an array in numeric skillId order by default.
  return Object.values(perSkill)
    .sort((a, b) => a.skillId() - b.skillId());
};

/**
 * Gets the aptitude progress for the given key.
 * @param {string} key The key to get the progress for.
 * @returns {AptitudeProgress|null} The aptitude progress for the given key.
 */
Game_Actor.prototype.getAptitudeProgress = function(key)
{
  // emergency initialize for existing saves.
  if (!this._j._aptitude) this.initAptitudeMembers();

  // get the progress, or coalesce politely to null if it doesn't exist.
  return this._j._aptitude._progress[key] ?? null;
};

/**
 * Determines whether or not the actor has a progress for the given key.
 * @param {string} key The key to check for progress.
 * @returns {boolean} True if the actor has progress for the key, false otherwise.
 */
Game_Actor.prototype.hasAptitudeProgress = function(key)
{
  return this._j._aptitude._progress[key] !== undefined;
};

/**
 * Sets the aptitude progress for the given key, skill id, and current AP.
 * @param {string} key The key to set the progress for.
 * @param {number} skillId The skill id to learn.
 * @param {number} [currentAp] The current AP for the learning; defaults to 0.
 */
Game_Actor.prototype.setAptitudeProgress = function(key, skillId, currentAp = 0)
{
  // check if the progress exists.
  if (this.hasAptitudeProgress(key) === false) return;

  // grab the progress of the key.
  const progress = this.getAptitudeProgress(key);

  // update the progress with the new learning.
  progress.setLearning(skillId, currentAp);
};

/**
 * Initializes the aptitude progress for the given key, skill id, and current AP.
 * @param {string} key The key to create the progress for.
 * @param {number} skillId The skill id to learn.
 * @param {number} requiredAp The amount of AP required for the learning.
 * @param {number} currentAp The current AP for the learning.
 */
Game_Actor.prototype.initializeAptitudeProgress = function(key, skillId, requiredAp, currentAp = 0)
{
  // we don't have one, so create a new progress.
  const newProgress = this.createAptitudeProgress(key, skillId, requiredAp, currentAp);

  // update the mapping with the new progress.
  this._j._aptitude._progress[key] = newProgress;
};

/**
 * Creates a new aptitude progress for the given key and skill id.
 * @param {string} key The key to create the progress for.
 * @param {number} skillId The skill id to learn.
 * @param {number} requiredAp The amount of AP required for the learning.
 * @param {number} initialAp The initial AP to set for the learning.
 * @returns {AptitudeProgress} The created aptitude progress.
 */
Game_Actor.prototype.createAptitudeProgress = function(key, skillId, requiredAp, initialAp)
{
  // we don't have one, so create a new progress.
  const newProgress = new AptitudeProgress(key);

  // add the new learning to this progress with the initial AP.
  newProgress.setLearning(skillId, requiredAp, initialAp);

  // return the built aptitude progress.
  return newProgress;
};

/**
 * Gets the aptitude learning for the given key and skill id.
 * @param {string} key The key to get the learning for.
 * @param {number} skillId The skill id to learn.
 * @returns {AptitudeLearning|null} The aptitude learning for the given key and skill id, or null if it doesn't exist.
 */
Game_Actor.prototype.getAptitudeLearning = function(key, skillId)
{
  // check if we have an aptitude progress for the key.
  if (this.hasAptitudeProgress(key) === false) return null;

  // grab the progress of the key.
  const progress = this.getAptitudeProgress(key);

  // if its null, then the key didn't map to anything.
  if (progress.hasLearning(skillId) === false) return null;

  // return the learning.
  return progress.learningBySkillId(skillId);
};

/**
 * Gets all aptitude sources for this actor.
 * This is typed as {@link RPG_Base}, but can yield many of its subclasses.
 * @returns {(RPG_Actor|RPG_Class|RPG_EquipItem|RPG_Weapon|RPG_Armor|RPG_Skill|RPG_State)[]}
 */
Game_Actor.prototype.getAptitudeSources = function()
{
  // get literally everything.
  return this.getAllNotes()
    // exclude skills since we are learning skills.
    .filter(obj => obj.isSkill() === false);
};

/**
 * Gets whether or not this actor has the aptitude skill registered.
 * @param {number} skillId The skill id to check.
 * @returns {boolean} True if the actor has the aptitude skill registered, false otherwise.
 */
Game_Actor.prototype.hasAptitudeSkill = function(skillId)
{
  return this._j._aptitude._learned[skillId] !== undefined;
};

/**
 * Gets the aptitude skill for the given skill id.
 * @param {number} skillId The skill id to check.
 * @returns {AptitudeSkill|null} The aptitude skill for the given skill id, or null if it doesn't exist.
 */
Game_Actor.prototype.getAptitudeSkill = function(skillId)
{
  return this._j._aptitude._learned[skillId];
};

/**
 * Sets the aptitude skill for the given skill id.
 * @param {number} skillId The skill id to set.
 * @param {AptitudeSkill} aptitudeSkill The aptitude skill to set.
 */
Game_Actor.prototype.setAptitudeSkill = function(skillId, aptitudeSkill)
{
  // set the aptitude.
  this._j._aptitude._learned[skillId] = aptitudeSkill;
};

/**
 * Gets whether or not this actor has learned the given skill from an aptitude.
 * @param {number} skillId The skill id to check.
 * @returns {boolean} True if the actor has learned the skill, false otherwise.
 */
Game_Actor.prototype.hasLearnedAptitudeSkill = function(skillId)
{
  // if we don't have the aptitude skill, then we can't possibly have learned it.
  if (this.hasAptitudeSkill(skillId) === false) return false;

  // grab the aptitude skill.
  const aptitudeSkill = this.getAptitudeSkill(skillId);

  // return whether or not the skill is learned.
  return aptitudeSkill.learned === true;
};

/**
 * Marks the given skill as learned from an aptitude.
 * @param {number} skillId The skill id to mark as learned.
 * @param {string} sourceKey The source key for the aptitude.
 */
Game_Actor.prototype.learnAptitudeSkill = function(skillId, sourceKey)
{
  // don't process the learning if we already learned it.
  if (this.hasLearnedAptitudeSkill(skillId)) return;

  // check if we're missing the aptitude skill.
  if (this.hasAptitudeSkill(skillId) === false)
  {
    // create a new aptitude skill.
    const newAptitudeSkill = this.createAptitudeSkill(skillId);

    // set the aptitude skill.
    this.setAptitudeSkill(skillId, newAptitudeSkill);
  }

  // grab the aptitude skill.
  const aptitudeSkill = this.getAptitudeSkill(skillId);

  // grab the progress of the source key.
  const aptitudeProgress = this.getAptitudeProgress(sourceKey);

  // stamp the skill as learned with the given progress.
  aptitudeSkill.learnSkill(aptitudeProgress);
};

/**
 * Creates a new aptitude skill for the given skill id.
 * @param {number} skillId The skill id to create the skill for.
 * @param {boolean} [isLearned] Whether or not the skill is already learned; defaults to false.
 * @returns {AptitudeSkill} The created aptitude skill.
 */
Game_Actor.prototype.createAptitudeSkill = function(skillId, isLearned = false)
{
  // generate the new aptitude skill.
  return new AptitudeSkill(skillId, isLearned);
};
//endregion Game_Actor