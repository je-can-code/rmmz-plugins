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
 * The risk axis controls how aggressively the ally selects offensive skills.
 */
JABS_AllyAI.Risk = {
  /** Relies on known-effective skills; conservative fallback to random. */
  CAREFUL: 0,
  /** Balances memory-driven and random skill selection. */
  BALANCED: 1,
  /** Always presses the strongest available skill. */
  RECKLESS: 2,
};

/**
 * The support axis controls how the ally weighs healing/buffing against offense.
 */
JABS_AllyAI.Support = {
  /** Never deviates toward support skills. */
  OFFENSE: 0,
  /** Conditionally supports when allies are in danger. */
  BALANCED: 1,
  /** Prioritizes cleansing, healing, and buffing before offense. */
  SUPPORT: 2,
};

/**
 * The spacing axis controls how close the ally positions itself relative to its target.
 */
JABS_AllyAI.Spacing = {
  /** Closes to melee range; chases targets aggressively. */
  FRONTLINE: 0,
  /** Maintains a moderate distance from targets. */
  MIDLINE: 1,
  /** Stays at maximum skill range; avoids close combat. */
  BACKLINE: 2,
};

/**
 * The close-distance threshold (in tiles) for each spacing axis value.
 * Allies back away from their target when inside this range.
 */
JABS_AllyAI.CloseDistances = {
  [JABS_AllyAI.Spacing.FRONTLINE]: 1.0,
  [JABS_AllyAI.Spacing.MIDLINE]:   3.0,
  [JABS_AllyAI.Spacing.BACKLINE]:  5.0,
};

/**
 * The far-distance threshold (in tiles) for each spacing axis value.
 * Allies move toward their target when beyond this range.
 */
JABS_AllyAI.FarDistances = {
  [JABS_AllyAI.Spacing.FRONTLINE]: 2.0,
  [JABS_AllyAI.Spacing.MIDLINE]:   5.0,
  [JABS_AllyAI.Spacing.BACKLINE]:  7.0,
};

/**
 * The leash multiplier for each spacing axis value.
 * Applied to {@link JABS_Battler.allyRubberbandRange} to derive per-ally leash distance.
 */
JABS_AllyAI.LeashMultipliers = {
  [JABS_AllyAI.Spacing.FRONTLINE]: 1.5,
  [JABS_AllyAI.Spacing.MIDLINE]:   1.0,
  [JABS_AllyAI.Spacing.BACKLINE]:  0.6,
};

/**
 * The close-distance threshold when do-nothing is active (very large so the ally always backs away).
 * @type {number}
 */
JABS_AllyAI.DoNothingCloseDistance = 8.0;

/**
 * The far-distance threshold when do-nothing is active.
 * @type {number}
 */
JABS_AllyAI.DoNothingFarDistance = 10.0;

/**
 * The leash multiplier when do-nothing is active (small so the ally stays near the leader).
 * @type {number}
 */
JABS_AllyAI.DoNothingLeashMultiplier = 0.5;

/**
 * All ten named presets available for ally AI configuration.
 * Each preset maps to a combination of risk, support, and spacing axis values.
 */
