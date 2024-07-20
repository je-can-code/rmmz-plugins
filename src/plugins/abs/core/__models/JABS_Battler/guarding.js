//region guarding
/**
 * Whether or not the precise-parry window is active.
 * @returns {boolean}
 */
JABS_Battler.prototype.parrying = function()
{
  return this._parryWindow > 0;
};

/**
 * Sets the battlers precise-parry window frames.
 * @param {number} parryFrames The number of frames available for precise-parry.
 */
JABS_Battler.prototype.setParryWindow = function(parryFrames)
{
  if (parryFrames < 0)
  {
    this._parryWindow = 0;
  }
  else
  {
    this._parryWindow = parryFrames;
  }
};

/**
 * Get whether or not this battler is currently guarding.
 * @returns {boolean}
 */
JABS_Battler.prototype.guarding = function()
{
  return this._isGuarding;
};

/**
 * Set whether or not this battler is currently guarding.
 * @param {boolean} isGuarding True if the battler is guarding, false otherwise.
 */
JABS_Battler.prototype.setGuarding = function(isGuarding)
{
  this._isGuarding = isGuarding;
};

/**
 * The flat amount to reduce damage by when guarding.
 * @returns {number}
 */
JABS_Battler.prototype.flatGuardReduction = function()
{
  if (!this.guarding()) return 0;

  return this._guardFlatReduction;
};

/**
 * Sets the battler's flat reduction when guarding.
 * @param {number} flatReduction The flat amount to reduce when guarding.
 */
JABS_Battler.prototype.setFlatGuardReduction = function(flatReduction)
{
  this._guardFlatReduction = flatReduction;
};

/**
 * The percent amount to reduce damage by when guarding.
 * @returns {number}
 */
JABS_Battler.prototype.percGuardReduction = function()
{
  if (!this.guarding()) return 0;

  return this._guardPercReduction;
};

/**
 * Sets the battler's percent reduction when guarding.
 * @param {number} percReduction The percent amount to reduce when guarding.
 */
JABS_Battler.prototype.setPercGuardReduction = function(percReduction)
{
  this._guardPercReduction = percReduction;
};

/**
 * Checks to see if retrieving the counter-guard skill id is appropriate.
 * @returns {number[]}
 */
JABS_Battler.prototype.counterGuard = function()
{
  return this.guarding()
    ? this.counterGuardIds()
    : [];
};

/**
 * Gets the id of the skill for counter-guarding.
 * @returns {number[]}
 */
JABS_Battler.prototype.counterGuardIds = function()
{
  return this._counterGuardIds;
};

/**
 * Sets the battler's retaliation id for guarding.
 * @param {number[]} counterGuardSkillIds The skill id to counter with while guarding.
 */
JABS_Battler.prototype.setCounterGuard = function(counterGuardSkillIds)
{
  this._counterGuardIds = counterGuardSkillIds;
};

/**
 * Checks to see if retrieving the counter-parry skill id is appropriate.
 * @returns {number[]}
 */
JABS_Battler.prototype.counterParry = function()
{
  return this.guarding()
    ? this.counterParryIds()
    : [];
};

/**
 * Gets the ids of the skill for counter-parrying.
 * @returns {number[]}
 */
JABS_Battler.prototype.counterParryIds = function()
{
  return this._counterParryIds;
};

/**
 * Sets the id of the skill to retaliate with when successfully precise-parrying.
 * @param {number[]} counterParrySkillIds The skill ids of the counter-parry skill.
 */
JABS_Battler.prototype.setCounterParry = function(counterParrySkillIds)
{
  this._counterParryIds = counterParrySkillIds;
};

/**
 * Gets the guard skill id most recently assigned.
 * @returns {number}
 */
JABS_Battler.prototype.getGuardSkillId = function()
{
  return this._guardSkillId;
};

/**
 * Sets the guard skill id to a designated skill id.
 *
 * This gets removed when guarding/parrying.
 * @param guardSkillId
 */
JABS_Battler.prototype.setGuardSkillId = function(guardSkillId)
{
  this._guardSkillId = guardSkillId;
};

/**
 * Gets all data associated with guarding for this battler.
 * @returns {JABS_GuardData|null}
 */
