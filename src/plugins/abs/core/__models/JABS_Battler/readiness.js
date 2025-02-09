//region isReady & cooldowns
/**
 * Initializes a cooldown with the given key.
 * @param {string} cooldownKey The key of this cooldown.
 * @param {number} duration The duration to initialize this cooldown with.
 */
JABS_Battler.prototype.initializeCooldown = function(cooldownKey, duration)
{
  // grab the slot being worked with.
  const skillSlot = this.getBattler()
    .getSkillSlot(cooldownKey);

  // if we don't have a slot, then do not process.
  if (!skillSlot) return;

  // set the skillslot's cooldown frames to the default.
  skillSlot.getCooldown()
    .setFrames(duration);
};

/**
 * Gets the cooldown data for a given cooldown key.
 * @param {string} cooldownKey The cooldown to lookup.
 * @returns {JABS_Cooldown}
 */
JABS_Battler.prototype.getCooldown = function(cooldownKey)
{
  // grab the slot of the given key.
  const skillSlot = this.getBattler()
    .getSkillSlot(cooldownKey);

  // check that there is a skill slot.
  if (!skillSlot)
  {
    console.warn('omg');

    // TODO: make sure enemies get assigned their slots.

    return null;
  }

  return skillSlot.getCooldown();
};

/**
 * Gets the cooldown and skill slot data for a given key.
 * @param {string} key The slot to get the data for.
 * @returns {{ cooldown: JABS_Cooldown, skillslot: JABS_SkillSlot }}
 */
JABS_Battler.prototype.getActionKeyData = function(key)
{
  const cooldown = this.getCooldown(key);
  const skillslot = this.getBattler()
    .getSkillSlot(key);

  if (!cooldown || !skillslot) return null;

  return {
    cooldown,
    skillslot
  }
};

/**
 * Whether or not this battler has finished it's post-action cooldown phase.
 * @returns {boolean} True if the battler is cooled down, false otherwise.
 */
JABS_Battler.prototype.isPostActionCooldownComplete = function()
{
  if (this._postActionCooldownComplete)
  {
    // we are ready to do idle things.
    return true;
  }

  if (this._postActionCooldown <= this._postActionCooldownMax)
  {
    // we are still charging up...
    this._postActionCooldown++;
    return false;
  }
  this._postActionCooldownComplete = true;
  this._postActionCooldown = 0;

  // we are ready to finish phase3!
  return true;

};

/**
 * Starts the post-action cooldown for this battler.
 * @param {number} cooldown The cooldown duration.
 */
JABS_Battler.prototype.startPostActionCooldown = function(cooldown)
{
  this._postActionCooldownComplete = false;
  this._postActionCooldown = 0;
  this._postActionCooldownMax = cooldown;
};

/**
 * Retrieves the battler's idle state.
 * @returns {boolean} True if the battler is idle, false otherwise.
 */
JABS_Battler.prototype.isIdle = function()
{
  return this._idle;
};

/**
 * Sets whether or not this battler is idle.
 * @param {boolean} isIdle True if this battler is idle, false otherwise.
 */
JABS_Battler.prototype.setIdle = function(isIdle)
{
  this._idle = isIdle;
};

/**
 * Whether or not this battler is ready to perform an idle action.
 * @returns {boolean} True if the battler is idle-ready, false otherwise.
 */
JABS_Battler.prototype.isIdleActionReady = function()
{
  if (this._idleActionReady)
  {
    // we are ready to do idle things.
    return true;
  }

  if (this._idleActionCount <= this._idleActionCountMax)
  {
    // we are still charging up...
    this._idleActionCount++;
    return false;
  }
  this._idleActionReady = true;
  this._idleActionCount = 0;

  // we are ready to idle!
  return true;

};

/**
 * Whether or not the skilltype has a base or combo cooldown ready.
 * @param {string} cooldownKey The cooldown key to check readiness for.
 * @returns {boolean} True if the given skilltype is ready, false otherwise.
 */
