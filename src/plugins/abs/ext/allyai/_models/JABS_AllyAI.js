//region JABS_AllyAI
/**
 * A class representing the AI-decision-making functionality for allies.
 */
function JABS_AllyAI()
{
  this.initialize(...arguments);
}

JABS_AllyAI.prototype = Object.create(JABS_AI.prototype);
JABS_AllyAI.prototype.constructor = JABS_AllyAI;

//region statics
/**
 * The strict enumeration of what ai modes are available for ally ai.
 */
JABS_AllyAI.modes = {
  /**
   * When this mode is assigned, the battler will take no action.
   * @type {JABS_AllyAIMode}
   */
  DO_NOTHING: {
    key: "do-nothing",
    name: J.ABS.EXT.ALLYAI.Metadata.AiModeDoNothingText,
    description: "Take no action.\nThis ally will literally do nothing except maybe stand there.",
  },

  /**
   * When this mode is assigned, the battler will only use their mainhand attack skill.
   * If no skill is equipped in their main hand, they will do nothing.
   * @type {JABS_AllyAIMode}
   */
  BASIC_ATTACK: {
    key: "basic-attack",
    name: J.ABS.EXT.ALLYAI.Metadata.AiModeOnlyAttackText,
    description: "Focus on basic attacking.\nIn fact, \\_only\\_ basic attacks will be used.",
  },

  /**
   * When this mode is assigned, the battler will intelligently decide from any skill they have equipped.
   * @type {JABS_AllyAIMode}
   */
  VARIETY: {
    key: "variety",
    name: J.ABS.EXT.ALLYAI.Metadata.AiModeVarietyText,
    description: "Spread strategy across all skills.\nThis ally will execute skills based on their current situation.",
  },

  /**
   * When this mode is assigned, the battler will use the biggest and strongest skills available.
   * @type {JABS_AllyAIMode}
   */
  FULL_FORCE: {
    key: "full-force",
    name: J.ABS.EXT.ALLYAI.Metadata.AiModeFullForceText,
    description: "Emphasize dealing the most damage with skills.\nThis ally won't do much other than skills.",
  },

  /**
   * When this mode is assigned, the battler will prioritize supporting and healing allies.
   * @type {JABS_AllyAIMode}
   */
  SUPPORT: {
    key: "support",
    name: J.ABS.EXT.ALLYAI.Metadata.AiModeSupportText,
    description: "Relegate to the support role.\nThis ally will try to keep you and other allies alive.",
  },
};

/**
 * Gets all valid values of the possible modes currently implemented.
 * @returns {JABS_AllyAIMode[]}
 */
JABS_AllyAI.getModes = () => Object
  .keys(JABS_AllyAI.modes)
  .map(key => JABS_AllyAI.modes[key]);

/**
 * Validates the input of a mode to ensure it is one of the available and implemented ally ai modes.
 * @param {string} potentialMode The mode to validate.
 * @returns {boolean}
 */
JABS_AllyAI.validateMode = potentialMode => JABS_AllyAI
  .getModes()
  .find(mode => mode.key === potentialMode);
//endregion statics

//region initialize
/**
 * Initializes this class.
 * @param {string} initialMode The mode to start out in.
 */
JABS_AllyAI.prototype.initialize = function(initialMode)
{
  this.mode = initialMode;
  this.initMembers();
};

/**
 * Initializes all default members of this class.
 */
JABS_AllyAI.prototype.initMembers = function()
{
  /**
   * The collection of memories this ally ai possesses.
   * @type {JABS_BattleMemory[]}
   */
  this.memory = [];
};
//endregion initialize

//region mode
/**
 * Gets the current mode this ally's AI is set to.
 * @returns {string}
 */
JABS_AllyAI.prototype.getMode = function()
{
  return this.mode;
};

/**
 * Changes the current AI mode this ally is set to.
 * @param {string} newMode
 */
JABS_AllyAI.prototype.changeMode = function(newMode)
{
  if (!JABS_AllyAI.validateMode(newMode))
  {
    console.error(`Attempted to assign ally ai mode: [${newMode}], but is not a valid ai mode.`);
    return;
  }

  this.mode = newMode;
};
//endregion mode

//region decide action
/**
 * Wraps a base support helper result (0 means none) as a uniform skill-id list.
 * @param {number} skillId
 * @returns {number[]}
 */
JABS_AllyAI.prototype.wrapSupportSkillId = function(skillId)
{
  if (!skillId) return [];
  return [ skillId ];
};

/**
 * Decides an action based on this battler's AI, the target, and the given available skills.
 * @param {JABS_Battler} user The battler of the AI deciding a skill.
 * @param {JABS_Battler} target The target battler to decide an action against.
 * @param {number[]} availableSkills A collection of all skill ids to potentially pick from.
 * @returns {number[]} Exactly one skill id, or empty when no valid choice exists.
 */