JABS_Battler.prototype.getGuardData = function(cooldownKey)
{
  // shorthand the battler of which we're getting data for.
  const battler = this.getBattler();

  // determine the skill in the given slot.
  const skillId = battler.getEquippedSkillId(cooldownKey);

  // if we have no skill to guard with, then we don't guard.
  if (!skillId) return null;

  // if the skill isn't a guard skill, then it won't have guard data.
  if (!JABS_Battler.isGuardSkillById(skillId)) return null;

  // get the skill.
  const skill = this.getSkill(skillId);

  // check also to make sure we can use the guard skill in the slot.
  const canUse = battler.meetsSkillConditions(skill);

  // if we cannot use the guard skill due to constraints, then we don't guard.
  if (!canUse) return null;

  // return the guard data off the skill.
  return skill.jabsGuardData;
};

/**
 * Determines whether or not the skill slot is a guard-type skill or not.
 * @param {string} cooldownKey The key to determine if its a guard skill or not.
 * @returns {boolean} True if it is a guard skill, false otherwise.
 */
JABS_Battler.prototype.isGuardSkillByKey = function(cooldownKey)
{
  // get the equipped skill in the given slot.
  const skillId = this.getBattler()
    .getEquippedSkillId(cooldownKey);

  // if we don't hve a skill id, it isn't a guard skill.
  if (!skillId) return false;

  // if it it isn't a guard skill by its id, then ... it isn't a guard skill.
  if (!JABS_Battler.isGuardSkillById(skillId)) return false;

  // its a guard skill!
  return true;
};

/**
 * Triggers and maintains the guard state.
 * @param {boolean} guarding True if the battler is guarding, false otherwise.
 * @param {string} skillSlot The skill slot to build guard data from.
 */
JABS_Battler.prototype.executeGuard = function(guarding, skillSlot)
{
  // if we're still guarding, and already in a guard state, don't reset.
  if (guarding && this.guarding()) return;

  // if not guarding anymore, turn off the guard state.
  if (!guarding && this.guarding())
  {
    // stop guarding.
    this.endGuarding();

    // stop processing.
    return;
  }

  // if we aren't guarding now, and weren't guarding before, don't do anything.
  if (!guarding) return;

  // if not guarding, wasn't guarding before, but want to guard, then let's guard!
  const guardData = this.getGuardData(skillSlot);

  // if we cannot guard, then don't try.
  if (!guardData || !guardData.canGuard()) return;

  // begin guarding!
  this.startGuarding(skillSlot);
};

/**
 * Begin guarding with the given skill slot.
 * @param {string} skillSlot The skill slot containing the guard data.
 */
JABS_Battler.prototype.startGuarding = function(skillSlot)
{
  // grab the guard data.
  const guardData = this.getGuardData(skillSlot);

  // begin guarding!
  this.setGuarding(true);
  this.setFlatGuardReduction(guardData.flatGuardReduction);
  this.setPercGuardReduction(guardData.percGuardReduction);
  this.setCounterGuard(guardData.counterGuardIds);
  this.setCounterParry(guardData.counterParryIds);
  this.setGuardSkillId(guardData.skillId);

  // calculate parry frames, include eva bonus to parry.
  const totalParryFrames = this.getBonusParryFrames(guardData) + guardData.parryDuration;

  // if the guarding skill has a parry window, apply those frames once.
  if (guardData.canParry()) this.setParryWindow(totalParryFrames);
};

/**
 * Ends the guarding stance for this battler.
 */
JABS_Battler.prototype.endGuarding = function()
{
  // end the guarding tracker.
  this.setGuarding(false);

  // remove any remaining parry time.
  this.setParryWindow(0);

  // stop posing.
  this.endAnimation();
};

/**
 * Abstraction of the definition of how to determine what the bonus to parry frames is.
 * @param {JABS_GuardData} guardData The guard data.
 * @returns {number}
 */
JABS_Battler.prototype.getBonusParryFrames = function(guardData)
{
  return Math.floor((this.getBattler().eva) * guardData.parryDuration);
};

/**
 * Counts down the parry window that occurs when guarding is first activated.
 */
JABS_Battler.prototype.countdownParryWindow = function()
{
  if (this.parrying())
  {
    this._parryWindow--;
  }

  if (this._parryWindow < 0)
  {
    this._parryWindow = 0;
  }
};
//endregion guarding
