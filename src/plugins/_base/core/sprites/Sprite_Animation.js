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
//endregion Sprite_Animation
