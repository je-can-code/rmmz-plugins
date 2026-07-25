//region Game_Player (targeting pause)
import JABS_TargetingManager from './../managers/JABS_TargetingManager.js';

/**
 * Extends {@link Game_Player#canMove}.<br/>
 * Also blocks player movement while a targeting session is active.
 */
J.ABS.EXT.TARGETING.Aliased.Game_Player.set('canMove', Game_Player.prototype.canMove);
Game_Player.prototype.canMove = function()
{
  // if a targeting session is active, the player shouldn't be able to move.
  if (JABS_TargetingManager.isActive()) return false;

  // perform original logic.
  return J.ABS.EXT.TARGETING.Aliased.Game_Player.get('canMove')
    .call(this);
};
//endregion Game_Player (targeting pause)
