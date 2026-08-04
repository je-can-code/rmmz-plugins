//region Game_Actor
import SkillProficiency from './../__models/SkillProficiency.js';
import ProficiencyRequirement from './../__models/ProficiencyRequirement.js';
import ProficiencyConditional from './../__models/ProficiencyConditional.js';

/**
 * Adds new properties to the actors that manage the skill prof system.
 */
J.PROF.Aliased.Game_Actor.set("initMembers", Game_Actor.prototype.initMembers);
Game_Actor.prototype.initMembers = function()
{
  // perform original logic.
  J.PROF.Aliased.Game_Actor.get("initMembers")
    .call(this);

  /**
   * The J object where all my additional properties live.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with the proficiency system.
   */
  this._j._proficiency ||= {};

  /**
   * All skill proficiencies earned by completing conditionals.
   * @type {SkillProficiency[]}
   */
  this._j._proficiency._proficiencies ||= [];

  /**
   * All conditionals that have been unlocked by this actor.
   * @type {string[]}
   */
  this._j._proficiency._unlockedConditionals ||= [];

  this._j._proficiency._bonusSkillProficiencyGains = 0;
};

/**
 * Gets all skill proficiencies for this actor.
 * @returns {SkillProficiency[]}
 */
Game_Actor.prototype.skillProficiencies = function()
{
  return this._j._proficiency._proficiencies;
};

/**
 * Adds a newly acquired proficiency to this actor.
 * @param {SkillProficiency} skillProficiency The newly acquired proficiency.
 */
Game_Actor.prototype.addNewSkillProficiency = function(skillProficiency)
{
  // add the new proficiency.
  this.skillProficiencies().push(skillProficiency);

  // sort them after adding in case the order changed.
  this.skillProficiencies().sort();
};

/**
 * Gets all of this actor's skill proficiency conditionals, locked and unlocked.
 * @returns {ProficiencyConditional[]}
 */
Game_Actor.prototype.proficiencyConditionals = function()
{
  return J.PROF.Metadata.actorConditionalsMap.get(this.actorId());
};

/**
 * Gets all of this actor's skill proficiency conditionals that have been unlocked.
 * @returns {string[]}
 */
Game_Actor.prototype.unlockedConditionals = function()
{
  return this._j._proficiency._unlockedConditionals;
};

/**
 * Registers a conditional as unlocked by its key.
 * @param {string} conditional The key of the conditional to unlock.
 */
Game_Actor.prototype.addUnlockedConditional = function(conditional)
{
  this.unlockedConditionals().push(conditional);
};

/**
 * Gets all of this actor's skill proficiency conditionals that include a requirement of the provided skillId.
 * @param {number} skillId The skill id to find conditionals for.
 * @returns {ProficiencyConditional[]}
 */
Game_Actor.prototype.proficiencyConditionalBySkillId = function(skillId)
{
  return this.proficiencyConditionals()
    .filter(conditional => conditional.requirements.some(requirement => requirement.skillId === skillId));
};

/**
 * Checks whether or not a conditional has been unlocked by its key.
 * @param key {string} The key of the conditional.
 * @returns {boolean}
 */
Game_Actor.prototype.isConditionalUnlocked = function(key)
{
  return this.unlockedConditionals()
    .includes(key);
};

/**
 * Gets all currently locked skill proficiency conditionals.
 * @returns {ProficiencyConditional[]}
 */
Game_Actor.prototype.lockedConditionals = function()
{
  return this.proficiencyConditionals()
    .filter(conditional => this.isConditionalUnlocked(conditional.key) === false);
};

/**
 * Unlocks a skill proficiency conditional by its key.
 * @param key {string} The key of the conditional.
 */
Game_Actor.prototype.unlockConditional = function(key)
{
  if (this.isConditionalUnlocked(key))
  {
    console.warn(`Attempted to unlock conditional: [${key}], but it was already unlocked.`);
    return;
  }

  this.addUnlockedConditional(key);
};

/**
 * Executes the reward listed in the skill proficiency conditional.
 * @param conditional {ProficiencyConditional} The conditional containing the reward.
 */
Game_Actor.prototype.executeConditionalReward = function(conditional)
{
  this.executeSkillRewards(conditional);
  this.executeJsRewards(conditional);
};

/**
 * Teaches this actor all skills listed (if any) in the skill rewards
 * of a skill proficiency conditional.
 * @param conditional {ProficiencyConditional} The conditional containing the reward.
 */
Game_Actor.prototype.executeSkillRewards = function(conditional)
{
  // grab the skill rewards for the conditional.
  const { skillRewards } = conditional;

  // if we don't have any skills to learn, then skip.
  if (!skillRewards.length) return;

  // teach all skills in the list to this actor from this conditional.
  skillRewards.forEach(this.learnSkill, this);

  // announce each taught skill while the conditional that granted it is still in scope. this uses an
  // explicit arrow rather than a bare method reference because forEach also passes the index and the
  // source array, which would silently land in any additional parameters this handler ever gains.
  skillRewards.forEach(skillId => this.handleProficiencySkillLearnedLog(conditional, skillId));
};