JABS_AllyAI.presets = {
  BERSERKER: {
    key: 'berserker',
    name: 'Berserker',
    description: "Reckless melee aggressor.\nCharges in and hits as hard as possible at all times.",
    risk: JABS_AllyAI.Risk.RECKLESS,
    support: JABS_AllyAI.Support.OFFENSE,
    spacing: JABS_AllyAI.Spacing.FRONTLINE,
  },
  GUARDIAN: {
    key: 'guardian',
    name: 'Guardian',
    description: "Careful frontline protector.\nStays in the thick of it but won't overextend.",
    risk: JABS_AllyAI.Risk.CAREFUL,
    support: JABS_AllyAI.Support.OFFENSE,
    spacing: JABS_AllyAI.Spacing.FRONTLINE,
  },
  VANGUARD: {
    key: 'vanguard',
    name: 'Vanguard',
    description: "Balanced frontline fighter.\nA dependable melee ally who adapts to the situation.",
    risk: JABS_AllyAI.Risk.BALANCED,
    support: JABS_AllyAI.Support.BALANCED,
    spacing: JABS_AllyAI.Spacing.FRONTLINE,
  },
  WAR_PRIEST: {
    key: 'war-priest',
    name: 'War Priest',
    description: "Frontline support hybrid.\nFights up close but keeps an eye on ally health.",
    risk: JABS_AllyAI.Risk.BALANCED,
    support: JABS_AllyAI.Support.SUPPORT,
    spacing: JABS_AllyAI.Spacing.FRONTLINE,
  },
  SKIRMISHER: {
    key: 'skirmisher',
    name: 'Skirmisher',
    description: "Mobile midline attacker.\nFlexible and opportunistic; adapts to whatever is needed.",
    risk: JABS_AllyAI.Risk.BALANCED,
    support: JABS_AllyAI.Support.OFFENSE,
    spacing: JABS_AllyAI.Spacing.MIDLINE,
  },
  GENERALIST: {
    key: 'generalist',
    name: 'Generalist',
    description: "Balanced all-rounder.\nA sensible default for allies without a defined specialty.",
    risk: JABS_AllyAI.Risk.BALANCED,
    support: JABS_AllyAI.Support.BALANCED,
    spacing: JABS_AllyAI.Spacing.MIDLINE,
  },
  CLERIC: {
    key: 'cleric',
    name: 'Cleric',
    description: "Careful midline supporter.\nKeeps allies healthy from a moderate distance.",
    risk: JABS_AllyAI.Risk.CAREFUL,
    support: JABS_AllyAI.Support.SUPPORT,
    spacing: JABS_AllyAI.Spacing.MIDLINE,
  },
  ARTILLERY: {
    key: 'artillery',
    name: 'Artillery',
    description: "Careful backline attacker.\nHangs back and fires from safety; never rushes in.",
    risk: JABS_AllyAI.Risk.CAREFUL,
    support: JABS_AllyAI.Support.OFFENSE,
    spacing: JABS_AllyAI.Spacing.BACKLINE,
  },
  WIZARD: {
    key: 'wizard',
    name: 'Wizard',
    description: "Balanced backline attacker.\nDeals damage from range and pushes up when needed.",
    risk: JABS_AllyAI.Risk.BALANCED,
    support: JABS_AllyAI.Support.OFFENSE,
    spacing: JABS_AllyAI.Spacing.BACKLINE,
  },
  MEDIC: {
    key: 'medic',
    name: 'Medic',
    description: "Careful backline support.\nStays well back and focuses on keeping the party alive.",
    risk: JABS_AllyAI.Risk.CAREFUL,
    support: JABS_AllyAI.Support.SUPPORT,
    spacing: JABS_AllyAI.Spacing.BACKLINE,
  },
};

/**
 * Gets all valid preset objects.
 * @returns {object[]}
 */
JABS_AllyAI.getPresets = () => Object
  .keys(JABS_AllyAI.presets)
  .map(key => JABS_AllyAI.presets[key]);

/**
 * Finds a preset object by its key string.
 * @param {string} key The preset key to look up.
 * @returns {object|null}
 */
JABS_AllyAI.getPresetByKey = key => JABS_AllyAI
  .getPresets()
  .find(preset => preset.key === key) ?? null;

/**
 * Validates that the given key corresponds to a known preset.
 * @param {string} key The key to validate.
 * @returns {boolean}
 */
JABS_AllyAI.validatePreset = key => JABS_AllyAI.getPresetByKey(key) !== null;
//endregion statics

//region initialize
/**
 * Initializes this ally AI with an optional starting preset.
 * @param {string} [presetKey] The preset key to apply on construction.
 */
JABS_AllyAI.prototype.initialize = function(presetKey)
{
  this.initMembers();
  if (presetKey)
  {
    this.applyPreset(presetKey);
  }
};

/**
 * Initializes all default members of this class.
 */
