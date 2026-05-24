//region Game_BattlerBase
import ResourceCostManager from './../managers/ResourceManager.js';

//region hcr
/**
 * Gets the hp cost reduction for this battler.
 */
Object.defineProperty(Game_BattlerBase.prototype, 'hcr', {
  get: function()
  {
    return this.hcrFactor();
  },
  configurable: true
});

/**
 * Gets the hp cost reduction for this battler.
 * @returns {number}
 */
Game_BattlerBase.prototype.hcrFactor = function()
{
  return 1.0;
};
//endregion hcr

/**
 * Determines the hp cost of a skill.
 * @param {RPG_Skill} skill The skill being calculated.
 * @returns {number}
 */
Game_BattlerBase.prototype.skillHpCost = function(skill)
{
  return ResourceCostManager.hpCostBySkill(this, skill);
};

/**
 * Extends {@link Game_BattlerBase.prototype.skillMpCost}.<br/>
 * Includes extended MP costs from tags.
 * @param {RPG_Skill} skill The skill cost being calculated.
 * @returns {number}
 */
J.RESOURCES.Aliased.Game_BattlerBase.set('skillMpCost', Game_BattlerBase.prototype.skillMpCost);
Game_BattlerBase.prototype.skillMpCost = function(skill)
{
  // get base cost.
  const baseCost = J.RESOURCES.Aliased.Game_BattlerBase.get('skillMpCost')
    .call(this, skill);

  // add extended cost from tags via the manager.
  const extraCost = ResourceCostManager.extraMpCostBySkill(this, skill);

  // calculate the final cost.
  const cost = Math.max(0, (baseCost + extraCost));

  // return the cost.
  return cost;
};

/**
 * Extends {@link Game_BattlerBase.prototype.skillTpCost}.<br/>
 * Includes extended TP costs from tags.
 * @param {RPG_Skill} skill The skill cost being calculated.
 * @returns {number}
 */
J.RESOURCES.Aliased.Game_BattlerBase.set('skillTpCost', Game_BattlerBase.prototype.skillTpCost);
Game_BattlerBase.prototype.skillTpCost = function(skill)
{
  // get base cost.
  const baseCost = J.RESOURCES.Aliased.Game_BattlerBase.get('skillTpCost')
    .call(this, skill);

  // add extended cost from tags via the manager.
  const extraCost = ResourceCostManager.extraTpCostBySkill(this, skill);

  // calculate the final cost.
  const cost = Math.max(0, (baseCost + extraCost));

  // return the cost.
  return cost;
};


//endregion Game_BattlerBase