JABS_Battler.prototype.isSkillTypeCooldownReady = function(cooldownKey)
{
  const isAnyReady = this.getBattler()
    .getSkillSlotManager()
    .isAnyCooldownReadyForSlot(cooldownKey);
  return isAnyReady;
};

/**
 * Modifies the cooldown for this key by a given amount.
 * @param {string} cooldownKey The key of this cooldown.
 * @param {number} duration The duration of this cooldown.
 */
JABS_Battler.prototype.modCooldownCounter = function(cooldownKey, duration)
{
  this.getCooldown(cooldownKey)
    .modBaseFrames(duration);
};

/**
 * Set the cooldown timer to a designated number.
 * @param {string} cooldownKey The key of this cooldown.
 * @param {number} duration The duration of this cooldown.
 */
JABS_Battler.prototype.setCooldownCounter = function(cooldownKey, duration)
{
  this.getCooldown(cooldownKey)
    .setFrames(duration);
};

/**
 * Resets this battler's combo information.
 * @param {string} cooldownKey The key of this cooldown.
 */
JABS_Battler.prototype.resetComboData = function(cooldownKey)
{
  this.getBattler()
    .getSkillSlotManager()
    .getSkillSlotByKey(cooldownKey)
    .resetCombo();
};

/**
 * Sets the combo frames to be a given value.
 * @param {string} cooldownKey The key associated with the cooldown.
 * @param {number} duration The number of frames until this combo action is ready.
 */
JABS_Battler.prototype.setComboFrames = function(cooldownKey, duration)
{
  this.getCooldown(cooldownKey)
    .setComboFrames(duration);
};

/**
 * Whether or not this battler is ready to take action of any kind.
 * @returns {boolean} True if the battler is ready, false otherwise.
 */
JABS_Battler.prototype.isActionReady = function()
{
  if (this._prepareReady)
  {
    // we are ready to take action.
    return true;
  }

  if (this._prepareCounter < this._prepareMax)
  {
    // we are still charging up...
    this._prepareCounter++;
    return false;
  }

  this._prepareReady = true;
  this._prepareCounter = 0;
  // we are charged up now!
  return true;

};

/**
 * Determines the number of frames between opportunity to take the next action.
 * This maps to time spent in phase1 of JABS AI.
 * @returns {number} The number of frames between actions.
 */
JABS_Battler.prototype.getPrepareTime = function()
{
  return this.getBattler()
    .prepareTime();
};

/**
 * Determines whether or not a skill can be executed based on restrictions or not.
 * This is used by AI.
 * @param {number} chosenSkillId The skill id to be executed.
 * @returns {boolean} True if this skill can be executed, false otherwise.
 */
JABS_Battler.prototype.canExecuteSkill = function(chosenSkillId)
{
  // if there is no chosen skill, then we obviously cannot execute it.
  if (!chosenSkillId) return false;

  // check if the battler can use skills.
  const canUseSkills = this.canBattlerUseSkills();

  // check if the battler can use basic attacks.
  const canUseAttacks = this.canBattlerUseAttacks();

  // if can't use basic attacks or skills, then autofail.
  if (!canUseSkills && !canUseAttacks)
  {
    return false;
  }

  // check if the chosen skill is the enemy's basic attack.
  const isBasicAttack = this.isSkillIdBasicAttack(chosenSkillId);

  // check if basic attacks are blocked plus this being a basic attack.
  if (!canUseAttacks && isBasicAttack)
  {
    // if the skill is a basic attack, but the battler can't attack, then fail.
    return false;
  }

  // if the skill is an assigned skill, but the battler can't use skills, then fail.
  if (!canUseSkills && !isBasicAttack)
  {
    return false;
  }

  // check if this battler can pay the costs for the given skill id.
  if (!this.canPaySkillCost(chosenSkillId))
  {
    // cannot pay the cost.
    return false;
  }

  // build the cooldown key based on the skill data.
  const skillSlotKey = this.getCooldownKeyBySkillId(chosenSkillId);

  // check to make sure we have a key.
  if (!skillSlotKey)
  {
    // if there is no key, then this skill clearly isn't ready.
    return false;
  }

  // grab the cooldown itself.
  const cooldown = this.getCooldown(skillSlotKey);

  // check if the skill was actually a remembered effective skill from a follower.
  if (!cooldown)
  {
    // please stop trying to cast your follower's skills.
    console.warn(this, skillSlotKey);
    console.trace();
    return false;
  }

  // check if the chosen skill is actually a combo for this slot.
  const isCombo = this.getBattler()
    .getSkillSlot(skillSlotKey).comboId === chosenSkillId;

  // check if the base is off cooldown yet.
  if (!isCombo && !cooldown.isBaseReady())
  {
    // cooldown is not ready yet.
    return false;
  }

  // cast the skill!
  return true;
};

