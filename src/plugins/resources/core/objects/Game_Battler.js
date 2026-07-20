//region Game_Battler
import ResourceCostManager from './../managers/ResourceManager.js';

/**
 * Extends {@link #initMembers}.<br/>
 * Also initializes the resources members.
 */
J.RESOURCES.Aliased.Game_Battler.set('initMembers', Game_Battler.prototype.initMembers);
Game_Battler.prototype.initMembers = function()
{
  // perform original logic.
  J.RESOURCES.Aliased.Game_Battler.get('initMembers')
    .call(this);

  // also init our resources members.
  this.initResourcesMembers();
};

/**
 * Initializes the resources members.
 */
Game_Battler.prototype.initResourcesMembers = function()
{
  /**
   * The J object where all my additional properties live.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with resources.
   */
  this._j._resources ||= {};

  /**
   * The hp cost reduction for this battler.
   * @type {number}
   */
  this._j._hcr = 100;
};

/**
 * HP cost reduction in decimal percent space (0 = none).
 */
Object.defineProperty(Game_Battler.prototype, 'hcr', {
  get: function()
  {
    return Math.max(0, (100 - this._j._hcr) / 100);
  },
  configurable: true,
});

/**
 * Gets the hp cost reduction factor for this battler.
 * This is the normalized fractional amount used in the math for hp cost reduction.
 * Floored at zero — a negative factor would let ResourceManager's hp cost calculations go
 * negative, which would refund hp on cast instead of just reducing the cost to free.
 */
Game_Battler.prototype.hcrFactor = function()
{
  const hrcFactor = Math.max(0, this._j._hcr / 100);
  return hrcFactor;
};

/**
 * Sets the hp cost reduction for this battler.
 * @param {number} value The new hp cost reduction.
 */
Game_Battler.prototype.setHcr = function(value)
{
  this._j ||= {};
  this._j._hcr = value;
};

/**
 * Extends {@link #onBattlerDataChange}.<br/>
 * Also refreshes the hp cost reduction for this battler.
 */
J.RESOURCES.Aliased.Game_Battler.set('onBattlerDataChange', Game_Battler.prototype.onBattlerDataChange);
Game_Battler.prototype.onBattlerDataChange = function()
{
  // perform original logic.
  J.RESOURCES.Aliased.Game_Battler.get('onBattlerDataChange')
    .call(this);

  // also refresh the hrc.
  this.refreshHcr();
};

/**
 * Refreshes the hp cost reduction for this battler.
 */
Game_Battler.prototype.refreshHcr = function()
{
  // grab all the sources for hcr.
  const sources = this.hcrSources();

  // starting from 100, subtract the hcr from each source.
  const hcr = sources.reduce((acc, source) => acc - source.hcr(), 100);

  // ensure the hcr is never negative.
  const normalizedHcr = Math.max(0, hcr);

  // set the new hcr value.
  this.setHcr(normalizedHcr);
};

/**
 * Gets all sources that contribute to the hp cost reduction.
 * @returns {[(RPG_Actor|RPG_Enemy), RPG_Class, RPG_EquipItem[], RPG_State[]]}
 */
Game_Battler.prototype.hcrSources = function()
{
  return [];
};

/**
 * Extends {@link Game_Battler.prototype.canPaySkillCost}.
 * Now includes HP cost eligibility.
 * @param {RPG_Skill} skill The skill to check.
 * @returns {boolean}
 */
J.RESOURCES.Aliased.Game_BattlerBase.set('canPaySkillCost', Game_BattlerBase.prototype.canPaySkillCost);
Game_Battler.prototype.canPaySkillCost = function(skill)
{
  // Check base costs MP/TP first.
  // perform original logic.
  if (J.RESOURCES.Aliased.Game_BattlerBase.get('canPaySkillCost')
    .call(this, skill) === false)
  {
    return false;
  }

  // Check HP cost (default: forbid lethal unless tag allows).
  const hpCost = this.skillHpCost(skill);
  if (hpCost > 0)
  {
    // Allow sacrifice via notetag- if allowed, the HP check is satisfied regardless of current HP.
    const allowSacrifice = RPGManager.checkForBooleanFromNoteByRegex(skill, J.RESOURCES.RegExp.HpCostLethal);

    // without sacrifice allowed, HP must stay above 0 after paying the cost.
    if (allowSacrifice === false && this.hp <= hpCost)
    {
      return false;
    }
  }

  // Check stack cost- an alternate resource paid in JABS state stacks instead of hp/mp/tp.
  const [ stackStateId, stackCount ] = this.skillStackCost(skill);
  if (stackCount > 0 && this.stackCount(stackStateId) < stackCount)
  {
    // not enough stacks banked on the required state to afford this cast.
    return false;
  }

  // Check item cost- an alternate resource paid out of the party's own inventory.
  const [ itemId, itemCount ] = this.skillItemCost(skill);
  if (itemCount > 0 && $gameParty.numItems($dataItems.at(itemId)) < itemCount)
  {
    // not enough of the required item in stock to afford this cast.
    return false;
  }

  return true;
};

/**
 * Extends {@link Game_Battler.prototype.paySkillCost}.
 * Now deducts HP, MP, TP, and any gains.
 * @param {RPG_Skill} skill The skill being paid for.
 */
J.RESOURCES.Aliased.Game_BattlerBase.set('paySkillCost', Game_BattlerBase.prototype.paySkillCost);
Game_Battler.prototype.paySkillCost = function(skill)
{
  // Pay vanilla MP/TP first.
  // perform original logic.
  J.RESOURCES.Aliased.Game_BattlerBase.get('paySkillCost')
    .call(this, skill);

  // pay the HP cost.
  const hpCost = this.skillHpCost(skill);
  this.paySkillHpCost(hpCost);

  // pay the stack cost, if any- consumes stacks off the required state directly.
  const [ stackStateId, stackCount ] = this.skillStackCost(skill);
  if (stackCount > 0)
  {
    this.decrementStateStacks(stackStateId, stackCount);
  }

  // pay the item cost, if any- consumes stock straight out of the party's inventory.
  const [ itemId, itemCount ] = this.skillItemCost(skill);
  if (itemCount > 0)
  {
    $gameParty.loseItem($dataItems.at(itemId), itemCount, false);
  }

  // apply any gains from the skill.
  const hpGain = ResourceCostManager.skillGainHp(this, skill);
  const mpGain = ResourceCostManager.skillGainMp(this, skill);
  const tpGain = ResourceCostManager.skillGainTp(this, skill);
  this.gainHpFromResource(hpGain);
  this.gainMpFromResource(mpGain);
  this.gainTpFromResource(tpGain);
};

/**
 * Pays the hp cost for a skill.
 * @param {number} amount The amount of hp to pay.
 */
Game_Battler.prototype.paySkillHpCost = function(amount)
{
  // pay the HP cost.
  this.gainHp(-amount);
};

/**
 * Gains the given amount of HP from the skill.
 * @param {number} amount The amount of HP to gain.
 */
Game_Battler.prototype.gainHpFromResource = function(amount)
{
  this.gainHp(amount);
};

/**
 * Gains the given amount of MP from the skill.
 * @param {number} amount The amount of MP to gain.
 */
Game_Battler.prototype.gainMpFromResource = function(amount)
{
  this.gainMp(amount);
};

/**
 * Gains the given amount of TP from the skill.
 * @param {number} amount The amount of TP to gain.
 */
Game_Battler.prototype.gainTpFromResource = function(amount)
{
  this.gainTp(amount);
};
//endregion Game_Battler