//region Scene_Map
import SpentBubbleManager from '../managers/SpentBubbleManager.js';
import Sprite_SpentBubbleLayer from '../sprites/Sprite_SpentBubbleLayer.js';

/**
 * Extends {@link #createSpriteset}.<br/>
 * Also raises the plane that finished bubbles wait on.
 *
 * Attached here rather than to the spriteset, and the ordering is doing two jobs. The scene builds
 * its window layer immediately after this, so a plane added now sits above the map and below the
 * message being read - which is the right way round when somebody starts talking over somebody else.
 * And staying outside the spriteset keeps these bubbles out of the screen shake and zoom that
 * `Spriteset_Base.updatePosition` applies, which the live message window is also outside of. Two
 * bubbles in a conversation have to move together, and a shake is exactly when they would not.
 */
J.MESSAGE.EXT.BUBBLES.Aliased.Scene_Map.set('createSpriteset', Scene_Map.prototype.createSpriteset);
Scene_Map.prototype.createSpriteset = function()
{
  // perform original logic.
  J.MESSAGE.EXT.BUBBLES.Aliased.Scene_Map.get('createSpriteset')
    .call(this);

  this.createSpentBubbleLayer();
};

/**
 * Creates the plane finished bubbles wait on, and ends whatever conversation was in progress.
 *
 * The clearing is not a guard. A new map is being built, which means the characters those bubbles
 * were pointing at have stopped existing - and a scene rebuild is also what happens on the way back
 * from a battle or a menu, both of which are places a conversation does not survive.
 */
Scene_Map.prototype.createSpentBubbleLayer = function()
{
  SpentBubbleManager.clear();

  this._j ||= {};
  this._j._bubbles ||= {};

  const layer = new Sprite_SpentBubbleLayer();

  this.setSpentBubbleLayer(layer);
  this.addChild(layer);
};

/**
 * The plane finished bubbles wait on.
 * @returns {Sprite_SpentBubbleLayer}
 */
Scene_Map.prototype.spentBubbleLayer = function()
{
  return this._j._bubbles._spentLayer;
};

/**
 * Sets the plane finished bubbles wait on.
 * @param {Sprite_SpentBubbleLayer} layer The plane.
 */
Scene_Map.prototype.setSpentBubbleLayer = function(layer)
{
  this._j._bubbles._spentLayer = layer;
};
//endregion Scene_Map