//region TextManager
/**
 * Extends {@link #longParam}.<br>
 * First checks if this is the move speed parameter, then checks others.
 */
J.ABS.EXT.SPEED.Aliased.TextManager.set('longParam', TextManager.longParam);
TextManager.longParam = function(paramId)
{
  switch (paramId)
  {
    case 31:
      return this.movespeed(); // move speed boost
    default:
      // perform original logic.
      return J.ABS.EXT.SPEED.Aliased.TextManager.get('longParam')
        .call(this, paramId);
  }
};

/**
 * Gets the proper name of "move speed boost".
 * @returns {string}
 */
TextManager.movespeed = function()
{
  return "Move Boost";
};

/**
 * Extends {@link #longParamDescription}.<br>
 * First checks if this is the move speed parameter, then checks others.
 */
J.ABS.EXT.SPEED.Aliased.TextManager.set('longParamDescription', TextManager.longParamDescription);
TextManager.longParamDescription = function(paramId)
{
  switch (paramId)
  {
    case 31:
      return this.moveSpeedDescription(); // move speed boost
    default:
      // perform original logic.
      return J.ABS.EXT.SPEED.Aliased.TextManager.get('longParamDescription')
        .call(this, paramId);
  }
};

/**
 * Gets the description text for the move speed boost.
 * @returns {string[]}
 */
TextManager.moveSpeedDescription = function()
{
  return [
    "The percentage modifier against this character's base movespeed.",
    "Higher amounts of this result in faster walk and run speeds." ];
};
//endregion TextManager