JABS_AllyAI.prototype.initMembers = function()
{
  /**
   * When true this ally takes no actions and backs away from all targets.
   * Overrides all axis behavior.
   * @type {boolean}
   */
  this._doNothing = false;

  /**
   * The risk axis: how aggressively this ally picks offensive skills.
   * @type {number}
   */
  this._risk = JABS_AllyAI.Risk.BALANCED;

  /**
   * The support axis: how much this ally weighs healing/buffing vs offense.
   * @type {number}
   */
  this._support = JABS_AllyAI.Support.BALANCED;

  /**
   * The spacing axis: how close this ally positions itself relative to its target.
   * @type {number}
   */
  this._spacing = JABS_AllyAI.Spacing.MIDLINE;

  /**
   * The key of the last applied preset, or the default preset key.
   * @type {string}
   */
  this._presetKey = JABS_AllyAI.presets.GENERALIST.key;

  /**
   * The collection of memories this ally AI possesses.
   * @type {JABS_BattleMemory[]}
   */
  this.memory = [];
};
//endregion initialize

//region do-nothing
/**
 * Gets whether this ally is in do-nothing mode.
 * @returns {boolean}
 */
JABS_AllyAI.prototype.isDoNothing = function()
{
  return this._doNothing;
};

/**
 * Sets the do-nothing flag for this ally.
 * @param {boolean} doNothing True to enable do-nothing mode, false to disable.
 */
JABS_AllyAI.prototype.setDoNothing = function(doNothing)
{
  this._doNothing = doNothing;
};
//endregion do-nothing

//region axes
/**
 * Gets the current risk axis value.
 * @returns {number}
 */
JABS_AllyAI.prototype.getRisk = function()
{
  return this._risk;
};

/**
 * Gets the current support axis value.
 * @returns {number}
 */
JABS_AllyAI.prototype.getSupport = function()
{
  return this._support;
};

/**
 * Gets the current spacing axis value.
 * @returns {number}
 */
JABS_AllyAI.prototype.getSpacing = function()
{
  return this._spacing;
};

/**
 * Gets the key of the currently applied preset.
 * @returns {string}
 */
JABS_AllyAI.prototype.getPresetKey = function()
{
  return this._presetKey;
};

/**
 * Applies a preset by key, updating all three axes and the stored preset key.
 * @param {string} presetKey The key of the preset to apply.
 */
JABS_AllyAI.prototype.applyPreset = function(presetKey)
{
  const preset = JABS_AllyAI.getPresetByKey(presetKey);
  if (!preset)
  {
    console.error(`Attempted to apply ally AI preset: [${presetKey}], but it is not a valid preset.`);
    return;
  }

  this._risk = preset.risk;
  this._support = preset.support;
  this._spacing = preset.spacing;
  this._presetKey = preset.key;
};
//endregion axes

//region spacing helpers
/**
 * Gets the close-distance threshold in tiles for this ally's current spacing.
 * The ally backs away from its target when within this range.
 * @returns {number}
 */
JABS_AllyAI.prototype.getCloseDistance = function()
{
  if (this._doNothing) return JABS_AllyAI.DoNothingCloseDistance;
  return JABS_AllyAI.CloseDistances[this._spacing] ?? JABS_Battler.closeDistance;
};

/**
 * Gets the far-distance threshold in tiles for this ally's current spacing.
 * The ally moves toward its target when beyond this range.
 * @returns {number}
 */
JABS_AllyAI.prototype.getFarDistance = function()
{
  if (this._doNothing) return JABS_AllyAI.DoNothingFarDistance;
  return JABS_AllyAI.FarDistances[this._spacing] ?? JABS_Battler.farDistance;
};

/**
 * Gets the leash multiplier for this ally's current spacing.
 * Applied to the base rubber-band range to derive the per-ally leash distance.
 * @returns {number}
 */
JABS_AllyAI.prototype.getLeashMultiplier = function()
{
  if (this._doNothing) return JABS_AllyAI.DoNothingLeashMultiplier;
  return JABS_AllyAI.LeashMultipliers[this._spacing] ?? 1.0;
};
//endregion spacing helpers

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
 * Decides an action based on this battler's axes, the target, and the available skills.
 * @param {JABS_Battler} user The battler of the AI deciding a skill.
 * @param {JABS_Battler} target The target battler to decide an action against.
 * @param {number[]} availableSkills A collection of all skill ids to potentially pick from.
 * @returns {number[]} Exactly one skill id, or empty when no valid choice exists.
 */
