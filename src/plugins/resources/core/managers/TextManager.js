//region TextManager
/**
 * Gets the name of the HP skill cost parameter.
 * Mirrors {@link TextManager.sparam} entries for MCR ("Magi Cost") and TCR ("Tech Cost").
 * @returns {string}
 */
TextManager.hpCost = function()
{
  return 'Life Cost';
};

/**
 * Extends {@link TextManager.longParam}.<br/>
 * Adds longParam ID 34 for the HP cost label.
 * J-Resources registers ID 34 for this purpose.
 * @param {number} paramId The long parameter id.
 * @returns {string}
 */
J.RESOURCES.Aliased.TextManager.set('longParam', TextManager.longParam);
TextManager.longParam = function(paramId)
{
  // handle the hp cost longParam id.
  if (paramId === 34)
  {
    return this.hpCost();
  }

  // perform original logic.
  return J.RESOURCES.Aliased.TextManager.get('longParam')
    .call(this, paramId);
};
//endregion TextManager