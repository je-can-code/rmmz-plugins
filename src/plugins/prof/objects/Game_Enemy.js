//region Game_Enemy
J.PROF.Aliased.Game_Enemy.set("initMembers", Game_Enemy.prototype.initMembers);
Game_Enemy.prototype.initMembers = function()
{
  J.PROF.Aliased.Game_Enemy.get("initMembers")
    .call(this);

  /**
   * The J object where all my additional properties live.
   */
  this._j ||= {};

  /**
   * A grouping of all boosts this actor has can potentially consume.
   * @type {SkillProficiency[]}
   */
  this._j._profs ||= [];
};

/**
 * Gets all skill proficiencies for this enemy.
 * @returns {SkillProficiency[]}
 */
Game_Enemy.prototype.skillProficiencies = function()
{
  return this._j._profs;
};

/**
 * Gets a skill prof by its skill id.
 * @param {number} skillId The skill id.
 * @returns {SkillProficiency|null}
 */
Game_Enemy.prototype.skillProficiencyBySkillId = function(skillId)
{
  return this
    .skillProficiencies()
    .find(prof => prof.skillId === skillId);
};

/**
 * Adds a new skill prof to the collection.
 * @param {number} skillId The skill id.
 * @param {number} initialProficiency Optional. The starting prof.
 * @returns {SkillProficiency}
 */
Game_Enemy.prototype.addSkillProficiency = function(skillId, initialProficiency = 0)
{
  const exists = this.skillProficiencyBySkillId(skillId);
  if (exists)
  {
    console.warn(`Attempted to recreate skill proficiency for skillId: ${skillId}.<br>`);
    return exists;
  }

  const proficiency = new SkillProficiency(skillId, initialProficiency);
  this._j._profs.push(proficiency);
  this._j._profs.sort();
  return proficiency;
};

/**
 * A safe means of attempting to retrieve a skill proficiency. If the proficiency
 * does not exist, then it will be created with the default of zero starting proficiency.
 * @param {number} skillId The skill id to identify the proficiency for.
 * @returns {SkillProficiency}
 */
Game_Enemy.prototype.tryGetSkillProficiencyBySkillId = function(skillId)
{
  // look up the proficiency; this could be undefined
  // if we didn't learn it directly via .learnSkill() somehow.
  const exists = this.skillProficiencyBySkillId(skillId);
  if (exists)
  {
    // if we did find it, then return it.
    return exists;
  }
  else
  {
    // if we didn't find the proficiency, just add it.
    return this.addSkillProficiency(skillId);
  }
};

/**
 * Improves the skill prof by a given amount (defaults to 1).
 * @param {number} skillId The skill id.
 * @param {number} amount The amount to improve the prof by.
 */
Game_Enemy.prototype.increaseSkillProficiency = function(skillId, amount = 1)
{
  let proficiency = this.skillProficiencyBySkillId(skillId);

  // if the prof doesn't exist, create it first then improve it.
  if (!proficiency)
  {
    proficiency = this.addSkillProficiency(skillId);
  }

  proficiency.improve(amount);
};
//endregion Game_Enemy