JABS_AllyAI.prototype.decideAction = function(user, target, availableSkills)
{
  // do-nothing overrides all axis behavior.
  if (this._doNothing) return this.decideDoNothing(user);

  // filter out unusable skills before any decision.
  const usableSkills = this.filterUncastableSkills(user, availableSkills);

  // always follow a pending combo chain first.
  if (this.shouldFollowWithCombo(user)) return [ this.followWithCombo(user) ];

  // support axis drives the top-level branch.
  switch (this._support)
  {
    case JABS_AllyAI.Support.SUPPORT:
      return this.decideSupportFirst(usableSkills, user, target);
    case JABS_AllyAI.Support.BALANCED:
      return this.decideBalancedSupport(usableSkills, user, target);
    case JABS_AllyAI.Support.OFFENSE:
    default:
      return this.decideOffense(usableSkills, user, target);
  }
};

//region do-nothing
/**
 * Decides to do nothing and waits briefly before reconsidering.
 * @param {JABS_Battler} user The battler doing nothing.
 * @returns {number[]}
 */
JABS_AllyAI.prototype.decideDoNothing = function(user)
{
  user.setWaitCountdown(20);
  return [];
};
//endregion do-nothing

//region support-first
/**
 * Prioritizes cleansing, healing, and buffing allies before falling through to cautious offense.
 * Used when the support axis is {@link JABS_AllyAI.Support.SUPPORT}.
 * @param {number[]} usableSkills The skill ids available to choose from.
 * @param {JABS_Battler} user The battler choosing the skill.
 * @param {JABS_Battler} target The targeted battler.
 * @returns {number[]}
 */
JABS_AllyAI.prototype.decideSupportFirst = function(usableSkills, user, target)
{
  const cleansePick = this.wrapSupportSkillId(this.decideCleansing(user, usableSkills));
  if (cleansePick.length) return cleansePick;

  const healPick = this.wrapSupportSkillId(this.decideHealing(user, usableSkills));
  if (healPick.length) return healPick;

  const buffPick = this.wrapSupportSkillId(this.decideBuffing(user, usableSkills));
  if (buffPick.length) return buffPick;

  // nothing to support; fall through to cautious offense.
  return this.decideCautiousOffense(usableSkills, user, target);
};
//endregion support-first

//region balanced support
/**
 * Conditionally supports allies when in danger, otherwise proceeds to offense.
 * Used when the support axis is {@link JABS_AllyAI.Support.BALANCED}.
 * @param {number[]} usableSkills The skill ids available to choose from.
 * @param {JABS_Battler} user The battler choosing the skill.
 * @param {JABS_Battler} target The targeted battler.
 * @returns {number[]}
 */
JABS_AllyAI.prototype.decideBalancedSupport = function(usableSkills, user, target)
{
  const nearbyAllies = user.getAllNearbyAllies();
  const anyInDanger = nearbyAllies.some(ally => ally.getBattler().currentHpPercent() < 0.6);

  if (anyInDanger && Math.randomInt(2) === 0)
  {
    const supportPick = this.decideSupportFirst(usableSkills, user, target);
    if (supportPick.length) return supportPick;
  }

  return this.decideOffense(usableSkills, user, target);
};
//endregion balanced support

//region offense
/**
 * Dispatches to the appropriate offense behavior based on the risk axis.
 * @param {number[]} usableSkills The skill ids available to choose from.
 * @param {JABS_Battler} user The battler choosing the skill.
 * @param {JABS_Battler} target The targeted battler.
 * @returns {number[]}
 */
JABS_AllyAI.prototype.decideOffense = function(usableSkills, user, target)
{
  if (!usableSkills.length) return [];

  switch (this._risk)
  {
    case JABS_AllyAI.Risk.RECKLESS:
      return this.decideRecklessOffense(usableSkills, user, target);
    case JABS_AllyAI.Risk.CAREFUL:
      return this.decideCautiousOffense(usableSkills, user, target);
    case JABS_AllyAI.Risk.BALANCED:
    default:
      return this.decideBalancedOffense(usableSkills, user, target);
  }
};

