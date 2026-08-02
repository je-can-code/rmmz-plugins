//region Sprite_AnimationMV
/**
 * Gets the MV-format animation data being played.
 * @returns {object} The animation.
 */
Sprite_AnimationMV.prototype.animation = function()
{
  // hand back the MV-format animation data being played.
  return this._animation;
};

/**
 * Gets the sprites this animation is playing against.
 * @returns {Sprite[]} The targets.
 */
Sprite_AnimationMV.prototype.targets = function()
{
  // hand back the sprites this animation is playing against.
  return this._targets;
};
//endregion Sprite_AnimationMV
