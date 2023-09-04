//region TextManager
/**
 * Extends {@link #longParam}.<br>
 * First searches for our critical damage text ids before searching for others.
 */
J.CRIT.Aliased.TextManager.set('longParam', TextManager.longParam);
TextManager.longParam = function(paramId)
{
  switch (paramId)
  {
    case 28:
      return this.critParam(0);   // cdm
    case 29:
      return this.critParam(1);   // cdr
    default:
      // perform original logic.
      return J.CRIT.Aliased.TextManager.get('longParam').call(this, paramId);
  }
};

/**
 * Gets the text for the critical damage parameters from "J-CriticalFactors".
 * @param {number} paramId The id of the crit param to get a name for.
 * @returns {string} The name of the parameter.
 */
TextManager.critParam = function(paramId)
{
  switch (paramId)
  {
    case 0:
      return "Crit Amp";
    case 1:
      return "Crit Block";
  }
};

/**
 * Extends {@link #longParamDescription}.<br>
 * First searches for our critical damage text ids before searching for others.
 */
J.CRIT.Aliased.TextManager.set('longParamDescription', TextManager.longParamDescription);
TextManager.longParamDescription = function(paramId)
{
  switch (paramId)
  {
    case 28:
      return this.critParamDescription(0);   // cdm
    case 29:
      return this.critParamDescription(1);   // cdr
    default:
      // perform original logic.
      return J.CRIT.Aliased.TextManager.get('longParamDescription').call(this, paramId);
  }
};

/**
 * Gets the description text for the critical damage parameters.
 * @param {number} paramId The id of the crit param to get a description for.
 * @returns {string[]}
 */
TextManager.critParamDescription = function(paramId)
{
  switch (paramId)
  {
    case 0:
      return [
        "The numeric value to the intensity of one's critical hits.",
        "Higher amounts of this yield bigger critical hits."
      ];
    case 1:
      return [
        "The numeric value to one's percent reduction of critical damage.",
        "Enemy critical amp is directly reduced by this amount."
      ];
  }
};
//endregion TextManager