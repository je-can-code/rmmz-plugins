//region Game_Map
import JabsBossManager from '../managers/JabsBossManager.js';

/**
 * Extends {@link #setup}.<br/>
 * Also ends whatever boss fight was running on the map being left.
 *
 * A fight cannot follow the party anywhere. Its bodies are the old map's events and stay behind with it, and J-ABS
 * rebuilds its battlers for the new map, so a fight left running would have nobody in it, could never be won, and
 * would trip over the next enemy to fall anywhere at all.
 *
 * It ends after the new map is in place rather than before. By then the old bodies are already off the map, so the
 * ending finds nothing of the old map's to erase, while the screen- the one thing a fight touches that outlives its
 * map- still gets handed back the way the fight found it. A fight the new map starts for itself is never caught by
 * this either: event commands only begin running once the map updates.
 * @param {number} mapId The id of the map being set up.
 */
J.ABS.EXT.BOSS.Aliased.Game_Map.set('setup', Game_Map.prototype.setup);
Game_Map.prototype.setup = function(mapId)
{
  // perform original logic.
  J.ABS.EXT.BOSS.Aliased.Game_Map.get('setup')
    .call(this, mapId);

  // a fight never outlives the map it was fought on.
  JabsBossManager.endEncounter();
};

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