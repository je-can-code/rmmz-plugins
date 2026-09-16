//region Scene_Map
import ChatterManager from '../managers/ChatterManager.js';
import Sprite_ChatterBubbleLayer from '../sprites/Sprite_ChatterBubbleLayer.js';

/**
 * Extends {@link #createSpriteset}.<br/>
 * Also raises the plane that idle chatter floats on.
 *
 * Added after the bubbles plugin's own plane and outside the spriteset, for the reasons that plugin
 * documents: the window layer is built immediately after this, so chatter sits above the map and
 * below any message being read, and staying outside the spriteset keeps it out of the screen shake
 * and zoom that a floating message is also outside of.
 *
 * **Nothing is cleared here.** Every other plane in this family empties itself on a scene rebuild,
 * and chatter must not: the events on the map declare themselves during `$gameMap.setup`, which has
 * already happened by the time a scene builds anything, and returning from a menu or a battle
 * rebuilds the scene without setting the map up at all. Emptying here would take every declaration
 * with it and leave the town permanently silent. The forgetting lives on `Game_Map.setup` instead.
 */
J.MESSAGE.EXT.CHATTER.Aliased.Scene_Map.set('createSpriteset', Scene_Map.prototype.createSpriteset);
Scene_Map.prototype.createSpriteset = function()
{
  // perform original logic.
  J.MESSAGE.EXT.CHATTER.Aliased.Scene_Map.get('createSpriteset')
    .call(this);

  this.createChatterBubbleLayer();
};

/**
 * Creates the plane idle chatter floats on.
 */
Scene_Map.prototype.createChatterBubbleLayer = function()
{
  this._j ||= {};
  this._j._chatter ||= {};

  const layer = new Sprite_ChatterBubbleLayer();

  this.setChatterBubbleLayer(layer);
  this.addChild(layer);
};

/**
 * The plane idle chatter floats on.
 * @returns {Sprite_ChatterBubbleLayer}
 */
Scene_Map.prototype.chatterBubbleLayer = function()
{
  return this._j._chatter._layer;
};

/**
 * Sets the plane idle chatter floats on.
 * @param {Sprite_ChatterBubbleLayer} layer The plane.
 */
Scene_Map.prototype.setChatterBubbleLayer = function(layer)
{
  this._j._chatter._layer = layer;
};

/**
 * Extends {@link #update}.<br/>
 * Also advances everybody's chatter by a frame.
 *
 * Ticked from the scene rather than from `Game_Map.update`, because chatter is a thing that happens
 * on the map the player is looking at. The map object updates in places the player is not there for,
 * and a character counting down a cooldown in a room nobody is standing in is bookkeeping for
 * nothing.
 */
J.MESSAGE.EXT.CHATTER.Aliased.Scene_Map.set('update', Scene_Map.prototype.update);
Scene_Map.prototype.update = function()
{
  // perform original logic.
  J.MESSAGE.EXT.CHATTER.Aliased.Scene_Map.get('update')
    .call(this);

  ChatterManager.update();
};
//endregion Scene_Map