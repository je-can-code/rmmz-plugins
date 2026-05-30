//region Game_Actor
Object.defineProperties(Game_BattlerBase.prototype, {
  /**
   * Gold drop rate multiplier bonus.
   */
  gdr: {
    get: function()
    {
      return 0;
    },
    configurable: true,
  },

  /**
   * Item drop rate multiplier bonus.
   */
  dor: {
    get: function()
    {
      return 0;
    },
    configurable: true,
  },
});

Object.defineProperty(Game_Actor.prototype, 'gdr', {
  get: function()
  {
    return this.getGoldMultiplier();
  },
  configurable: true,
});

Object.defineProperty(Game_Actor.prototype, 'dor', {
  get: function()
  {
    return this.getDropMultiplierBonus();
  },
  configurable: true,
});

/**
 * Gets this actor's bonus drop multiplier.
 * @returns {number}
 */
Game_Actor.prototype.getDropMultiplierBonus = function()
{
  // define the base multiplier.
  const baseMultiplier = 0;

  // grab all the notes.
  const objectsToCheck = this.getAllNotes();

  // get the multiplier from anything this battler has available.
  const multiplierBonus = RPGManager.getSumFromAllNotesByRegex(objectsToCheck, J.DROPS.RegExp.DropMultiplier);

  // calculate the multiplier factor.
  const factor = (multiplierBonus + baseMultiplier) / 100;

  // return the factor.
  return factor;
};

/**
 * Gets this actor's bonus gold multiplier.
 * @returns {number}
 */
Game_Actor.prototype.getGoldMultiplier = function()
{
  // define the base multiplier.
  const baseMultiplier = 0;

  // grab all the notes.
  const objectsToCheck = this.getAllNotes();

  // get the multiplier from anything this battler has available.
  const multiplierBonus = RPGManager.getSumFromAllNotesByRegex(objectsToCheck, J.DROPS.RegExp.GoldMultiplier);

  // calculate the multiplier factor.
  const factor = (multiplierBonus + baseMultiplier) / 100;

  // return the factor.
  return factor;
};
//endregion Game_Actor
