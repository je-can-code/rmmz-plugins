//region Sprite_Animation
/**
 * Extends {@link Sprite_Animation.prototype.setup}.<br/>
 * Normalizes Effekseer timing arrays before the engine iterates them; vanilla assumes both arrays exist and
 * contain only defined timing objects, which can fail when map hits queue animations in tight succession or
 * when database rows omit optional arrays.
 */
J.ABS.Aliased.Sprite_Animation.set('setup', Sprite_Animation.prototype.setup);
Sprite_Animation.prototype.setup = function(targets, animation, mirror, delay, previous)
{
  // perform original logic when there is nothing to normalize.
  if (animation === undefined || animation === null)
  {
    // perform original logic.
    J.ABS.Aliased.Sprite_Animation.get('setup')
      .call(this, targets, animation, mirror, delay, previous);
    return;
  }

  const hadSoundArray = Array.isArray(animation.soundTimings);
  const hadFlashArray = Array.isArray(animation.flashTimings);

  const soundTimings = hadSoundArray
    ? animation.soundTimings.filter(t => t !== undefined && t !== null)
    : [];
  const flashTimings = hadFlashArray
    ? animation.flashTimings.filter(t => t !== undefined && t !== null)
    : [];

  const arraysAlreadyDense = hadSoundArray
    && hadFlashArray
    && soundTimings === animation.soundTimings
    && flashTimings === animation.flashTimings;

  if (arraysAlreadyDense === true)
  {
    // perform original logic.
    J.ABS.Aliased.Sprite_Animation.get('setup')
      .call(this, targets, animation, mirror, delay, previous);
    return;
  }

  const safeAnimation = Object.assign(
    {},
    animation,
    {
      soundTimings,
      flashTimings,
    }
  );

  // perform original logic.
  J.ABS.Aliased.Sprite_Animation.get('setup')
    .call(this, targets, safeAnimation, mirror, delay, previous);
};

/**
 * Extends {@link Sprite_Animation.prototype.targetPosition}.<br/>
 * Adds a guard to ensure we don't attempt to calculate positions for destroyed sprites.
 */
J.ABS.Aliased.Sprite_Animation.set('targetPosition', Sprite_Animation.prototype.targetPosition);
Sprite_Animation.prototype.targetPosition = function (renderer)
{
  // if this is a screen animation, use the original logic.
  if (this.animation().displayType === 2)
  {
    // perform original logic.
    return J.ABS.Aliased.Sprite_Animation.get('targetPosition')
      .call(this, renderer);
  }

  // otherwise, filter out any targets that have been destroyed or are null.
  const validTargets = this.targets().filter(target => target && !target.destroyed);

  // if no valid targets remain, return a default point to avoid further issues.
  if (validTargets.length === 0)
  {
    return new Point(0, 0);
  }

  // calculate the average position of all valid targets.
  const pos = new Point();
  for (const target of validTargets)
  {
    const tpos = this.targetSpritePosition(target);
    pos.x += tpos.x;
    pos.y += tpos.y;
  }
  pos.x /= validTargets.length;
  pos.y /= validTargets.length;

  return pos;
};

/**
 * Extends {@link Sprite_Animation.prototype.targetSpritePosition}.<br/>
 * Adds a definitive guard against null or destroyed sprites to prevent crashes during transformation updates.
 * @param {Sprite} sprite The sprite to get the position of.
 * @returns {Point}
 */
J.ABS.Aliased.Sprite_Animation.set('targetSpritePosition', Sprite_Animation.prototype.targetSpritePosition);
Sprite_Animation.prototype.targetSpritePosition = function (sprite)
{
  // if the sprite doesn't exist or is destroyed, return a default point.
  if (!sprite || sprite.destroyed)
  {
    return new Point(0, 0);
  }

  // if the sprite has a character that is a JABS action being removed, return a default point.
  if (sprite.character() && sprite.character().getJabsActionNeedsRemoving())
  {
    return new Point(0, 0);
  }

  // perform original logic.
  try
  {
    // perform original logic.
    return J.ABS.Aliased.Sprite_Animation.get('targetSpritePosition')
      .call(this, sprite);
  }
  catch
  {
    // silently fail and return a neutral point to prevent console flooding. this runs per frame
    // per animation target, so anything written here arrives thousands of times a second - which
    // is why it stays silent even though every other catch in this repo reports.
    return new Point(0, 0);
  }
};
//endregion Sprite_Animation