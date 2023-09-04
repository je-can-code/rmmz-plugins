//region IconManager
/**
 * Extend {@link #longParam}.<br>
 * First checks if the paramId was the proficiency boost before checking others.
 */
J.PROF.Aliased.IconManager.set('longParam', IconManager.longParam)
IconManager.longParam = function(paramId)
{
  switch (paramId)
  {
    case 32:
      return this.proficiencyBoost(); // prof
    default:
      return J.PROF.Aliased.IconManager.get('longParam').call(this, paramId);
  }
};

/**
 * Gets the icon index for the proficiency boost.
 * @return {number}
 */
IconManager.proficiencyBoost = function()
{
  return 979;
};
//endregion IconManager