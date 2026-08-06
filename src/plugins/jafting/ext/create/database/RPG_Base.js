//region RPG_Base
/**
 * The ingredient types this entry can satisfy when a recipe asks for a category rather than a
 * specific database id.
 *
 * Empty for the overwhelming majority of database entries, which is the correct answer - most things
 * are not ingredients. Only entries deliberately tagged participate in categorical matching, so the
 * empty array is a meaningful "this fills no slots" rather than a missing value.
 * @returns {string[]}
 */
RPG_Base.prototype.ingredientTypes = function()
{
  return RPGManager.getStringsFromNoteByRegex(this, J.JAFTING.EXT.CREATE.RegExp.IngredientType);
};
//endregion RPG_Base