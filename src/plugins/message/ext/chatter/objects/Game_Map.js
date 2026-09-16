//region Game_Map
import ChatterManager from '../managers/ChatterManager.js';

/**
 * Extends {@link #setup}.<br/>
 * Also forgets everything the map being left had to say.
 *
 * Emptied here rather than when the scene builds its sprites, and the ordering is the whole reason.
 * A transfer runs `$gamePlayer.performTransfer` - which is this - and only afterwards builds the
 * scene's display objects, so a wipe at scene-creation time would land *after* every event on the
 * new map had already declared itself and would take all of it with it. Worse, returning from a menu
 * or a battle rebuilds the scene without setting the map up again, so nothing would ever declare a
 * second time and the town would stay silent for good.
 *
 * Cleared before the original, because the original is what sets the events up and therefore what
 * makes the new map's declarations.
 */
J.MESSAGE.EXT.CHATTER.Aliased.Game_Map.set('setup', Game_Map.prototype.setup);
Game_Map.prototype.setup = function(mapId)
{
  // every token was naming somebody standing on the map being left.
  ChatterManager.clear();

  // perform original logic.
  J.MESSAGE.EXT.CHATTER.Aliased.Game_Map.get('setup')
    .call(this, mapId);
};
//endregion Game_Map