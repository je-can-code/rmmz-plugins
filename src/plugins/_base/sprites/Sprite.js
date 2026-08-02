//region Sprite
/**
 * Whether this sprite manages its own opacity independently of the HUD system.
 * {@link Sprite_Icon} and {@link Sprite_BaseText} override this when flagged with
 * {@code _disableManagedOpacity}; all other sprites defer to external management.
 * @returns {boolean}
 */
Sprite.prototype.hasSelfManagedOpacity = function()
{
  // by default, sprites do not self-manage opacity.
  return false;
};

//endregion Sprite
