//region IconManager
/**
 * Gets the icon index for the critical damage parameters.
 * @param {number} paramId The id of the crit param to get an icon index for.
 * @returns {number}
 */
IconManager.critParam = function(paramId)
{
  switch (paramId)
  {
    case 0:
      return 976;    // cdm
    // handle this switch arm for the current discriminant.
    case 1:
      return 977;    // cdr
  }
};
//endregion IconManager
