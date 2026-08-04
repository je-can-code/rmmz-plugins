//region JABS_Engine food extensions

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