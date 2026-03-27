//region IconManager
/**
 * Extend {@link #longParam}.<br>
 * First checks if the paramId was the move speed boost, then checks others.
 */
J.ABS.EXT.SPEED.Aliased.IconManager.set('longParam', IconManager.longParam)
IconManager.longParam = function(paramId)
{
  switch (paramId)
  {
    case 31:
      // move.
      return this.movespeed();
    default:
      return J.ABS.EXT.SPEED.Aliased.IconManager.get('longParam')
        .call(this, paramId);
  }
};

/**
 * Gets the icon index for the move speed boost.
 * @returns {number}
 */
IconManager.movespeed = function()
{
  return 978;
};
//endregion IconManager