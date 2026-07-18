//region Game_BattlerBase
import ResourceCostManager from './../managers/ResourceManager.js';

//region hcr
/**
 * Gets the hp cost reduction factor for this battler.
 * @returns {number}
 */
Game_BattlerBase.prototype.hcrFactor = function()
{
  return 1.0;
};

/**
 * HP cost reduction in decimal percent space (0 = none).
 */
Object.defineProperty(Game_BattlerBase.prototype, 'hcr', {
  get: function()
  {
    return 0;
  },
  configurable: true,
});
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
 * Determines the state-stack cost of a skill, if any.
 * Skill-scoped only, same as every other cost tag- costs are inherent to the skill, not
 * something a caster's states/equips should be able to silently inject.
 * @param {RPG_Skill} skill The skill being calculated.
 * @returns {[number, number]} A `[stateId, count]` tuple; `[0, 0]` when no tag is present.
 */
Game_BattlerBase.prototype.skillStackCost = function(skill)
{
  // read the last <stackCost:[STATE_ID, COUNT]> tag on this skill's own note, if any.
  const [stateId = 0, count = 0] = RPGManager.getArrayFromNotesByRegex(skill, J.RESOURCES.RegExp.StackCost);

  // return the sentinel-safe tuple.
  return [ stateId, count ];
};

/**
 * Determines the inventory-item cost of a skill, if any.
 * Skill-scoped only, same as every other cost tag.
 * @param {RPG_Skill} skill The skill being calculated.
 * @returns {[number, number]} An `[itemId, count]` tuple; `[0, 0]` when no tag is present.
 */
Game_BattlerBase.prototype.skillItemCost = function(skill)
{
  // read the last <itemCost:[ITEM_ID, COUNT]> tag on this skill's own note, if any.
  const [itemId = 0, count = 0] = RPGManager.getArrayFromNotesByRegex(skill, J.RESOURCES.RegExp.ItemCost);

  // return the sentinel-safe tuple.
  return [ itemId, count ];
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
  // perform original logic.
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
  // perform original logic.
  const baseCost = J.RESOURCES.Aliased.Game_BattlerBase.get('skillTpCost')
    .call(this, skill);

  // add extended cost from tags via the manager.
  const extraCost = ResourceCostManager.extraTpCostBySkill(this, skill);

  // calculate the final cost, scaled by the battler's TP charge rate.
  const cost = Math.max(0, (baseCost + extraCost) * this.tcr);

  // return the cost.
  return cost;
};


//endregion Game_BattlerBase