/**
 * Gets the key of the cooldown based on the given skill id from this battler.
 * @param {number} skillId The id of the skill to retrieve a key for.
 * @returns {null|string} Null if the skill wasn't found in the slots, the key otherwise.
 */
JABS_Battler.prototype.getCooldownKeyBySkillId = function(skillId)
{
  // handle accordingly for enemies.
  if (this.isEnemy())
  {
    // grab the skill itself.
    const skill = this.getSkill(skillId);

    // return the arbitrary key.
    return `${skill.id}-${skill.name}`;
  }
  // handle accordingly for actors.
  else if (this.isActor())
  {
    // grab the first slot that the id lives in.
    const slot = this.getBattler()
      .findSlotForSkillId(skillId);

    // if there is no slot with this skill, then its not a basic attack.
    if (!slot) return null;

    // return the found key.
    return slot.key;
  }

  // if somehow it is neither actor nor enemy, then return global.
  return J.ABS.Globals.GlobalCooldownKey;
};

/**
 * Determines whether or not the given skill id is actually a basic attack
 * skill used by this battler. Basic attack includes main and off hands.
 * @param {number} skillId The skill id to check.
 * @returns {boolean} True if the skill is a basic attack, false otherwise.
 */
JABS_Battler.prototype.isSkillIdBasicAttack = function(skillId)
{
  // handle accordingly if an enemy.
  if (this.isEnemy())
  {
    // grab the enemy basic attack.
    const basicAttackSkillId = this.getEnemyBasicAttack();

    // check if the chosen skill is the enemy's basic attack.
    return (skillId === basicAttackSkillId);
  }
  // handle accordingly if an actor.
  else if (this.isActor())
  {
    // grab the first slot that the id lives in.
    const slot = this.getBattler()
      .findSlotForSkillId(skillId);

    // if there is no slot with this skill, then its not a basic attack.
    if (!slot) return false;

    // if the slot key matches our mainhand, then it is a basic attack.
    return (slot.key === JABS_Button.Mainhand || slot.key === JABS_Button.Offhand);
  }

  // handle accordingly if not actor or enemy.
  console.warn(`non-actor/non-enemy checked for basic attack.`, this);
  return false;
};

/**
 * Gets the proper skill based on the skill id.
 * Accommodates J-SkillExtend and/or J-Passives.
 * @param {number} skillId The skill id to retrieve.
 * @returns {RPG_Skill|null}
 */
JABS_Battler.prototype.getSkill = function(skillId)
{
  // check to make sure we actually have a skill id first.
  if (!skillId)
  {
    // return null if we do not.
    return null;
  }

  // return the skill assocaited with the underlying battler.
  return this.getBattler()
    .skill(skillId);
};

/**
 * Determines whether or not this battler can pay the cost of a given skill id.
 * Accommodates skill extensions.
 * @param {number} skillId The skill id to check.
 * @returns {boolean} True if this battler can pay the cost, false otherwise.
 */
JABS_Battler.prototype.canPaySkillCost = function(skillId)
{
  // if the skill cost is more than the battler has resources for, then fail.
  const skill = this.getSkill(skillId);

  // check if the battler can pay the cost.
  if (!this.getBattler()
    .canPaySkillCost(skill))
  {
    return false;
  }

  // we can pay the cost!
  return true;
};
//endregion isReady & cooldowns