/**
 * Always presses the strongest available skill, using battle memories as a secondary signal.
 * Used when the risk axis is {@link JABS_AllyAI.Risk.RECKLESS}.
 * @param {number[]} usableSkills The skill ids available to choose from.
 * @param {JABS_Battler} user The battler choosing the skill.
 * @param {JABS_Battler} target The targeted battler.
 * @returns {number[]}
 */
JABS_AllyAI.prototype.decideRecklessOffense = function(usableSkills, user, target)
{
  const strongestSkillId = this.determineStrongestSkill(usableSkills, user, target);
  const memoriesOfTarget = this.memory.filter(mem => mem.battlerId === target.getBattlerId());

  if (memoriesOfTarget.length)
  {
    const effectiveSkills = this.filterMemoriesByEffectiveness(usableSkills, memoriesOfTarget);

    if (effectiveSkills.length === 1 && effectiveSkills[0] !== strongestSkillId)
    {
      const chosen = RPGManager.chanceIn100(50) ? strongestSkillId : effectiveSkills[0];
      return this.isSkillIdValid(chosen) ? [ chosen ] : [];
    }

    if (effectiveSkills.length > 1)
    {
      const chosen = effectiveSkills[Math.randomInt(effectiveSkills.length)];
      return this.isSkillIdValid(chosen) ? [ chosen ] : [];
    }
  }

  return this.isSkillIdValid(strongestSkillId) ? [ strongestSkillId ] : [];
};

/**
 * Balances memory-driven skill choices with randomness.
 * Used when the risk axis is {@link JABS_AllyAI.Risk.BALANCED}.
 * @param {number[]} usableSkills The skill ids available to choose from.
 * @param {JABS_Battler} user The battler choosing the skill.
 * @param {JABS_Battler} target The targeted battler.
 * @returns {number[]}
 */
JABS_AllyAI.prototype.decideBalancedOffense = function(usableSkills, user, target)
{
  const memoriesOfTarget = this.memory.filter(mem => mem.battlerId === target.getBattlerId());
  let tempSkills = usableSkills;

  if (memoriesOfTarget.length)
  {
    tempSkills = this.filterMemoriesByEffectiveness(usableSkills, memoriesOfTarget);
  }

  let chosenSkillId;

  if (tempSkills.length === 0)
  {
    chosenSkillId = usableSkills[Math.randomInt(usableSkills.length)];
  }
  else if (tempSkills.length === 1)
  {
    chosenSkillId = Math.randomInt(2) === 0
      ? tempSkills[0]
      : usableSkills[Math.randomInt(usableSkills.length)];
  }
  else
  {
    chosenSkillId = tempSkills[Math.randomInt(tempSkills.length)];
  }

  return this.isSkillIdValid(chosenSkillId) ? [ chosenSkillId ] : [];
};

/**
 * Relies heavily on battle memories, falling back to random only when none exist.
 * Used when the risk axis is {@link JABS_AllyAI.Risk.CAREFUL}.
 * @param {number[]} usableSkills The skill ids available to choose from.
 * @param {JABS_Battler} user The battler choosing the skill.
 * @param {JABS_Battler} target The targeted battler.
 * @returns {number[]}
 */
JABS_AllyAI.prototype.decideCautiousOffense = function(usableSkills, user, target)
{
  if (!usableSkills.length) return [];

  const memoriesOfTarget = this.memory.filter(mem => mem.battlerId === target.getBattlerId());

  if (memoriesOfTarget.length)
  {
    const effectiveSkills = this.filterMemoriesByEffectiveness(usableSkills, memoriesOfTarget);
    if (effectiveSkills.length)
    {
      const chosen = effectiveSkills[Math.randomInt(effectiveSkills.length)];
      return this.isSkillIdValid(chosen) ? [ chosen ] : [];
    }
  }

  // no memories: random fallback.
  const chosen = usableSkills[Math.randomInt(usableSkills.length)];
  return this.isSkillIdValid(chosen) ? [ chosen ] : [];
};
//endregion offense

//endregion decide action
//endregion JABS_AllyAI