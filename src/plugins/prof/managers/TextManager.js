//region TextManager
/**
 * Extends {@link #longParam}.<br>
 * First checks if it is the proficiency paramId before searching for others.
 * @returns {string}
 */
J.PROF.Aliased.TextManager.set('longParam', TextManager.longParam);
TextManager.longParam = function(paramId)
{
  switch (paramId)
  {
    case 32:
      return this.proficiencyBonus(); // proficiency boost
    default:
      // perform original logic.
      return J.PROF.Aliased.TextManager.get('longParam').call(this, paramId);
  }
};

/**
 * Gets the proper name of "proficiency bonus", which is quite long, really.
 * @returns {string}
 */
TextManager.proficiencyBonus = function()
{
  return "Proficiency+";
};

/**
 * Extends {@link #longParamDescription}.<br>
 * First checks if it is the proficiency paramId before searching for others.
 * @returns {string[]}
 */
J.PROF.Aliased.TextManager.set('longParamDescription', TextManager.longParamDescription);
TextManager.longParamDescription = function(paramId)
{
  switch (paramId)
  {
    case 32:
      return this.proficiencyDescription(); // proficiency boost
    default:
      // perform original logic.
      return J.PROF.Aliased.TextManager.get('longParamDescription').call(this, paramId);
  }
};

/**
 * Gets the description text for the proficiency boost.
 * @returns {string[]}
 */
TextManager.proficiencyDescription = function()
{
  return [
    "The numeric bonus of proficiency gained when gaining proficiency.",
    "Higher amounts of this means achieving proficiency mastery faster."
  ];
};
//endregion TextManager