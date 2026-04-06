//region ColorManager
/**
 * Gets the color for HP costs.
 * Mirrors the existing {@link ColorManager.mpCostColor} and {@link ColorManager.tpCostColor}.
 * @returns {string} The hex color string for HP cost text.
 */
ColorManager.hpCostColor = function()
{
  return this.textColor(18);
};
//endregion ColorManager