/**
 * Generates a dia log announcing that this actor earned a skill by way of weapon proficiency.
 * The skill's own message fields act as per-skill overrides for either line, allowing an author to
 * give a notable skill its own voice without touching this default phrasing.
 * @param {ProficiencyConditional} conditional The conditional whose rewards were just granted.
 * @param {number} skillId The id of the skill that was taught.
 */
Game_Actor.prototype.handleProficiencySkillLearnedLog = function(conditional, skillId)
{
  // the dia log is optional- when J-Log is absent there is simply nowhere to announce this.
  if (!J.LOG) return;

  // grab the skill so its name and message overrides can be read.
  const skill = this.skill(skillId);

  // resolve a player-facing label for what was being practiced to earn this reward.
  const sourceName = this.proficiencySourceLabel(conditional);

  // the skill's own message1 wins when authored; otherwise fall back to the proficiency phrasing.
  const headline = skill.message1 || `\\C[1]${this.name()}\\C[0] learned \\C[1]${skill.name}\\C[0] from ${sourceName} proficiency!`;

  // the skill's own message2 wins when authored; otherwise remind the player it must be equipped.
  const instruction = skill.message2 || 'Equip it from the skills menu to use it.';

  // build the two-line log wearing this actor's face so the player knows who grew.
  const log = new DiaLogBuilder().addLine(headline)
    .addLine(instruction)
    .setFaceName(this.faceName())
    .setFaceIndex(this.faceIndex())
    .build();

  // push it into the dia log for display.
  $diaLogManager.addLog(log);
};

/**
 * Derives a player-facing label describing what was practiced to satisfy a proficiency conditional.
 * Proficiency is tracked per-skill rather than per-weapon-family- a conditional is satisfied by using
 * one specific skill enough times- so the practiced skill itself is what the player actually did, and
 * naming anything broader would misdescribe the accomplishment. The conditional's own key is an
 * authoring slug such as "blade-1h-01", so it is never shown.
 * @param {ProficiencyConditional} conditional The conditional to describe.
 * @returns {string}
 */
Game_Actor.prototype.proficiencySourceLabel = function(conditional)
{
  // the first requirement is the skill whose proficiency drives this conditional.
  const primaryRequirement = conditional.requirements.at(0);

  // a conditional authored with no requirements cannot describe itself any further.
  if (!primaryRequirement) return 'combat';

  // grab the skill that was being practiced to earn this reward.
  const practicedSkill = this.skill(primaryRequirement.skillId);

  // a requirement pointing at a skill that no longer exists cannot name itself either.
  if (!practicedSkill) return 'combat';

  // the practiced skill is the proficiency- name it directly.
  return practicedSkill.name;
};

/**
 * Performs the arbitrary javascript provided in the skill proficiency conditional-
 * but with guardrails to ensure it doesn't blow up the game.
 * @param conditional {ProficiencyConditional} The conditional containing the reward.
 */
Game_Actor.prototype.executeJsRewards = function(conditional)
{
  // if we don't actually have any javascript to execute, then don't bother.
  if (!conditional.jsRewards) return;

  const a = this;
  const c = conditional;
  const { jsRewards } = c;
  try
  {
    // 'a' is the actor, 'c' is the conditional — match the original eval scope.
    new Function('a', 'c', jsRewards)(a, c);
  }
  catch (error)
  {
    console.error(`there was an error executing the reward for: ${c.key}.<br>`);
    console.log(error);
  }
};

/**
 * Gets a skill proficiency by its skill id.
 *
 * This will return `undefined` if the skill proficiency
 * has not yet been generated.
 * @param {number} skillId The skill id.
 * @returns {SkillProficiency|null}
 */
Game_Actor.prototype.skillProficiencyBySkillId = function(skillId)
{
  return this
    .skillProficiencies()
    .find(skillProficiency => skillProficiency.skillId === skillId);
};

/**
 * A safe means of attempting to retrieve a skill proficiency. If the proficiency
 * does not exist, then it will be created with the default of zero starting proficiency.
 * @param {number} skillId The skill id to identify the proficiency for.
 * @returns {SkillProficiency}
 */
Game_Actor.prototype.tryGetSkillProficiencyBySkillId = function(skillId)
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
 * Adds a new skill proficiency to the collection.
 * @param {number} skillId The skill id.
 * @param {number=} initialProficiency Optional. The starting prof.
 * @returns {SkillProficiency} The skill proficiency added.
 */
Game_Actor.prototype.addSkillProficiency = function(skillId, initialProficiency = 0)
{
  const exists = this.skillProficiencyBySkillId(skillId);
  if (exists)
  {
    console.warn(`Attempted to recreate skill proficiency for skillId: ${skillId}.`);
    return exists;
  }

  // generate the new proficiency.
  const proficiency = new SkillProficiency(skillId, initialProficiency);

  // add it to the collection.
  this.addNewSkillProficiency(proficiency);

  // return the newly generated proficiency.
  return proficiency;
};

