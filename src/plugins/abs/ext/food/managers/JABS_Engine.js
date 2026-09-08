//region JABS_Engine food extensions
import JABS_FoodChainResolver from '../models/JABS_FoodChainResolver.js';

//region onExecuteMapAction
/**
 * Extends {@link JABS_Engine.prototype.onExecuteMapAction}.<br>
 * Ends the caster's food chain when the executed skill is tagged {@code <endFoodChain>}.
 *
 * This is the seam the whole metabolize loop hangs on. Core resolves the food slot to a skill and
 * executes it like any other; the food extension never dispatches anything and so cannot know a
 * burn happened- except here, where every executed action passes through. Reading the tag off the
 * skill rather than tracking the dispatch is what lets an enemy attack take a meal away too.
 * @param {JABS_Battler} caster The JABS battler executing the action.
 * @param {JABS_Action} action The action being executed.
 */
J.ABS.EXT.FOOD.Aliased.JABS_Engine.set('onExecuteMapAction', JABS_Engine.prototype.onExecuteMapAction);
JABS_Engine.prototype.onExecuteMapAction = function(caster, action)
{
  // perform original logic.
  J.ABS.EXT.FOOD.Aliased.JABS_Engine.get('onExecuteMapAction')
    .call(this, caster, action);

  // only skills that declare it end an arc; everything else passes through untouched.
  if (!action.getBaseSkill().jabsEndsFoodChain) return;

  // hand the caster's underlying battler to the resolver, which owns the immunity decision.
  JABS_FoodChainResolver.resolveEndFoodChain(caster.getBattler());
};
//endregion onExecuteMapAction

//region initialize
/**
 * Extends {@link JABS_Engine.prototype.initialize}.<br>
 * Adds the _foodChainPlans Map which stores one JABS_FoodChainPlan per actor
 * UUID. The map survives map transfers so the HUD can repaint on the next map
 * without needing the player to re-eat (mirrors the _jabsStates pattern).
 * @param {boolean} isMapTransfer Whether this init is a map-transfer event.
 */
J.ABS.EXT.FOOD.Aliased.JABS_Engine.set('initialize', JABS_Engine.prototype.initialize);
JABS_Engine.prototype.initialize = function(isMapTransfer = true)
{
  // perform original logic.
  J.ABS.EXT.FOOD.Aliased.JABS_Engine.get('initialize').call(this, isMapTransfer);

    /**
   * A Map of food chain plans, keyed by actor UUID.
   * Each value is a {@link JABS_FoodChainPlan} describing the ordered arc of states
   * the leader entered when eating their most recent food item.
   * Survives map transfer so the HUD does not go blank mid-dungeon.
   * @type {Map<string, JABS_FoodChainPlan>}
   */
  this._foodChainPlans = isMapTransfer
    ? this._foodChainPlans ?? new Map()
    : new Map();
};
//endregion initialize

//region getFoodChainPlanByUuid
/**
 * Returns the cached {@link JABS_FoodChainPlan} for the given UUID, or null.
 * @param {string} uuid The actor UUID to look up.
 * @returns {JABS_FoodChainPlan|null} The plan, or null if none is registered.
 */
JABS_Engine.prototype.getFoodChainPlanByUuid = function(uuid)
{
  return this.foodChainPlans().get(uuid) ?? null;
};
//endregion getFoodChainPlanByUuid

//region setFoodChainPlanByUuid
/**
 * Caches a food chain plan for the given actor UUID, replacing any prior plan.
 * Called by the resolver immediately after the leader eats a food item.
 * @param {string} uuid The actor UUID.
 * @param {JABS_FoodChainPlan} plan The plan built from the item's entry state.
 */
JABS_Engine.prototype.setFoodChainPlanByUuid = function(uuid, plan)
{
  this.foodChainPlans().set(uuid, plan);
};
//endregion setFoodChainPlanByUuid


//region properties
/**
 * Gets the food chain plans.
 * @returns {Map<string, JABS_FoodChainPlan>} The foodChainPlans.
 */
JABS_Engine.prototype.foodChainPlans = function()
{
  // hand back the food chain plans.
  return this._foodChainPlans;
};
//endregion properties
//endregion JABS_Engine food extensions