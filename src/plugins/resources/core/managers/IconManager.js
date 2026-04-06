//region IconManager
/**
 * Gets the icon index for the HP skill cost parameter.
 * Mirrors {@link IconManager.sparam} entries for MCR (964) and TCR (965).
 * @returns {number}
 */
IconManager.hpCost = function()
{
  return 928;
};

/**
 * Extends {@link IconManager.longParam}.<br/>
 * Adds longParam ID 34 for the HP cost icon.
 * J-Resources registers ID 34 for this purpose.
 * @param {number} paramId The long parameter id.
 * @returns {number}
 */
J.RESOURCES.Aliased.IconManager.set('longParam', IconManager.longParam);
IconManager.longParam = function(paramId)
{
  // handle the hp cost longParam id.
  if (paramId === 34)
  {
    return this.hpCost();
  }

  // perform original logic.
  return J.RESOURCES.Aliased.IconManager.get('longParam')
    .call(this, paramId);
};
//endregion IconManager