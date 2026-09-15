//region DataManager
import PlayerLightCoordinator from '../managers/PlayerLightCoordinator.js';
import ScreenLightingComposer from '../managers/ScreenLightingComposer.js';

/**
 * Extends {@link #createGameObjects}.<br/>
 * Forgets every lighting declaration from whatever game was being played before this one.
 *
 * The composer deliberately keeps its state in memory rather than on a game object, which is what
 * makes this plugin invisible to the save file - but it also means nothing about loading a save
 * clears it. Without this, loading partway through a tinted cutscene would carry that tint into the
 * loaded game, and the cave you saved in would still be dark in the field you loaded into.
 *
 * `createGameObjects` is the one hook that runs for both a new game and a load, which is exactly the
 * set of moments where "the game being played is now a different game" becomes true.
 */
J.LIGHTING.Aliased.DataManager.set('createGameObjects', DataManager.createGameObjects);
DataManager.createGameObjects = function()
{
  // perform original logic.
  J.LIGHTING.Aliased.DataManager.get('createGameObjects')
    .call(this);

  // start the new game's lighting from nothing at all.
  ScreenLightingComposer.reset();
  PlayerLightCoordinator.reset();
};
//endregion DataManager