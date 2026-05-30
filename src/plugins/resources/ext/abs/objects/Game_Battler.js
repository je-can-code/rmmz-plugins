//region Game_Battler
Object.defineProperties(Game_BattlerBase.prototype, {
  /**
   * Lifesteal rate (% of HP damage dealt recovered as HP).
   */
  lst: {
    get: function()
    {
      return 0;
    },
    configurable: true,
  },

  /**
   * Manasteal rate (% of HP damage dealt recovered as MP).
   */
  mst: {
    get: function()
    {
      return 0;
    },
    configurable: true,
  },

  /**
   * Techsteal rate (% of HP damage dealt recovered as TP).
   */
  tst: {
    get: function()
    {
      return 0;
    },
    configurable: true,
  },
});

Object.defineProperty(Game_Battler.prototype, 'lst', {
  get: function()
  {
    let rate = this.baseLstRate();

    if (this.getSdpBonusForParameterKey)
    {
      rate += this.getSdpBonusForParameterKey('lst', 1);
    }

    return rate;
  },
  configurable: true,
});

Object.defineProperty(Game_Battler.prototype, 'mst', {
  get: function()
  {
    let rate = this.baseMstRate();

    if (this.getSdpBonusForParameterKey)
    {
      rate += this.getSdpBonusForParameterKey('mst', 1);
    }

    return rate;
  },
  configurable: true,
});

Object.defineProperty(Game_Battler.prototype, 'tst', {
  get: function()
  {
    let rate = this.baseTstRate();

    if (this.getSdpBonusForParameterKey)
    {
      rate += this.getSdpBonusForParameterKey('tst', 1);
    }

    return rate;
  },
  configurable: true,
});

/**
 * Sums lifesteal notetags into a decimal rate (5 → 0.05).
 * @returns {number}
 */
Game_Battler.prototype.baseLstRate = function()
{
  const bonus = RPGManager.getSumFromAllNotesByRegex(this.getAllNotes(), J.RESOURCES.EXT.ABS.RegExp.Lifesteal);

  // hand back bonus / 100 to the caller.
  return bonus / 100;
};

/**
 * Sums manasteal notetags into a decimal rate.
 * @returns {number}
 */
Game_Battler.prototype.baseMstRate = function()
{
  const bonus = RPGManager.getSumFromAllNotesByRegex(this.getAllNotes(), J.RESOURCES.EXT.ABS.RegExp.Manasteal);

  // hand back bonus / 100 to the caller.
  return bonus / 100;
};

/**
 * Sums techsteal notetags into a decimal rate.
 * @returns {number}
 */
Game_Battler.prototype.baseTstRate = function()
{
  const bonus = RPGManager.getSumFromAllNotesByRegex(this.getAllNotes(), J.RESOURCES.EXT.ABS.RegExp.Techsteal);

  // hand back bonus / 100 to the caller.
  return bonus / 100;
};
//endregion Game_Battler
