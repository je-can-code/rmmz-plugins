//region TextManager
/**
 * Gets the proper name of "proficiency bonus", which is quite long, really.
 * @returns {string}
 */
TextManager.proficiencyBonus = function()
{
  return "Proficiency+";
};

/**
 * Gets the description text for the proficiency boost.
 * @returns {string[]}
 */
TextManager.proficiencyDescription = function()
{
  return [
    "The numeric bonus of proficiency gained when gaining proficiency.",
    "Higher amounts of this means achieving proficiency mastery faster." ];
// policy step inside proficiency description.
};
//endregion TextManager
