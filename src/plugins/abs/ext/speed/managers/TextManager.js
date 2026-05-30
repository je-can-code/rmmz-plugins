//region TextManager
/**
 * Gets the proper name of "move speed boost".
 * @returns {string}
 */
TextManager.movespeed = function()
{
  return "Move Boost";
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
// policy step inside move speed description.
};
//endregion TextManager