JABS_AllyAI.prototype.decideAction = function(user, target, availableSkills)
{
  // filter out the unusable or invalid skills.
  const usableSkills = this.filterUncastableSkills(user, availableSkills);

  // determine which AI mode the ally is assigned.
  const currentMode = this.getMode();

  // pivot on the ai mode selected to decide what skill to use.
  switch (currentMode)
  {
    case JABS_AllyAI.modes.DO_NOTHING.key:
      return this.decideDoNothing(user);
    case JABS_AllyAI.modes.BASIC_ATTACK.key:
      return this.decideBasicAttack(usableSkills, user);
    case JABS_AllyAI.modes.VARIETY.key:
      return this.decideVariety(usableSkills, user, target);
    case JABS_AllyAI.modes.FULL_FORCE.key:
      return this.decideFullForce(usableSkills, user, target);
    case JABS_AllyAI.modes.SUPPORT.key:
      return this.decideSupport(usableSkills, user);
    default:
    {
      const fallbackId = usableSkills.at(0);
      return this.isSkillIdValid(fallbackId) ? [ fallbackId ] : [];
    }
  }
};

//region do-nothing
/**
 * Decides to do nothing and waits a short amount of time before doing anything else.
 * @returns {number[]}
 */
JABS_AllyAI.prototype.decideDoNothing = function(attacker)
{
  // forces a short wait before thinking about what to do next.
  attacker.setWaitCountdown(20);

  return [];
};
//endregion do-nothing

//region basic-attack
/**
 * Decides a skill id based on the ai mode of "basic attack only".
 * @param {number[]} usableSkills The skill ids available to choose from.
 * @param {JABS_Battler} user The battler choosing the skill.
 * @returns {number[]}
 */
JABS_AllyAI.prototype.decideBasicAttack = function(usableSkills, user)
{
  // check first if we should follow with the next hit of the combo.
  if (this.shouldFollowWithCombo(user))
  {
    return [ this.followWithCombo(user) ];
  }

  // determine which skill of the skills available is the mainhand skill.
  const mainBasicAttackSkillId = usableSkills
    .find(id => user.getBattler()
      .findSlotForSkillId(id).key === JABS_Button.Mainhand);

  // determine which skill of the skills available is the offhand skill.
  const offhandBasicAttackSkillId = usableSkills
    .find(id => user.getBattler()
      .findSlotForSkillId(id).key === JABS_Button.Offhand);

  // if we have neither basic attack skills, then do not process.
  if (!mainBasicAttackSkillId && !offhandBasicAttackSkillId) return [];

  // check if we have to decide between using mainhand or offhand.
  if (mainBasicAttackSkillId && offhandBasicAttackSkillId)
  {
    const picked = RPGManager.chanceIn100(70)
      ? mainBasicAttackSkillId
      : offhandBasicAttackSkillId;
    return [ picked ];
  }

  // check if we do not have a mainhand skill.
  if (!mainBasicAttackSkillId)
  {
    return [ offhandBasicAttackSkillId ];
  }

  return [ mainBasicAttackSkillId ];
};
//endregion basic-attack

//region variety
/**
 * Decides a skill id based on the ai mode of "variety".
 * If no allies are in danger, then simply chooses a random skill.
 * Will learn over time which skills are effective and ineffective against targets.
 * May use a support skill if allies are below half health.
 * @param {number[]} usableSkills The skill ids available to choose from.
 * @param {JABS_Battler} user The battler choosing the skill.
 * @param {JABS_Battler} target The targeted battler to use the skill against.
 * @returns {number[]}
 */
JABS_AllyAI.prototype.decideVariety = function(usableSkills, user, target)
{
  // check first if we should follow with the next hit of the combo.
  if (this.shouldFollowWithCombo(user))
  {
    return [ this.followWithCombo(user) ];
  }

  // chosen in one of the branches below; validated before return.
  let chosenSkillId;

  // locally capture the list of usable skills for modification.
  let tempAvailableSkills = usableSkills;

  // check if any nearby allies are "in danger".
  const nearbyAllies = user.getAllNearbyAllies();
  const anyAlliesInDanger = nearbyAllies.some(battler => battler.getBattler()
    .currentHpPercent() < 0.6);

  // if they are allies in danger, 50:50 chance to instead prioritize a support action.
  if (anyAlliesInDanger && Math.randomInt(2) === 0)
  {
    return this.decideSupport(usableSkills, user);
  }

  // grab all memories that this battler has of the target.
  const memoriesOfTarget = this.memory.filter(mem => mem.battlerId === target.getBattlerId());

  // filter all available skills down to what we recall as effective.
  if (memoriesOfTarget.length)
  {
    tempAvailableSkills = this.filterMemoriesByEffectiveness(tempAvailableSkills, memoriesOfTarget);
  }

  // if no skill was effective, or there were no memories, just pick a random skill and call it good.
  if (tempAvailableSkills.length === 0)
  {
    chosenSkillId = usableSkills.at(Math.randomInt(usableSkills.length));
  }

  // if the memories yielded a single effective skill, then 50/50 between that and a random skill.
  if (tempAvailableSkills.length === 1)
  {
    chosenSkillId = Math.randomInt(2) === 0
      ? tempAvailableSkills[0]
      : usableSkills[Math.randomInt(usableSkills.length)];
  }

  // if there were multiple memories of effective skills against the target, then randomly pick one.
  if (tempAvailableSkills.length > 1)
  {
    chosenSkillId = tempAvailableSkills[Math.randomInt(tempAvailableSkills.length)];
  }

  if (!this.isSkillIdValid(chosenSkillId)) return [];
  return [ chosenSkillId ];
};
//endregion variety

