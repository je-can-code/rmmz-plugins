//region Scene_Map
import MapAmbientCoordinator from '../managers/MapAmbientCoordinator.js';
import PlayerLightCoordinator from '../managers/PlayerLightCoordinator.js';
import ScreenLightingComposer from '../managers/ScreenLightingComposer.js';

/**
 * Extends {@link #onMapLoaded}.<br/>
 * Retires the previous map's lighting and declares the arriving map's own.
 *
 * This is the arrival hook rather than `Game_Map#setup`, and the difference matters: `setup` only
 * runs when the player is actually transferring, so loading a save straight into a dark cave would
 * never declare its darkness and the cave would come up lit. This runs for every kind of arrival -
 * transfers, save loads and new games alike - and it is the first point at which `$dataMap` is the
 * map being entered rather than the one being left.
 */
J.LIGHTING.Aliased.Scene_Map.set('onMapLoaded', Scene_Map.prototype.onMapLoaded);
Scene_Map.prototype.onMapLoaded = function()
{
  // read the arriving map's own darkness while $dataMap is it.
  MapAmbientCoordinator.refresh();

  // perform original logic.
  J.LIGHTING.Aliased.Scene_Map.get('onMapLoaded')
    .call(this);

  // and only now, with this map's events in place, say what is burning on it.
  this.refreshMapLighting();

  // whatever the party leader is carrying came with them.
  PlayerLightCoordinator.refresh();
};

/**
 * Rebuilds every event light on the map being arrived at, from scratch.
 *
 * Withdrawing and re-declaring rather than merely withdrawing is the whole point, and the asymmetry
 * that makes it necessary is easy to miss: only a *transfer* runs `Game_Map#setup`, and only `setup`
 * calls `setupPage` on each event. Closing the menu, or loading a save, arrives here without either
 * - so anything that clears the page lights on the way in and waits for the events to announce
 * themselves again is waiting for something that will never happen, and the map comes back with its
 * ambient intact and every torch out.
 *
 * Clearing the whole kind first is what keeps a departed map's torches from lingering: lights are
 * keyed by event id, so arriving somewhere with fewer events would otherwise strand the surplus -
 * event seven's torch still burning on a map whose seventh event is a barrel. Removal is by source,
 * so the leader's lantern and any cutscene tint are declared under other kinds and survive it.
 */
Scene_Map.prototype.refreshMapLighting = function()
{
  ScreenLightingComposer.removeDeclarationKind('page');

  $gameMap.events()
    .forEach(event => event.refreshDeclaredLights());
};
//endregion Scene_Map