/**
 * Extends skill learning to add new skill proficiencies if we learned new skills.
 */
J.PROF.Aliased.Game_Actor.set("onLearnNewSkill", Game_Actor.prototype.onLearnNewSkill);
Game_Actor.prototype.onLearnNewSkill = function(skillId)
{
  // perform original logic.
  J.PROF.Aliased.Game_Actor.get("onLearnNewSkill")
    .call(this, skillId);

  // add the skill proficiency.
  this.addSkillProficiency(skillId);
};

/**
 * Improves the skill prof by a given amount (defaults to 1).
 * @param {number} skillId The skill id.
 * @param {number} amount The amount to improve the prof by.
 */
Game_Actor.prototype.increaseSkillProficiency = function(skillId, amount = 1)
{
  // get or create anew the skill proficiency associated with the skill id.
  const proficiency = this.tryGetSkillProficiencyBySkillId(skillId);

  // improve the proficiency of the skill.
  proficiency.improve(amount);

  // re-evaluate all conditionals to see if this resulted in unlocking any.
  this.evaluateProficiencyConditionals();
};

/**
 * Check all proficiency conditionals to see if any of them are now met.
 */
Game_Actor.prototype.evaluateProficiencyConditionals = function()
{
  // grab all the currently-locked proficiency conditionals for this actor.
  const lockedConditionals = this.lockedConditionals();

  // if we don't have any locked conditionals, then don't process.
  if (!lockedConditionals.length) return;

  // check each locked conditional to see if we can unlock it.
  lockedConditionals.forEach(this.evaluateProficiencyConditional, this);
};

/**
 * Checks the conditional to see if requirements are met to unlock it.
 * @param {ProficiencyConditional} conditional The conditional being evaluated.
 */
Game_Actor.prototype.evaluateProficiencyConditional = function(conditional)
{
  const allRequirementsMet = conditional.requirements.every(this.isRequirementMet, this);

  // check if the requirements are all met for unlocking.
  if (allRequirementsMet)
  {
    this.unlockConditional(conditional.key);
    this.executeConditionalReward(conditional);
  }
};

/**
 * Validates whether or not a proficiency requirement is met.
 * @param {ProficiencyRequirement} requirement The requirement being evaluated.
 * @returns {boolean}
 */
Game_Actor.prototype.isRequirementMet = function(requirement)
{
  // compute the current accumulated proficiency for the requirement based on this actor.
  const accumulatedProficiency = requirement.totalProficiency(this);

  // check if the proficiency for the skill has reached or exceeded the conditional.
  return accumulatedProficiency >= requirement.proficiency;
};

/**
 * Extends {@link #onBattlerDataChange}.<br/>
 * Also updates bonus skill proficiency gains.
 */
J.PROF.Aliased.Game_Actor.set('onBattlerDataChange', Game_Actor.prototype.onBattlerDataChange);
Game_Actor.prototype.onBattlerDataChange = function()
{
  // perform original logic.
  J.PROF.Aliased.Game_Actor.get('onBattlerDataChange')
    .call(this);

  // update the skill gains as well.
  this.updateBonusSkillProficiencyGains();
};

/**
 * Updates the skill proficiency gains for this actor.
 */
Game_Actor.prototype.updateBonusSkillProficiencyGains = function()
{
  // TEMPORARY FIX FOR UPDATING SAVES IN PROGRESS.
  if (this.bonusSkillProficiencyGains() === undefined
    || this.bonusSkillProficiencyGains() === null)
  {
    this.setBonusSkillProficiencyGains(0);
  }

  this.setBonusSkillProficiencyGains(RPGManager.getSumFromAllNotesByRegex(
    this.getAllNotes(),
    J.PROF.RegExp.ProficiencyBonus))
};

/**
 * Bonus proficiency gained when earning skill proficiency.
 */
Object.defineProperty(Game_Actor.prototype, 'prof', {
  get: function()
  {
    // J-SDP is optional, so its contribution is only asked for when that plugin is present.
    const sdpBonus = J.SDP
      ? this.getSdpBonusForParameterKey('prof', 1)
      : 0;
    return this._j._proficiency._bonusSkillProficiencyGains + sdpBonus;
  },
  configurable: true,
});

//region properties
/**
 * Gets the bonus skill proficiency gains.
 * @returns {number} The bonusSkillProficiencyGains.
 */
Game_Actor.prototype.bonusSkillProficiencyGains = function()
{
  // hand back the bonus skill proficiency gains.
  return this._j._proficiency._bonusSkillProficiencyGains;
};

/**
 * Sets the bonus skill proficiency gains.
 * @param {number} newBonusSkillProficiencyGains The new bonusSkillProficiencyGains.
 */
Game_Actor.prototype.setBonusSkillProficiencyGains = function(newBonusSkillProficiencyGains)
{
  // assign the bonus skill proficiency gains.
  this._j._proficiency._bonusSkillProficiencyGains = newBonusSkillProficiencyGains;
};
//endregion properties
//endregion Game_Actor