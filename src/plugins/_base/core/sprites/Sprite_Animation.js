//region Sprite_Animation
/**
 * Gets the animation data being played.
 * @returns {object} The animation.
 */
Sprite_Animation.prototype.animation = function()
{
  // hand back the animation data being played.
  return this._animation;
};

/**
 * Gets the sprites this animation is playing against.
 * @returns {Sprite[]} The targets.
 */
Sprite_Animation.prototype.targets = function()
{
  // hand back the sprites this animation is playing against.
  return this._targets;
};

/**
 * Gets the size of the square this animation renders into, in logical pixels.
 * @returns {number} The viewport size.
 */
Sprite_Animation.prototype.viewportSize = function()
{
  // hand back the size of the square this animation renders into.
  return this._viewportSize;
};

/**
 * Gets whether or not this animation is being drawn flipped horizontally.
 * @returns {boolean} True when mirrored, false otherwise.
 */
Sprite_Animation.prototype.mirror = function()
{
  // hand back whether or not this animation is flipped.
  return this._mirror;
};

/**
 * Extends {@link Sprite_Animation.targetSpritePosition}.<br/>
 * Also converts the result out of stage coordinates and into framebuffer ones.
 *
 * Effekseer is handed a raw WebGL viewport rather than anything PIXI mediates, and `gl.viewport` is
 * addressed in framebuffer pixels. Vanilla mixes the two spaces without noticing, because at a
 * renderer resolution of one they are the same number: a screen-centred animation measures itself
 * off `renderer.view`, which is a framebuffer size, while a target-anchored one comes from a
 * sprite's `worldTransform`, which is the stage's logical space. Raise the resolution and the second
 * kind lands at two thirds of where it belongs, drifting further off the further from the origin its
 * target stands.
 *
 * The conversion belongs here rather than in `targetPosition` even though that is where the two
 * spaces meet, because `targetPosition` is a method other plugins reimplement - J-ABS replaces it
 * outright to skip destroyed targets, and any correction living there is simply gone. Every path to
 * a target's position runs through this method instead, so this is the seam that actually holds.
 * @param {Sprite} sprite The sprite whose position is being measured.
 * @returns {Point} The position, in framebuffer pixels.
 */
J.BASE.Aliased.Sprite_Animation.set('targetSpritePosition', Sprite_Animation.prototype.targetSpritePosition);
Sprite_Animation.prototype.targetSpritePosition = function(sprite)
{
  // perform original logic.
  const position = J.BASE.Aliased.Sprite_Animation.get('targetSpritePosition')
    .call(this, sprite);

  // the stage is not scaled by the renderer's resolution, so this arrives in logical pixels.
  const scale = Graphics.deviceScale;
  position.x *= scale;
  position.y *= scale;

  return position;
};

/**
 * Overrides {@link Sprite_Animation.setViewport}.<br/>
 * Sizes the animation's WebGL viewport in framebuffer pixels rather than logical ones.
 *
 * The viewport box vanilla computes is expressed entirely in the logical pixels an animation's
 * offsets are authored in, and is then handed to `gl.viewport`, which measures framebuffer pixels.
 * Every term has to be scaled rather than only some of them, which is why this replaces the
 * original outright instead of adjusting its result.
 * @param {PIXI.Renderer} renderer The renderer this animation is drawing through.
 */
Sprite_Animation.prototype.setViewport = function(renderer)
{
  const scale = Graphics.deviceScale;

  // the square the effect is drawn into, in the framebuffer's own pixels.
  const viewportWidth = this.viewportSize() * scale;
  const viewportHeight = this.viewportSize() * scale;

  // the authored offsets are logical, so they scale alongside the box they are measured against.
  const viewportX = (this.animation().offsetX * scale) - (viewportWidth / 2);
  const viewportY = (this.animation().offsetY * scale) - (viewportHeight / 2);

  // the target position arrives in framebuffer pixels already - either because it was measured off
  // the renderer's own view, or because `targetSpritePosition` converted it on the way through.
  const position = this.targetPosition(renderer);

  renderer.gl.viewport(viewportX + position.x, viewportY + position.y, viewportWidth, viewportHeight);
};

/**
 * Overrides {@link Sprite_Animation.setProjectionMatrix}.<br/>
 * Keeps the perspective term measured in one space rather than two.
 *
 * The term divides the viewport size by the height of the renderer's view. The first of those is
 * logical and the second is a framebuffer size, so raising the resolution shrinks the ratio and
 * flattens every animation's perspective. Scaling the numerator restores the ratio the animation
 * was authored against, at any resolution.
 * @param {PIXI.Renderer} renderer The renderer this animation is drawing through.
 */
Sprite_Animation.prototype.setProjectionMatrix = function(renderer)
{
  const x = this.mirror()
    ? -1
    : 1;
  const y = -1;
  const perspective = -((this.viewportSize() * Graphics.deviceScale) / renderer.view.height);

  Graphics.effekseer.setProjectionMatrix([
    x, 0, 0, 0,
    0, y, 0, 0,
    0, 0, 1, perspective,
    0, 0, 0, 1,
  ]);
};
//endregion Sprite_Animation
