//region TileMap
/**
 * Overwrites {@link #_addShadow}.<br/>
 * Fuck those autoshadows.
 */
// eslint-disable-next-line no-unused-vars
Tilemap.prototype._addShadow = function(layer, shadowBits, dx, dy)
{
};

/**
 * Overwrites {@link Tilemap#update}.<br/>
 * Advances the autotile animation, then updates only the children that are going to be drawn.
 *
 * The engine walks every child on every frame, and every character sprite on the map lives here, so
 * left alone each one runs its whole update chain - the engine's, and that of every plugin extending
 * {@link Sprite_Character} - whether its character stands beside the player or three screens away
 * where nobody can see it. On a big map that is most of the frame. {@link Spriteset_Map#updateCharacterSleep}
 * puts the far-off sprites to sleep by clearing `renderable`, and this is the half that honours it.
 *
 * `renderable` is what gets asked, rather than anything about sleep, because the children here are
 * not all character sprites: the tile layers themselves live here too, alongside animations and
 * balloons. `renderable` is a question every display object can answer, and PIXI already reads it to
 * decide what to draw, so "not drawn" and "not updated" become one rule nothing else has to know.
 */
Tilemap.prototype.update = function()
{
  // advance the autotile animation exactly as the engine does.
  this.animationCount++;
  this.animationFrame = Math.floor(this.animationCount / 30);

  // then bring every child that will be drawn this frame up to date.
  this.children.forEach(this.updateChild, this);
};

/**
 * Updates one child of this tilemap, unless it is not going to be drawn this frame.
 * @param {PIXI.DisplayObject} child The child to bring up to date.
 */
Tilemap.prototype.updateChild = function(child)
{
  // a child nobody is going to draw this frame is not worth bringing up to date either.
  if (child.renderable === false) return;

  // the tile layers have no update of their own, which is the same reason the engine's walk asks.
  if (!child.update) return;

  // bring it up to date.
  child.update();
};
//endregion TileMap