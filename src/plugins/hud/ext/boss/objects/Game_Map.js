//region Game_Map
import BossFrameManager from '../managers/BossFrameManager.js';

/**
 * Extends {@link #setup}.<br/>
 * Also stands down any boss frame the map being left had up.
 *
 * Whatever the frame was showing stood on the old map: a boss placed there by hand, or the body of a fight that ends
 * with that map. Neither follows the party anywhere, so neither does the frame. It stands down once the new map is in
 * place, and a frame the new map raises for itself is never caught by this: event commands only begin running once the
 * map updates.
 * @param {number} mapId The id of the map being set up.
 */
J.HUD.EXT.BOSS.Aliased.Game_Map.set('setup', Game_Map.prototype.setup);
Game_Map.prototype.setup = function(mapId)
{
  // perform original logic.
  J.HUD.EXT.BOSS.Aliased.Game_Map.get('setup')
    .call(this, mapId);

  // a boss frame never outlives the map its boss stood on.
  BossFrameManager.resetBossFrame();
};
//endregion Game_Map