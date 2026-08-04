//region Game_Map
import JabsBossManager from '../managers/JabsBossManager.js';

/**
 * Extends {@link #update}.<br/>
 * Also advances the active boss encounter.
 *
 * The map update is the right home for this rather than a scene: an encounter is a property of the
 * world the battle happens in, and it must keep counting whether or not any particular scene is on
 * top of it.
 */
J.ABS.EXT.BOSS.Aliased.Game_Map.set('update', Game_Map.prototype.update);
Game_Map.prototype.update = function(sceneActive)
{
  // perform original logic.
  J.ABS.EXT.BOSS.Aliased.Game_Map.get('update')
    .call(this, sceneActive);

  // advance whatever boss fight is currently running.
  JabsBossManager.update();
};
//endregion Game_Map