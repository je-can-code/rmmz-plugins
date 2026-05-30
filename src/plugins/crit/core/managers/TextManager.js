//region TextManager
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
    // handle this switch arm for the current discriminant.
    case 1:
      return "Crit Block";
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
        // policy step inside crit param description.
        "The numeric value to the intensity of one's critical hits.",
        "Higher amounts of this yield bigger critical hits." ];
    case 1:
      // hand back [ to the caller.
      return [
        "The numeric value to one's percent reduction of critical damage.",
        "Enemy critical amp is directly reduced by this amount." ];
  }
};
//endregion TextManager
