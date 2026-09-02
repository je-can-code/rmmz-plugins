//region Game_Character
/**
 * Creates the method for overwriting by subclasses.
 * At this level, it will return an empty list for non-events.
 * @abstract
 * @returns {Escription[]}
 */
Game_Character.prototype.escriptions = function()
{
  return [];
};

/**
 * Creates the method for overwriting by subclasses.
 * At this level, it will return false for non-events.
 * @abstract
 * @returns {boolean}
 */
Game_Character.prototype.hasEscriptions = function()
{
  return false;
};

/**
 * Creates the method for overwriting by subclasses.
 * At this level, it will do nothing.
 * @abstract
 */
Game_Character.prototype.parseEscriptionComments = function()
{
};
//endregion Game_Character