//region full-force
/**
 * Decides a skill id based on the ai mode of "full-force".
 * Always looks to choose the skill that will deal the most damage.
 * If we developed effective memories, then we may leverage those instead.
 * @param {number[]} usableSkills The skill ids available to choose from.
 * @param {JABS_Battler} user The battler choosing the skill.
 * @param {JABS_Battler} target The targeted battler to use the skill against.
 * @returns {number[]}
 */
JABS_AllyAI.prototype.decideFullForce = function(usableSkills, user, target)
{
  // check first if we should follow with the next hit of the combo.
  if (this.shouldFollowWithCombo(user))
  {
    return [ this.followWithCombo(user) ];
  }

  let chosenSkillId;
  let tempAvailableSkills = usableSkills;

  // determine the strongest skill available that this user can execute.
  const strongestSkillId = this.determineStrongestSkill(usableSkills, user, target);

  // grab all memories that this battler has of the target.
  const memoriesOfTarget = this.memory.filter(mem => mem.battlerId === target.getBattlerId());

  // check to make sure we have memories before analyzing them.
  if (memoriesOfTarget.length)
  {
    // filter the available skills by what was remembered to be effective.
    tempAvailableSkills = this.filterMemoriesByEffectiveness(tempAvailableSkills, memoriesOfTarget);
  }

  // check if we have no known effective skills.
  if (tempAvailableSkills.length === 0)
  {
    // if we no longer have any skills to pick from after filtering, then pick the strongest.
    chosenSkillId = this.determineStrongestSkill(usableSkills, user, target);
  }
  // we found exactly 1 effective skill.
  else if (tempAvailableSkills.length === 1)
  {
    // grab the known effective skill.
    const knownEffectiveSkill = tempAvailableSkills.at(0);

    // check if the strongest skill available is also the already-known effective skill.
    if (strongestSkillId === knownEffectiveSkill)
    {
      // if the strongest skill that was just calculated is the effective skill, then just use that.
      chosenSkillId = strongestSkillId;
    }
    // the strongest skill is different than the known effective skill.
    else
    {
      // 50% chance of picking either the strongest or the already-known effective skill.
      chosenSkillId = RPGManager.chanceIn100(50)
        ? strongestSkillId
        : knownEffectiveSkill;
    }
  }
  // we have more than 1 effective skill to work with.
  else
  {
    // if we have multiple previously proven-effective skills, then just pick one of those.
    chosenSkillId = tempAvailableSkills.at(Math.randomInt(tempAvailableSkills.length));
  }

  if (!this.isSkillIdValid(chosenSkillId)) return [];
  return [ chosenSkillId ];
};
//endregion full-force

//region support
/**
 * Decides a skill id based on this ally's current AI mode.
 * This mode prioritizes keeping allies alive.
 * Support priorities = cleansing > healing > buffing.
 * @param {number[]} usableSkills The skill ids available to choose from.
 * @param {JABS_Battler} user The battler choosing the skill.
 * @returns {number[]}
 */
JABS_AllyAI.prototype.decideSupport = function(usableSkills, user)
{
  // check first if we should follow with the next hit of the combo.
  if (this.shouldFollowWithCombo(user))
  {
    return [ this.followWithCombo(user) ];
  }

  // first priority is cleansing status ailments, including death, from allies.
  const cleansePick = this.wrapSupportSkillId(this.decideCleansing(user, usableSkills));
  if (cleansePick.length) return cleansePick;

  // second priority is recovering missing health for allies.
  const healPick = this.wrapSupportSkillId(this.decideHealing(user, usableSkills));
  if (healPick.length) return healPick;

  // third priority is status buffing on allies.
  const buffPick = this.wrapSupportSkillId(this.decideBuffing(user, usableSkills));
  if (buffPick.length) return buffPick;

  // nothing needed; wait briefly.
  return this.decideDoNothing(user);
};
//endregion support

//endregion decide action
//endregion JABS_AllyAI