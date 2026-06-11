//region Scene_Boot food extensions
import JABS_FoodChainPlan from '../models/JABS_FoodChainPlan.js';

//region start
/**
 * Extends {@link Scene_Boot.prototype.start}.<br>
 * Builds the food chain plan registry from the now-loaded state database.
 * This runs once per game launch, after {@code DataManager.isDatabaseLoaded()} is
 * guaranteed true, so {@code $dataStates} is fully populated when the walk begins.
 * Any authoring errors (cycles, duplicate chain types) throw immediately here,
 * giving the developer a clear boot-time failure rather than a silent runtime bug.
 */
J.ABS.EXT.FOOD.Aliased.Scene_Boot.set('start', Scene_Boot.prototype.start);
Scene_Boot.prototype.start = function()
{
  // perform original logic.
  J.ABS.EXT.FOOD.Aliased.Scene_Boot.get('start').call(this);

  // build the food chain registry from the fully loaded state database.
  JABS_FoodChainPlan.buildRegistry();
};
//endregion start
//endregion Scene_Boot food extensions